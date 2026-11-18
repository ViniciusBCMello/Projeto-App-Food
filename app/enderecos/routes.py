from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.enderecos import bp
from app.models import Endereco, User
from app import db


@bp.route("/", methods=["GET"])
@jwt_required()
def listar():
    """Lista os endereços do usuário logado."""
    user_id   = get_jwt_identity()
    enderecos = Endereco.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id":          e.id,
            "apelido":     e.apelido,
            "cep":         e.cep,
            "logradouro":  e.logradouro,
            "numero":      e.numero,
            "complemento": e.complemento,
            "bairro":      e.bairro,
            "cidade":      e.cidade,
            "estado":      e.estado,
            "referencia":  e.referencia,
            "principal":   e.principal,
        }
        for e in enderecos
    ]), 200


@bp.route("/", methods=["POST"])
@jwt_required()
def criar():
    """Adiciona um novo endereço para o usuário logado."""
    user_id = get_jwt_identity()
    data    = request.get_json()

    cep        = data.get("cep", "").strip()
    logradouro = data.get("logradouro", "").strip()
    numero     = data.get("numero", "").strip()
    bairro     = data.get("bairro", "").strip()
    cidade     = data.get("cidade", "").strip()
    estado     = data.get("estado", "").strip()

    if not all([cep, logradouro, numero, bairro, cidade, estado]):
        return jsonify({"erro": "Preencha todos os campos obrigatórios."}), 400

    # Se for o primeiro endereço, já marca como principal
    tem_endereco = Endereco.query.filter_by(user_id=user_id).first()
    principal    = not tem_endereco

    # Se o novo for marcado como principal, desmarca os outros
    if data.get("principal"):
        Endereco.query.filter_by(user_id=user_id).update({"principal": False})
        principal = True

    endereco = Endereco(
        user_id     = user_id,
        apelido     = data.get("apelido", "").strip(),
        cep         = cep,
        logradouro  = logradouro,
        numero      = numero,
        complemento = data.get("complemento", "").strip(),
        bairro      = bairro,
        cidade      = cidade,
        estado      = estado,
        referencia  = data.get("referencia", "").strip(),
        principal   = principal,
    )
    db.session.add(endereco)
    db.session.commit()

    return jsonify({
        "id":          endereco.id,
        "apelido":     endereco.apelido,
        "logradouro":  endereco.logradouro,
        "numero":      endereco.numero,
        "principal":   endereco.principal,
    }), 201


@bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def editar(id):
    """Edita um endereço do usuário logado."""
    user_id  = get_jwt_identity()
    endereco = db.session.get(Endereco, id)

    if not endereco or str(endereco.user_id) != user_id:
        return jsonify({"erro": "Endereço não encontrado."}), 404

    data = request.get_json()

    endereco.apelido     = data.get("apelido",     endereco.apelido)
    endereco.cep         = data.get("cep",         endereco.cep)
    endereco.logradouro  = data.get("logradouro",  endereco.logradouro)
    endereco.numero      = data.get("numero",      endereco.numero)
    endereco.complemento = data.get("complemento", endereco.complemento)
    endereco.bairro      = data.get("bairro",      endereco.bairro)
    endereco.cidade      = data.get("cidade",      endereco.cidade)
    endereco.estado      = data.get("estado",      endereco.estado)
    endereco.referencia  = data.get("referencia",  endereco.referencia)

    # Se marcar como principal, desmarca os outros
    if data.get("principal"):
        Endereco.query.filter_by(user_id=user_id).update({"principal": False})
        endereco.principal = True

    db.session.commit()

    return jsonify({"id": endereco.id, "apelido": endereco.apelido}), 200


@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir(id):
    """Remove um endereço do usuário logado."""
    user_id  = get_jwt_identity()
    endereco = db.session.get(Endereco, id)

    if not endereco or str(endereco.user_id) != user_id:
        return jsonify({"erro": "Endereço não encontrado."}), 404

    if endereco.principal:
        return jsonify({"erro": "Não é possível excluir o endereço principal."}), 400

    db.session.delete(endereco)
    db.session.commit()

    return jsonify({"mensagem": "Endereço excluído."}), 200


@bp.route("/<int:id>/principal", methods=["PATCH"])
@jwt_required()
def definir_principal(id):
    """Define um endereço como principal."""
    user_id  = get_jwt_identity()
    endereco = db.session.get(Endereco, id)

    if not endereco or str(endereco.user_id) != user_id:
        return jsonify({"erro": "Endereço não encontrado."}), 404

    Endereco.query.filter_by(user_id=user_id).update({"principal": False})
    endereco.principal = True
    db.session.commit()

    return jsonify({"mensagem": "Endereço principal atualizado."}), 200