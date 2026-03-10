from flask import request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.produtos import bp
from app.models import Produto, Categoria
from app import db
import os
import uuid


EXTENSOES_PERMITIDAS = {"png", "jpg", "jpeg", "webp"}

def extensao_permitida(filename):
    '''Verifica se a extensão do arquivo é permitida.'''
    return "." in filename and filename.rsplit(".", 1)[1].lower() in EXTENSOES_PERMITIDAS

def requer_cargo(*cargos):
    """Verifica se o usuário tem o cargo necessário."""
    from app.models import User
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


# ─── Imagens ────────────────────────────────────────────

@bp.route("/uploads/<filename>", methods=["GET"])
def servir_imagem(filename):
    pasta = os.path.join(current_app.root_path, current_app.config["UPLOAD_FOLDER"])
    return send_from_directory(pasta, filename)


# ─── Categorias ────────────────────────────────────────────

@bp.route("/categorias", methods=["GET"])
@jwt_required()
def listar_categorias():
    categorias = Categoria.query.filter_by(ativa=True).order_by(Categoria.nome).all()
    return jsonify([
        {"id": c.id, "nome": c.nome}
        for c in categorias
    ]), 200


@bp.route("/categorias", methods=["POST"])
@jwt_required()
def criar_categoria():
    '''Somente donos e gerentes podem criar categorias.'''
    erro = requer_cargo("dono", "gerente")
    if erro:
        return erro

    data = request.get_json()
    nome = data.get("nome", "").strip()

    if not nome:
        return jsonify({"erro": "Nome é obrigatório."}), 400

    if Categoria.query.filter_by(nome=nome).first():
        return jsonify({"erro": "Categoria já existe."}), 400

    categoria = Categoria(nome=nome)
    db.session.add(categoria)
    db.session.commit()

    return jsonify({"id": categoria.id, "nome": categoria.nome}), 201


@bp.route("/categorias/<int:id>", methods=["PUT"])
@jwt_required()
def editar_categoria(id):
    erro = requer_cargo("dono", "gerente")
    if erro:
        return erro

    categoria = db.session.get(Categoria, id)
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada."}), 404

    data          = request.get_json()
    categoria.nome  = data.get("nome", categoria.nome).strip()
    categoria.ativa = data.get("ativa", categoria.ativa)
    db.session.commit()

    return jsonify({"id": categoria.id, "nome": categoria.nome}), 200


@bp.route("/categorias/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_categoria(id):
    erro = requer_cargo("dono")
    if erro:
        return erro

    categoria = db.session.get(Categoria, id)
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada."}), 404

    # Verifica se tem produtos vinculados
    if categoria.produtos:
        return jsonify({"erro": "Categoria possui produtos vinculados."}), 400

    db.session.delete(categoria)
    db.session.commit()

    return jsonify({"mensagem": "Categoria excluída."}), 200


# ─── Produtos ──────────────────────────────────────────────

@bp.route("/", methods=["GET"])
@jwt_required()
def listar():
    categoria_id = request.args.get("categoria_id", type=int)
    query = Produto.query

    if categoria_id:
        query = query.filter_by(categoria_id=categoria_id)

    produtos = query.order_by(Produto.nome).all()

    return jsonify([
        {
            "id":           p.id,
            "nome":         p.nome,
            "descricao":    p.descricao,
            "preco":        float(p.preco),
            "disponivel":   p.disponivel,
            "categoria_id": p.categoria_id,
            "categoria":    p.categoria.nome if p.categoria else None,
            "imagem_url":   f"/produtos/uploads/{os.path.basename(p.imagem_url)}" if p.imagem_url else None,
        }
        for p in produtos
    ]), 200


@bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def detalhe(id):
    p = db.session.get(Produto, id)
    if not p:
        return jsonify({"erro": "Produto não encontrado."}), 404

    return jsonify({
        "id":           p.id,
        "nome":         p.nome,
        "descricao":    p.descricao,
        "preco":        float(p.preco),
        "disponivel":   p.disponivel,
        "categoria_id": p.categoria_id,
        "categoria":    p.categoria.nome if p.categoria else None,
        "imagem_url":   f"/produtos/uploads/{p.imagem_url}" if p.imagem_url else None,
    }), 200


@bp.route("/", methods=["POST"])
@jwt_required()
def criar():
    erro = requer_cargo("dono", "gerente")
    if erro:
        return erro

    nome         = request.form.get("nome", "").strip()
    descricao    = request.form.get("descricao", "").strip()
    preco        = request.form.get("preco")
    categoria_id = request.form.get("categoria_id", type=int)
    disponivel   = request.form.get("disponivel", "true").lower() == "true"

    if not nome or preco is None:
        return jsonify({"erro": "Nome e preço são obrigatórios."}), 400

    imagem_url = None
    if "imagem" in request.files:
        arquivo = request.files["imagem"]
        if arquivo and extensao_permitida(arquivo.filename):
            ext      = arquivo.filename.rsplit(".", 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            pasta_uploads = os.path.join(current_app.root_path, 'uploads')  
            os.makedirs(pasta_uploads, exist_ok=True)    
            caminho = os.path.join(pasta_uploads, filename)
            arquivo.save(caminho)
            imagem_url = filename

    produto = Produto(
        nome=nome,
        descricao=descricao,
        preco=preco,
        categoria_id=categoria_id,
        disponivel=disponivel,
        imagem_url=imagem_url,
    )
    db.session.add(produto)
    db.session.commit()

    return jsonify({"id": produto.id, "nome": produto.nome}), 201


@bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def editar(id):
    erro = requer_cargo("dono", "gerente")
    if erro:
        return erro

    produto = db.session.get(Produto, id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado."}), 404

    produto.nome         = request.form.get("nome", produto.nome).strip()
    produto.descricao    = request.form.get("descricao", produto.descricao)
    produto.preco        = request.form.get("preco", produto.preco)
    produto.categoria_id = request.form.get("categoria_id", produto.categoria_id, type=int)
    produto.disponivel   = request.form.get("disponivel", str(produto.disponivel)).lower() == "true"

    if "imagem" in request.files:
        arquivo = request.files["imagem"]
        if arquivo and extensao_permitida(arquivo.filename):
            pasta_uploads = os.path.join(current_app.root_path, 'uploads')
            os.makedirs(pasta_uploads, exist_ok=True)
            
            if produto.imagem_url:
                caminho_antigo = os.path.join(pasta_uploads, produto.imagem_url)
                if os.path.exists(caminho_antigo):
                    try:
                        os.remove(caminho_antigo)
                    except Exception as e:
                        print(f"Erro ao deletar imagem antiga: {e}")

            ext      = arquivo.filename.rsplit(".", 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            caminho_novo = os.path.join(pasta_uploads, filename)
            
            arquivo.save(caminho_novo)
            produto.imagem_url = filename

    db.session.commit()

    return jsonify({"id": produto.id, "nome": produto.nome}), 200


@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir(id):
    erro = requer_cargo("dono")
    if erro:
        return erro

    produto = db.session.get(Produto, id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado."}), 404

    # deleta imagem do servidor
    if produto.imagem_url and os.path.exists(produto.imagem_url):
        os.remove(produto.imagem_url)

    db.session.delete(produto)
    db.session.commit()

    return jsonify({"mensagem": "Produto excluído."}), 200