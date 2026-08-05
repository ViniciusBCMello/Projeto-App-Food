from flask import Blueprint

bp = Blueprint("food99", __name__)

from app.food99 import routes  # noqa: E402,F401
