from flask import request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.produtos import bp
from app.models import Produto, Categoria, ProdutoCusto
from app import db
import os
import uuid
from datetime import date


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


# ─── Custos de produto ─────────────────────────────────────

@bp.route("/<int:id>/custos", methods=["GET"])
@jwt_required()
def listar_custos(id):
    produto = db.session.get(Produto, id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado."}), 404

    custos = (
        ProdutoCusto.query
        .filter_by(produto_id=id)
        .order_by(ProdutoCusto.data_vigencia.desc())
        .all()
    )
    return jsonify([{
        "id":             c.id,
        "produto_id":     c.produto_id,
        "custo_unitario": float(c.custo_unitario),
        "data_vigencia":  c.data_vigencia.isoformat(),
        "observacao":     c.observacao,
        "criado_em":      c.criado_em.isoformat() if c.criado_em else None,
    } for c in custos]), 200


@bp.route("/<int:id>/custos/vigente", methods=["GET"])
@jwt_required()
def custo_vigente(id):
    produto = db.session.get(Produto, id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado."}), 404

    custo = (
        ProdutoCusto.query
        .filter(
            ProdutoCusto.produto_id == id,
            ProdutoCusto.data_vigencia <= date.today()
        )
        .order_by(ProdutoCusto.data_vigencia.desc())
        .first()
    )

    if not custo:
        return jsonify({"erro": "Nenhum custo cadastrado para este produto."}), 404

    return jsonify({
        "id":             custo.id,
        "produto_id":     custo.produto_id,
        "custo_unitario": float(custo.custo_unitario),
        "data_vigencia":  custo.data_vigencia.isoformat(),
        "observacao":     custo.observacao,
    }), 200


@bp.route("/<int:id>/custos", methods=["POST"])
@jwt_required()
def criar_custo(id):
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    produto = db.session.get(Produto, id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado."}), 404

    data = request.get_json()
    custo_unitario = data.get("custo_unitario")
    data_vigencia  = data.get("data_vigencia")

    if not custo_unitario:
        return jsonify({"erro": "custo_unitario é obrigatório."}), 400

    try:
        data_vigencia = date.fromisoformat(data_vigencia) if data_vigencia else date.today()
    except ValueError:
        return jsonify({"erro": "data_vigencia inválida. Use YYYY-MM-DD."}), 400

    custo = ProdutoCusto(
        produto_id     = id,
        custo_unitario = custo_unitario,
        data_vigencia  = data_vigencia,
        observacao     = data.get("observacao", "").strip(),
    )
    db.session.add(custo)
    db.session.commit()

    return jsonify({
        "id":             custo.id,
        "produto_id":     custo.produto_id,
        "custo_unitario": float(custo.custo_unitario),
        "data_vigencia":  custo.data_vigencia.isoformat(),
        "observacao":     custo.observacao,
    }), 201


@bp.route("/<int:id>/custos/<int:custo_id>", methods=["DELETE"])
@jwt_required()
def excluir_custo(id, custo_id):
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    custo = db.session.get(ProdutoCusto, custo_id)
    if not custo or custo.produto_id != id:
        return jsonify({"erro": "Custo não encontrado."}), 404

    db.session.delete(custo)
    db.session.commit()
    return jsonify({"mensagem": "Custo excluído."}), 200