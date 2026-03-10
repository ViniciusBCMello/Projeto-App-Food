from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timezone
from app.auth import bp
from app.models import User
from app import limiter, db


@bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    data  = request.get_json()
    email = data.get("email", "").strip().lower()
    senha = data.get("senha", "")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_senha(senha) or not user.ativo:
        return jsonify({"erro": "E-mail ou senha incorretos."}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "usuario": {
            "id":    user.id,
            "nome":  user.nome,
            "email": user.email,
            "cargo": user.cargo,
        }
    }), 200


@bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Retorna os dados do usuário logado."""
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404

    return jsonify({
        "id":    user.id,
        "nome":  user.nome,
        "email": user.email,
        "cargo": user.cargo,
    }), 200