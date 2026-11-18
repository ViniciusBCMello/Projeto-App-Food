from flask import Blueprint

# transforma a rota em 127.0.0.1:5000/auth
bp = Blueprint("auth", __name__)

from app.auth import routes  # noqa