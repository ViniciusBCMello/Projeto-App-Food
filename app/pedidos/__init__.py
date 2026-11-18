from flask import Blueprint

bp = Blueprint("pedidos", __name__)

from app.pedidos import routes  # noqa