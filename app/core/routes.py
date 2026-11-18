from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core import bp
from app.models import User
from app import db


@bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))

    return jsonify({
        "mensagem": f"Bem-vindo, {user.nome}!",
        "cargo":    user.cargo,
    }), 200
