from flask import Blueprint

bp = Blueprint("financeiro", __name__)

from app.financeiro import routes  # noqa