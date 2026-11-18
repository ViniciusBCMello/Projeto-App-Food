from flask import Blueprint

bp = Blueprint("produtos", __name__)

from app.produtos import routes  # noqa