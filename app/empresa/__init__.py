from flask import Blueprint

bp = Blueprint("empresa", __name__)

from app.empresa import routes  # noqa