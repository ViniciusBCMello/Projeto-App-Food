from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.financeiro import bp
from app.models import TransacaoFinanceira, Pedido, User, Empresa
from app import db
from datetime import datetime, timezone, date
from decimal import Decimal

# ── Categorias padrão ──────────────────────────────────────
CATEGORIAS_RECEITA = [
    "Pedido", "Outros"
]

CATEGORIAS_DESPESA = [
    "Acerto Motoboy", "Compra Insumos", "Aluguel",
    "Funcionário", "Manutenção", "Marketing", "Outros"
]

STATUS_VALIDOS = ["pendente", "pago", "cancelado"]


def requer_cargo(*cargos):
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


def serializar_transacao(t):
    return {
        "id":                  t.id,
        "tipo":                t.tipo,
        "categoria":           t.categoria,
        "descricao":           t.descricao,
        "valor_total":         float(t.valor_total),
        "data_vencimento":     t.data_vencimento.isoformat() if t.data_vencimento else None,
        "data_pagamento":      t.data_pagamento.isoformat() if t.data_pagamento else None,
        "status":              t.status,
        "pedido_id":           t.pedido_id,
        "forma_pagamento_id":  t.forma_pagamento_id,
        "banco_id":            t.banco_id,
        "fornecedor_id":       t.fornecedor_id,
        "favorecido_id":       t.favorecido_id,
        "favorecido_nome":     t.favorecido.nome if t.favorecido else None,
        "criado_em":           t.criado_em.isoformat() if t.criado_em else None,
    }


def _parse_date(val):
    if not val:
        return date.today()
    try:
        return date.fromisoformat(val)
    except Exception:
        return date.today()


# ── RECEITAS ───────────────────────────────────────────────

@bp.route("/receitas", methods=["GET"])
@jwt_required()
def listar_receitas():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    query = TransacaoFinanceira.query.filter_by(tipo="RECEITA")

    status    = request.args.get("status")
    categoria = request.args.get("categoria")
    de        = request.args.get("de")
    ate       = request.args.get("ate")

    if status:    query = query.filter_by(status=status)
    if categoria: query = query.filter_by(categoria=categoria)
    if de:        query = query.filter(TransacaoFinanceira.data_vencimento >= _parse_date(de))
    if ate:       query = query.filter(TransacaoFinanceira.data_vencimento <= _parse_date(ate))

    transacoes = query.order_by(TransacaoFinanceira.data_vencimento.desc()).all()

    total = sum(float(t.valor_total) for t in transacoes if t.status != "cancelado")

    return jsonify({
        "total":      total,
        "quantidade": len(transacoes),
        "categorias": CATEGORIAS_RECEITA,
        "itens":      [serializar_transacao(t) for t in transacoes],
    }), 200


