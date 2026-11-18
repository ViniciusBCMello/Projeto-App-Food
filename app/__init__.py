from flask import Flask, app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
bcrypt = Bcrypt()
limiter = Limiter(key_func=get_remote_address)
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dev.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hora
    app.config["UPLOAD_FOLDER"] = os.environ.get("UPLOAD_FOLDER", "app/uploads/produtos")
    app.config["MAX_CONTENT_LENGTH"] = int(os.environ.get("MAX_CONTENT_LENGTH", 5242880))
    app.config["JSON_ENSURE_ASCII"] = False

    # Inicializa as extensões
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    limiter.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # models
    from app import models  # noqa
    from app.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # blueprints
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    from app.core import bp as core_bp
    app.register_blueprint(core_bp, url_prefix="/")

    from app.produtos import bp as produtos_bp
    app.register_blueprint(produtos_bp, url_prefix="/produtos")

    from app.enderecos import bp as enderecos_bp
    app.register_blueprint(enderecos_bp, url_prefix="/enderecos")

    from app.pedidos import bp as pedidos_bp
    app.register_blueprint(pedidos_bp, url_prefix="/pedidos")

    # cli
    from app.cli import registrar_comandos
    registrar_comandos(app)

    return app