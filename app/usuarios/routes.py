from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.usuarios import bp
from app.models import User, MotoboyDetalhe
from app import db
from app.utils.validacoes import validar_cpf, validar_email, validar_telefone, limpar_cpf, limpar_telefone


CARGOS_VALIDOS = ["dono", "administracao", "gerente", "atendente", "motoboy", "cliente"]


def requer_cargo(*cargos):
    from app.models import User
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


def serializar_user(u):
    dados = {
        "id":         u.id,
        "nome":       u.nome,
        "email":      u.email,
        "cargo":      u.cargo,
        "telefone":   u.telefone,
        "cpf":        u.cpf,
        "ativo":      u.ativo,
        "criado_em":  u.criado_em.isoformat() if u.criado_em else None,
    }
    # Se for motoboy, inclui os detalhes
    if u.cargo == "motoboy" and u.detalhes_motoboy:
        dados["motoboy"] = {
            "cnh":            u.detalhes_motoboy.cnh,
            "placa_veiculo":  u.detalhes_motoboy.placa_veiculo,
            "modelo_veiculo": u.detalhes_motoboy.modelo_veiculo,
        }
    return dados


# ─── Listar ────────────────────────────────────────────────

@bp.route("/", methods=["GET"])
@jwt_required()
def listar():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    cargo  = request.args.get("cargo")
    query  = User.query

    if cargo:
        query = query.filter_by(cargo=cargo)

    users = query.order_by(User.nome).all()
    return jsonify([serializar_user(u) for u in users]), 200


# ─── Detalhe ───────────────────────────────────────────────

@bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def detalhe(id):
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    user = db.session.get(User, id)
    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404

    return jsonify(serializar_user(user)), 200


# ─── Criar funcionário ─────────────────────────────────────

@bp.route("/", methods=["POST"])
@jwt_required()
def criar():
    erro = requer_cargo("dono")
    if erro:
        return erro

    data  = request.get_json()
    nome  = data.get("nome", "").strip()
    email = data.get("email", "").strip().lower()
    senha = data.get("senha", "")
    cargo = data.get("cargo", "atendente")
    cpf   = data.get("cpf", "").strip()
    telefone = data.get("telefone", "").strip()

    if not validar_email(email):
        return jsonify({"erro": "E-mail inválido."}), 400

    if not validar_cpf(cpf):
        return jsonify({"erro": "CPF inválido."}), 400

    if telefone and not validar_telefone(telefone):
        return jsonify({"erro": "Telefone inválido. Use o formato (DDD) 9XXXX-XXXX."}), 400

    if not all([nome, email, senha, cpf]):
        return jsonify({"erro": "Nome, email, senha e CPF são obrigatórios."}), 400

    if cargo not in CARGOS_VALIDOS:
        return jsonify({"erro": f"Cargo inválido. Use: {CARGOS_VALIDOS}"}), 400

    if len(senha) < 8:
        return jsonify({"erro": "Senha deve ter ao menos 8 caracteres."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"erro": "E-mail já cadastrado."}), 400

    if User.query.filter_by(cpf=cpf).first():
        return jsonify({"erro": "CPF já cadastrado."}), 400

    user = User(
        nome = nome,
        email = email,
        cargo = cargo,
        cpf = limpar_cpf(cpf),
        telefone = limpar_telefone (telefone) if telefone else "",
        ativo = True,
    )
    user.set_senha(senha)
    db.session.add(user)
    db.session.flush()  # gera o id antes do commit

    # Se for motoboy, salva os detalhes
    if cargo == "motoboy":
        detalhe = MotoboyDetalhe(
            user_id        = user.id,
            cnh            = data.get("cnh", "").strip(),
            placa_veiculo  = data.get("placa_veiculo", "").strip(),
            modelo_veiculo = data.get("modelo_veiculo", "").strip(),
        )
        db.session.add(detalhe)

    db.session.commit()
    return jsonify(serializar_user(user)), 201


# ─── Editar ────────────────────────────────────────────────

@bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def editar(id):
    erro = requer_cargo("dono")
    if erro:
        return erro

    user = db.session.get(User, id)
    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404

    data = request.get_json()

    user.nome     = data.get("nome",     user.nome).strip()
    user.telefone = data.get("telefone", user.telefone)
    user.ativo    = data.get("ativo",    user.ativo)

    # Só dono pode mudar cargo
    novo_cargo = data.get("cargo")
    if novo_cargo:
        if novo_cargo not in CARGOS_VALIDOS:
            return jsonify({"erro": f"Cargo inválido. Use: {CARGOS_VALIDOS}"}), 400
        user.cargo = novo_cargo

    # Troca de senha opcional
    nova_senha = data.get("senha")
    if nova_senha:
        if len(nova_senha) < 8:
            return jsonify({"erro": "Senha deve ter ao menos 8 caracteres."}), 400
        user.set_senha(nova_senha)

    # Atualiza detalhes do motoboy
    if user.cargo == "motoboy":
        detalhe = user.detalhes_motoboy
        if not detalhe:
            detalhe = MotoboyDetalhe(user_id=user.id)
            db.session.add(detalhe)
        detalhe.cnh            = data.get("cnh",            detalhe.cnh if detalhe else "")
        detalhe.placa_veiculo  = data.get("placa_veiculo",  detalhe.placa_veiculo if detalhe else "")
        detalhe.modelo_veiculo = data.get("modelo_veiculo", detalhe.modelo_veiculo if detalhe else "")

    db.session.commit()
    return jsonify(serializar_user(user)), 200


# ─── Ativar / Desativar ────────────────────────────────────

@bp.route("/<int:id>/toggle-ativo", methods=["PATCH"])
@jwt_required()
def toggle_ativo(id):
    erro = requer_cargo("dono")
    if erro:
        return erro

    user = db.session.get(User, id)
    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404

    user.ativo = not user.ativo
    db.session.commit()

    status = "ativado" if user.ativo else "desativado"
    return jsonify({"mensagem": f"Usuário {status}.", "ativo": user.ativo}), 200


# ─── Perfil próprio ────────────────────────────────────────

@bp.route("/perfil", methods=["GET"])
@jwt_required()
def perfil():
    """Qualquer usuário pode ver e editar o próprio perfil."""
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    return jsonify(serializar_user(user)), 200


@bp.route("/perfil", methods=["PUT"])
@jwt_required()
def editar_perfil():
    """Qualquer usuário pode editar nome, telefone e senha."""
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    data    = request.get_json()

    user.nome     = data.get("nome",     user.nome).strip()
    user.telefone = data.get("telefone", user.telefone)

    nova_senha = data.get("senha")
    if nova_senha:
        if len(nova_senha) < 8:
            return jsonify({"erro": "Senha deve ter ao menos 8 caracteres."}), 400
        user.set_senha(nova_senha)

    db.session.commit()
    return jsonify(serializar_user(user)), 200