@bp.route("/receitas", methods=["POST"])
@jwt_required()
def criar_receita():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    data      = request.get_json()
    descricao = data.get("descricao", "").strip()
    valor     = data.get("valor_total")
    categoria = data.get("categoria", "Outros")

    if not descricao or not valor:
        return jsonify({"erro": "Descrição e valor são obrigatórios."}), 400

    if categoria not in CATEGORIAS_RECEITA:
        return jsonify({
            "erro":      f"Categoria inválida.",
            "validas":   CATEGORIAS_RECEITA
        }), 400

    t = TransacaoFinanceira(
        tipo             = "RECEITA",
        categoria        = categoria,
        descricao        = descricao,
        valor_total      = Decimal(str(valor)),
        data_vencimento  = _parse_date(data.get("data_vencimento")),
        data_pagamento   = _parse_date(data.get("data_pagamento")) if data.get("data_pagamento") else None,
        status           = data.get("status", "pendente"),
        pedido_id        = data.get("pedido_id"),
        forma_pagamento_id = data.get("forma_pagamento_id"),
        banco_id         = data.get("banco_id"),
        favorecido_id    = data.get("favorecido_id"),
        criado_em        = datetime.now(timezone.utc),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(serializar_transacao(t)), 201


# ── DESPESAS ───────────────────────────────────────────────

@bp.route("/despesas", methods=["GET"])
@jwt_required()
def listar_despesas():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    query = TransacaoFinanceira.query.filter_by(tipo="DESPESA")

    status    = request.args.get("status")
    categoria = request.args.get("categoria")
    de        = request.args.get("de")
    ate       = request.args.get("ate")

    if status:    query = query.filter_by(status=status)
    if categoria: query = query.filter_by(categoria=categoria)
    if de:        query = query.filter(TransacaoFinanceira.data_vencimento >= _parse_date(de))
    if ate:       query = query.filter(TransacaoFinanceira.data_vencimento <= _parse_date(ate))

    transacoes = query.order_by(TransacaoFinanceira.data_vencimento.desc()).all()

    total = sum(float(t.valor_total) for t in transacoes if t.status != "cancelado")

    return jsonify({
        "total":      total,
        "quantidade": len(transacoes),
        "categorias": CATEGORIAS_DESPESA,
        "itens":      [serializar_transacao(t) for t in transacoes],
    }), 200


@bp.route("/despesas", methods=["POST"])
@jwt_required()
def criar_despesa():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    data      = request.get_json()
    descricao = data.get("descricao", "").strip()
    valor     = data.get("valor_total")
    categoria = data.get("categoria", "Outros")

    if not descricao or not valor:
        return jsonify({"erro": "Descrição e valor são obrigatórios."}), 400

    if categoria not in CATEGORIAS_DESPESA:
        return jsonify({
            "erro":    "Categoria inválida.",
            "validas": CATEGORIAS_DESPESA
        }), 400

    t = TransacaoFinanceira(
        tipo             = "DESPESA",
        categoria        = categoria,
        descricao        = descricao,
        valor_total      = Decimal(str(valor)),
        data_vencimento  = _parse_date(data.get("data_vencimento")),
        data_pagamento   = _parse_date(data.get("data_pagamento")) if data.get("data_pagamento") else None,
        status           = data.get("status", "pendente"),
        fornecedor_id    = data.get("fornecedor_id"),
        banco_id         = data.get("banco_id"),
        favorecido_id    = data.get("favorecido_id"),
        criado_em        = datetime.now(timezone.utc),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(serializar_transacao(t)), 201


# ── MOVIMENTOS (visão consolidada) ─────────────────────────

@bp.route("/movimentos", methods=["GET"])
@jwt_required()
def listar_movimentos():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    query = TransacaoFinanceira.query

    tipo      = request.args.get("tipo")       # RECEITA | DESPESA
    status    = request.args.get("status")
    categoria = request.args.get("categoria")
    de        = request.args.get("de")
    ate       = request.args.get("ate")

    if tipo:      query = query.filter_by(tipo=tipo.upper())
    if status:    query = query.filter_by(status=status)
    if categoria: query = query.filter_by(categoria=categoria)
    if de:        query = query.filter(TransacaoFinanceira.data_vencimento >= _parse_date(de))
    if ate:       query = query.filter(TransacaoFinanceira.data_vencimento <= _parse_date(ate))

    transacoes = query.order_by(TransacaoFinanceira.data_vencimento.desc()).all()

    receitas  = sum(float(t.valor_total) for t in transacoes if t.tipo == "RECEITA"  and t.status != "cancelado")
    despesas  = sum(float(t.valor_total) for t in transacoes if t.tipo == "DESPESA"  and t.status != "cancelado")
    saldo     = round(receitas - despesas, 2)

    return jsonify({
        "resumo": {
            "receitas":  round(receitas, 2),
            "despesas":  round(despesas, 2),
            "saldo":     saldo,
            "situacao":  "positivo" if saldo >= 0 else "negativo",
        },
        "quantidade": len(transacoes),
        "itens":      [serializar_transacao(t) for t in transacoes],
    }), 200


@bp.route("/movimentos/<int:id>", methods=["GET"])
@jwt_required()
def detalhe_movimento(id):
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    t = db.session.get(TransacaoFinanceira, id)
    if not t:
        return jsonify({"erro": "Transação não encontrada."}), 404

    return jsonify(serializar_transacao(t)), 200


@bp.route("/movimentos/<int:id>", methods=["PUT"])
@jwt_required()
def editar_movimento(id):
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    t = db.session.get(TransacaoFinanceira, id)
    if not t:
        return jsonify({"erro": "Transação não encontrada."}), 404

    if t.status == "cancelado":
        return jsonify({"erro": "Não é possível editar uma transação cancelada."}), 400

    data = request.get_json()

    if "descricao"       in data: t.descricao       = data["descricao"]
    if "valor_total"     in data: t.valor_total      = Decimal(str(data["valor_total"]))
    if "categoria"       in data: t.categoria        = data["categoria"]
    if "data_vencimento" in data: t.data_vencimento  = _parse_date(data["data_vencimento"])
    if "banco_id"        in data: t.banco_id         = data["banco_id"]
    if "fornecedor_id"   in data: t.fornecedor_id    = data["fornecedor_id"]

    db.session.commit()
    return jsonify(serializar_transacao(t)), 200


# ── PAGAR / CANCELAR ───────────────────────────────────────

@bp.route("/movimentos/<int:id>/pagar", methods=["PATCH"])
@jwt_required()
def pagar_movimento(id):
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    t = db.session.get(TransacaoFinanceira, id)
    if not t:
        return jsonify({"erro": "Transação não encontrada."}), 404

    if t.status == "cancelado":
        return jsonify({"erro": "Transação cancelada não pode ser paga."}), 400

    if t.status == "pago":
        return jsonify({"erro": "Transação já está paga."}), 400

    data              = request.get_json() or {}
    t.status          = "pago"
    t.data_pagamento  = _parse_date(data.get("data_pagamento")) if data.get("data_pagamento") else date.today()
    if "banco_id" in data:
        t.banco_id = data["banco_id"]

    db.session.commit()
    return jsonify(serializar_transacao(t)), 200


@bp.route("/movimentos/<int:id>/cancelar", methods=["PATCH"])
@jwt_required()
def cancelar_movimento(id):
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    t = db.session.get(TransacaoFinanceira, id)
    if not t:
        return jsonify({"erro": "Transação não encontrada."}), 404

    if t.status == "cancelado":
        return jsonify({"erro": "Transação já cancelada."}), 400

    t.status = "cancelado"
    db.session.commit()
    return jsonify({"mensagem": "Transação cancelada.", "id": t.id}), 200


# ── RECIBO ─────────────────────────────────────────────────

@bp.route("/movimentos/<int:id>/recibo", methods=["GET"])
@jwt_required()
def gerar_recibo(id):
    """
    Gera o recibo em JSON estruturado.
    Base para geração de PDF no futuro.
    """
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    t       = db.session.get(TransacaoFinanceira, id)
    empresa = Empresa.query.first()

    if not t:
        return jsonify({"erro": "Transação não encontrada."}), 404

    if t.status != "pago":
        return jsonify({"erro": "Recibo só pode ser gerado para transações pagas."}), 400

    numero_recibo = f"REC-{t.id:06d}"

    recibo = {
        "recibo": {
            "numero":          numero_recibo,
            "emitido_em":      datetime.now(timezone.utc).isoformat(),
            "tipo":            t.tipo,
            "status":          t.status,
        },
        "emitente": {
            "razao_social":    empresa.razao_social  if empresa else "—",
            "nome_fantasia":   empresa.nome_fantasia if empresa else "—",
            "cnpj":            empresa.cnpj          if empresa else "—",
            "endereco":        f"{empresa.logradouro}, {empresa.numero} — {empresa.cidade}/{empresa.estado}" if empresa else "—",
        },
        "transacao": {
            "id":              t.id,
            "categoria":       t.categoria,
            "descricao":       t.descricao,
            "valor_total":     float(t.valor_total),
            "data_vencimento": t.data_vencimento.isoformat() if t.data_vencimento else None,
            "data_pagamento":  t.data_pagamento.isoformat()  if t.data_pagamento  else None,
        },
        "favorecido": {
            "nome":            t.favorecido.nome if t.favorecido else "—",
        },
        "observacao": "Documento gerado eletronicamente. Válido como comprovante de pagamento.",
    }

    return jsonify(recibo), 200


# ── ACERTO MOTOBOY ─────────────────────────────────────────

@bp.route("/acerto-motoboy", methods=["GET"])
@jwt_required()
def listar_acertos():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    acertos = TransacaoFinanceira.query.filter_by(
        tipo="DESPESA", categoria="Acerto Motoboy"
    ).order_by(TransacaoFinanceira.data_vencimento.desc()).all()

    return jsonify([serializar_transacao(t) for t in acertos]), 200


@bp.route("/acerto-motoboy", methods=["POST"])
@jwt_required()
def criar_acerto_motoboy():
    """
    Calcula e registra o repasse ao motoboy
    com base nas entregas do período.
    """
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    data       = request.get_json()
    motoboy_id = data.get("motoboy_id")
    de         = data.get("de")
    ate        = data.get("ate")

    if not motoboy_id or not de or not ate:
        return jsonify({"erro": "motoboy_id, de e ate são obrigatórios."}), 400

    motoboy = db.session.get(User, motoboy_id)
    if not motoboy or motoboy.cargo != "motoboy":
        return jsonify({"erro": "Motoboy não encontrado."}), 404

    empresa = Empresa.query.first()
    taxa_km = float(empresa.taxa_por_km) if empresa and empresa.taxa_por_km else 1.50

    # Busca pedidos entregues pelo motoboy no período
    pedidos = Pedido.query.filter(
        Pedido.motoboy_id == motoboy_id,
        Pedido.entregue   == True,
        Pedido.criado_em  >= _parse_date(de),
        Pedido.criado_em  <= _parse_date(ate),
    ).all()

    if not pedidos:
        return jsonify({"erro": "Nenhuma entrega encontrada no período."}), 400

    detalhes    = []
    total_km    = 0.0
    total_valor = 0.0

    for p in pedidos:
        km    = float(p.distancia_km or 0)
        valor = round(km * taxa_km, 2) if km > 1.0 else 0.0
        total_km    += km
        total_valor += valor
        detalhes.append({
            "pedido_numero": p.numero,
            "distancia_km":  km,
            "valor_repasse": valor,
        })

    total_valor = round(total_valor, 2)

    # Cria a transação de despesa
    t = TransacaoFinanceira(
        tipo            = "DESPESA",
        categoria       = "Acerto Motoboy",
        descricao       = f"Acerto {motoboy.nome} — {de} a {ate} ({len(pedidos)} entregas, {round(total_km,2)}km)",
        valor_total     = Decimal(str(total_valor)),
        data_vencimento = date.today(),
        status          = "pendente",
        favorecido_id   = motoboy_id,
        criado_em       = datetime.now(timezone.utc),
    )
    db.session.add(t)
    db.session.commit()

    return jsonify({
        "transacao_id":    t.id,
        "motoboy":         motoboy.nome,
        "periodo":         {"de": de, "ate": ate},
        "total_entregas":  len(pedidos),
        "total_km":        round(total_km, 2),
        "taxa_por_km":     taxa_km,
        "total_repasse":   total_valor,
        "status":          "pendente",
        "detalhes":        detalhes,
    }), 201


# ── RESUMO ─────────────────────────────────────────────────

@bp.route("/resumo", methods=["GET"])
@jwt_required()
def resumo():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    de  = request.args.get("de",  date.today().replace(day=1).isoformat())
    ate = request.args.get("ate", date.today().isoformat())

    transacoes = TransacaoFinanceira.query.filter(
        TransacaoFinanceira.data_vencimento >= _parse_date(de),
        TransacaoFinanceira.data_vencimento <= _parse_date(ate),
        TransacaoFinanceira.status          != "cancelado",
    ).all()

    receitas_pagas    = sum(float(t.valor_total) for t in transacoes if t.tipo == "RECEITA" and t.status == "pago")
    receitas_pendente = sum(float(t.valor_total) for t in transacoes if t.tipo == "RECEITA" and t.status == "pendente")
    despesas_pagas    = sum(float(t.valor_total) for t in transacoes if t.tipo == "DESPESA" and t.status == "pago")
    despesas_pendente = sum(float(t.valor_total) for t in transacoes if t.tipo == "DESPESA" and t.status == "pendente")

    saldo_realizado = round(receitas_pagas    - despesas_pagas,    2)
    saldo_previsto  = round(receitas_pendente - despesas_pendente, 2)

    # Despesas por categoria
    por_categoria = {}
    for t in transacoes:
        if t.tipo == "DESPESA":
            por_categoria[t.categoria] = round(
                por_categoria.get(t.categoria, 0) + float(t.valor_total), 2
            )

    return jsonify({
        "periodo":    {"de": de, "ate": ate},
        "receitas": {
            "pagas":    round(receitas_pagas,    2),
            "pendente": round(receitas_pendente, 2),
            "total":    round(receitas_pagas + receitas_pendente, 2),
        },
        "despesas": {
            "pagas":    round(despesas_pagas,    2),
            "pendente": round(despesas_pendente, 2),
            "total":    round(despesas_pagas + despesas_pendente, 2),
            "por_categoria": por_categoria,
        },
        "saldo": {
            "realizado": saldo_realizado,
            "previsto":  saldo_previsto,
            "situacao":  "positivo" if saldo_realizado >= 0 else "negativo",
        },
    }), 200