"""
Fixtures compartilhadas dos testes.

Cada teste roda contra um banco SQLite próprio (arquivo temporário), criado
do zero e destruído ao final — testes nunca compartilham estado entre si e
nunca tocam no banco de desenvolvimento/produção.
"""
import os
import tempfile

import pytest


@pytest.fixture()
def app():
    os.environ["SECRET_KEY"] = "test-secret"
    os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"

    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)  # fecha já aqui — no Windows, deixar aberto trava o arquivo pro SQLite
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    # importa depois de setar as env vars, para create_app() ler o banco certo
    from app import create_app, db as _db

    flask_app = create_app()
    flask_app.config.update(TESTING=True)

    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()
        _db.engine.dispose()  # libera a conexão/arquivo antes de tentar apagar (essencial no Windows)

    try:
        os.unlink(db_path)
    except PermissionError:
        # Em alguns ambientes Windows o SO ainda não liberou o handle a
        # tempo — não é um erro do teste em si, então não derruba a suíte.
        pass


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def db(app):
    from app import db as _db
    return _db


def _criar_usuario(db, nome, email, cargo, cpf):
    from app.models import User

    u = User(nome=nome, email=email, cargo=cargo, cpf=cpf)
    u.set_senha("senha1234")
    db.session.add(u)
    db.session.commit()
    return u


@pytest.fixture()
def dono(app, db):
    with app.app_context():
        return _criar_usuario(db, "Dono Teste", "dono@teste.com", "dono", "11111111111")


@pytest.fixture()
def auth_headers(client, dono):
    resp = client.post("/auth/login", json={"email": "dono@teste.com", "senha": "senha1234"})
    assert resp.status_code == 200, resp.get_json()
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def produto_teste(app, db):
    from app.models import Categoria, Produto

    with app.app_context():
        cat = Categoria(nome="Categoria Teste")
        db.session.add(cat)
        db.session.commit()
        produto = Produto(nome="Produto Teste", preco=25.90, categoria_id=cat.id)
        db.session.add(produto)
        db.session.commit()
        return produto.id
