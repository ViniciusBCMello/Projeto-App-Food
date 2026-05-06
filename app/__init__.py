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


    database_url = os.environ.get("DATABASE_URL", "sqlite:///dev.db")

    # Render usa postgres://, SQLAlchemy exige postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)


    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hora
    app.config["UPLOAD_FOLDER"] = os.environ.get("UPLOAD_FOLDER", os.path.join(app.root_path, "uploads"))
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
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

    from app.usuarios import bp as usuarios_bp
    app.register_blueprint(usuarios_bp, url_prefix="/usuarios")

    from app.empresa import bp as empresa_bp
    app.register_blueprint(empresa_bp, url_prefix="/empresa")

    from app.financeiro import bp as financeiro_bp
    app.register_blueprint(financeiro_bp, url_prefix="/financeiro")
    
    from app.relatorios import bp as relatorios_bp
    app.register_blueprint(relatorios_bp, url_prefix="/relatorios")

    # cli
    from app.cli import registrar_comandos
    registrar_comandos(app)

    return app