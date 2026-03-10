from flask import Blueprint

bp = Blueprint("enderecos", __name__)

from app.enderecos import routes  # noqa