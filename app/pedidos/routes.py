from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.pedidos import bp
from app.models import Pedido, ItemPedido, Produto, User, Endereco
from app import db
from datetime import datetime, timezone

def gerar_numero_pedido():
    """Gera número sequencial diário: YYYYMMDD-XXXX"""
    hoje    = datetime.now(timezone.utc).date()
    prefixo = hoje.strftime("%Y%m%d")
    ultimo  = (
        Pedido.query
        .filter(Pedido.numero.like(f"{prefixo}-%"))
        .order_by(Pedido.id.desc())
        .first()
    )
    seq = int(ultimo.numero.split("-")[1]) + 1 if ultimo else 1
    return f"{prefixo}-{seq:04d}"

def serializar_pedido(pedido):
    return {
        "id":                  pedido.id,
        "numero":              pedido.numero,
        "status":              pedido.status,
        "total":               float(pedido.total),
        "forma_pagamento":     pedido.forma_pagamento,
        "observacoes":         pedido.observacoes,
        "entregue":            pedido.entregue,
        "motivo_nao_entrega":  pedido.motivo_nao_entrega,
        "endereco": {
            "logradouro":  pedido.endereco_logradouro,
            "numero":      pedido.endereco_numero,
            "complemento": pedido.endereco_complemento,
            "bairro":      pedido.endereco_bairro,
            "cidade":      pedido.endereco_cidade,
            "estado":      pedido.endereco_estado,
            "referencia":  pedido.endereco_referencia,
        },
        "cliente": {
            "id":       pedido.cliente.id,
            "nome":     pedido.cliente.nome,
            "telefone": pedido.cliente.telefone,
        } if pedido.cliente else None,
        "itens": [
            {
                "id":             item.id,
                "produto_id":     item.produto_id,
                "produto_nome":   item.produto.nome,
                "quantidade":     item.quantidade,
                "preco_unitario": float(item.preco_unitario),
                "subtotal":       float(item.subtotal),
            }
            for item in pedido.itens
        ],
        "criado_em": pedido.criado_em.isoformat(),
    }

# ─── Criar pedido ──────────────────────────────────────────

@bp.route("/", methods=["POST"])
@jwt_required()
def criar():
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404

    data             = request.get_json()
    itens            = data.get("itens", [])
    forma_pagamento  = data.get("forma_pagamento")
    observacoes      = data.get("observacoes", "")
    endereco_id      = data.get("endereco_id")

    if not itens:
        return jsonify({"erro": "O pedido precisa ter ao menos um item."}), 400

    if not forma_pagamento:
        return jsonify({"erro": "Forma de pagamento é obrigatória."}), 400

    if not endereco_id:
        return jsonify({"erro": "Endereço é obrigatório."}), 400

    # Busca o endereço escolhido pelo cliente
    endereco = db.session.get(Endereco, endereco_id)
    if not endereco or endereco.user_id != user.id:
        return jsonify({"erro": "Endereço inválido."}), 400

    # Cria o pedido
    pedido = Pedido(
        numero           = gerar_numero_pedido(),
        user_id          = user.id,
        forma_pagamento  = forma_pagamento,
        observacoes      = observacoes,
        status           = "aguardando",
        # Copia o endereço no momento do pedido
        endereco_cep         = endereco.cep,
        endereco_logradouro  = endereco.logradouro,
        endereco_numero      = endereco.numero,
        endereco_complemento = endereco.complemento,
        endereco_bairro      = endereco.bairro,
        endereco_cidade      = endereco.cidade,
        endereco_estado      = endereco.estado,
        endereco_referencia  = endereco.referencia,
    )
    db.session.add(pedido)

    # Adiciona os itens
    total = 0
    for item_data in itens:
        produto = db.session.get(Produto, item_data.get("produto_id"))

        if not produto or not produto.disponivel:
            db.session.rollback()
            return jsonify({"erro": f"Produto id={item_data.get('produto_id')} indisponível."}), 400

        quantidade = item_data.get("quantidade", 1)
        item = ItemPedido(
            produto_id     = produto.id,
            quantidade     = quantidade,
            preco_unitario = produto.preco,
        )
        pedido.itens.append(item)
        total += quantidade * float(produto.preco)

    pedido.total = total
    db.session.commit()

    return jsonify(serializar_pedido(pedido)), 201

# ─── Listar pedidos ────────────────────────────────────────

@bp.route("/", methods=["GET"])
@jwt_required()
def listar():
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))

    # Cliente vê só os próprios pedidos
    # Funcionários veem todos
    if user.cargo == "cliente":
        pedidos = Pedido.query.filter_by(user_id=user.id).order_by(Pedido.criado_em.desc()).all()
    else:
        status  = request.args.get("status")
        query   = Pedido.query
        if status:
            query = query.filter_by(status=status)
        pedidos = query.order_by(Pedido.criado_em.desc()).all()

    return jsonify([serializar_pedido(p) for p in pedidos]), 200


# ─── Detalhe do pedido ─────────────────────────────────────

@bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def detalhe(id):
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    pedido  = db.session.get(Pedido, id)

    if not pedido:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    # Cliente só pode ver o próprio pedido
    if user.cargo == "cliente" and pedido.user_id != user.id:
        return jsonify({"erro": "Sem permissão."}), 403

    return jsonify(serializar_pedido(pedido)), 200


# ─── Atualizar status ──────────────────────────────────────

STATUS_VALIDOS = ["aguardando", "em_preparo", "pronto", "saiu_entrega", "cheguei"]

@bp.route("/<int:id>/status", methods=["PATCH"])
@jwt_required()
def atualizar_status(id):
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))

    # Apenas funcionários atualizam status
    if not user.eh_funcionario():
        return jsonify({"erro": "Sem permissão."}), 403

    pedido     = db.session.get(Pedido, id)
    if not pedido:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    data       = request.get_json()
    novo_status = data.get("status")

    if novo_status not in STATUS_VALIDOS:
        return jsonify({"erro": f"Status inválido. Use: {STATUS_VALIDOS}"}), 400

    pedido.status = novo_status
    db.session.commit()

    return jsonify(serializar_pedido(pedido)), 200


# ─── Finalizar entrega ─────────────────────────────────────

@bp.route("/<int:id>/entrega", methods=["PATCH"])
@jwt_required()
def finalizar_entrega(id):
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))

    if user.cargo not in ["motoboy", "dono", "gerente"]:
        return jsonify({"erro": "Sem permissão."}), 403

    pedido = db.session.get(Pedido, id)
    if not pedido:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    data     = request.get_json()
    entregue = data.get("entregue")  # True ou False

    if entregue is None:
        return jsonify({"erro": "Campo 'entregue' é obrigatório."}), 400

    pedido.entregue = entregue
    if not entregue:
        pedido.motivo_nao_entrega = data.get("motivo", "Sem motivo informado")

    db.session.commit()

    return jsonify(serializar_pedido(pedido)), 200


# ─── Cancelar pedido ───────────────────────────────────────

@bp.route("/<int:id>/cancelar", methods=["PATCH"])
@jwt_required()
def cancelar(id):
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    pedido  = db.session.get(Pedido, id)

    if not pedido:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    # Cliente só cancela o próprio pedido e só se ainda estiver aguardando
    if user.cargo == "cliente":
        if pedido.user_id != user.id:
            return jsonify({"erro": "Sem permissão."}), 403
        if pedido.status != "aguardando":
            return jsonify({"erro": "Pedido não pode mais ser cancelado."}), 400

    pedido.status = "cancelado"
    db.session.commit()

    return jsonify({"mensagem": "Pedido cancelado.", "numero": pedido.numero}), 200