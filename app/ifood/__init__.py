from flask import Blueprint

bp = Blueprint("ifood", __name__)

from app.ifood import routes  # noqa: E402,F401
