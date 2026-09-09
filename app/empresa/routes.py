from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.empresa import bp
from app.models import Empresa, FormaPagamento
from app import db
from app.utils.validacoes import validar_email, validar_telefone, limpar_telefone
from decimal import Decimal

TAXA_KM_PADRAO      = Decimal("1.50")
DISTANCIA_GRATUITA  = Decimal("1.00")  # km


def serializar_empresa(e):
    return {
        "id":            e.id,
        "razao_social":  e.razao_social,
        "nome_fantasia": e.nome_fantasia,
        "cnpj":          e.cnpj,
        "telefone":      e.telefone,
        "email":         e.email,
        "cep":           e.cep,
        "logradouro":    e.logradouro,
        "numero":        e.numero,
        "bairro":        e.bairro,
        "cidade":        e.cidade,
        "estado":        e.estado,
        "taxa_por_km":        float(e.taxa_por_km) if e.taxa_por_km else float(TAXA_KM_PADRAO),
        "distancia_gratuita": float(DISTANCIA_GRATUITA),
        "ativo":         e.ativo,
        # white-label
        "wl_nome_sistema":   e.wl_nome_sistema,
        "wl_cor_primaria":   e.wl_cor_primaria,
        "wl_cor_secundaria": e.wl_cor_secundaria,
        "wl_logo_url":       e.wl_logo_url,
        "wl_dominio":        e.wl_dominio,
        "wl_suporte_email":  e.wl_suporte_email,
        "wl_suporte_fone":   e.wl_suporte_fone,
        "wl_rodape_texto":   e.wl_rodape_texto,
    }


def serializar_forma(f):
    return {
        "id":                        f.id,
        "nome":                      f.nome,
        "taxa_operadora_percentual": float(f.taxa_operadora_percentual),
        "dias_para_recebimento":     f.dias_para_recebimento,
        "ativo":                     f.ativo,
    }


def requer_cargo(*cargos):
    from app.models import User
    user_id = get_jwt_identity()
    user    = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


# ─── GET empresa ────────────────────────────────────────────

@bp.route("/", methods=["GET"])
@jwt_required()
def get_empresa():
    empresa = Empresa.query.first()
    if not empresa:
        return jsonify({"erro": "Empresa não cadastrada ainda."}), 404
    return jsonify(serializar_empresa(empresa)), 200


# ─── Onboarding — criar empresa (time comercial) ───────────

@bp.route("/", methods=["POST"])
@jwt_required()
def criar_empresa():
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    if Empresa.query.first():
        return jsonify({"erro": "Empresa já cadastrada. Use PUT para editar."}), 400

    data = request.get_json()

    razao_social  = data.get("razao_social", "").strip()
    nome_fantasia = data.get("nome_fantasia", "").strip()
    cnpj          = data.get("cnpj", "").strip()
    email         = data.get("email", "").strip().lower()
    telefone      = data.get("telefone", "").strip()

    if not all([razao_social, nome_fantasia, cnpj]):
        return jsonify({"erro": "Razão social, nome fantasia e CNPJ são obrigatórios."}), 400

    if email and not validar_email(email):
        return jsonify({"erro": "E-mail inválido."}), 400

    if telefone and not validar_telefone(telefone):
        return jsonify({"erro": "Telefone inválido."}), 400

    taxa_km = data.get("taxa_por_km")

    empresa = Empresa(
        razao_social  = razao_social,
        nome_fantasia = nome_fantasia,
        cnpj          = cnpj,
        telefone      = limpar_telefone(telefone) if telefone else "",
        email         = email,
        cep           = data.get("cep", ""),
        logradouro    = data.get("logradouro", ""),
        numero        = data.get("numero", ""),
        bairro        = data.get("bairro", ""),
        cidade        = data.get("cidade", ""),
        estado        = data.get("estado", ""),
        taxa_por_km   = Decimal(str(taxa_km)) if taxa_km else TAXA_KM_PADRAO,
        ativo         = True,
        # white-label
        wl_nome_sistema   = data.get("wl_nome_sistema", nome_fantasia),
        wl_cor_primaria   = data.get("wl_cor_primaria", "#C41E1E"),
        wl_cor_secundaria = data.get("wl_cor_secundaria", "#0F0A0A"),
        wl_logo_url       = data.get("wl_logo_url", ""),
        wl_dominio        = data.get("wl_dominio", ""),
        wl_suporte_email  = data.get("wl_suporte_email", email),
        wl_suporte_fone   = data.get("wl_suporte_fone", ""),
        wl_rodape_texto   = data.get("wl_rodape_texto", f"© {nome_fantasia}. Todos os direitos reservados."),
    )
    db.session.add(empresa)
    db.session.commit()
    return jsonify(serializar_empresa(empresa)), 201


# ─── Editar empresa ─────────────────────────────────────────

@bp.route("/", methods=["PUT"])
@jwt_required()
def editar_empresa():
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    empresa = Empresa.query.first()
    if not empresa:
        return jsonify({"erro": "Empresa não cadastrada."}), 404

    data = request.get_json()

    if "razao_social"  in data: empresa.razao_social  = data["razao_social"].strip()
    if "nome_fantasia" in data: empresa.nome_fantasia = data["nome_fantasia"].strip()
    if "cnpj"          in data: empresa.cnpj          = data["cnpj"].strip()
    if "cep"           in data: empresa.cep           = data["cep"]
    if "logradouro"    in data: empresa.logradouro    = data["logradouro"]
    if "numero"        in data: empresa.numero        = data["numero"]
    if "bairro"        in data: empresa.bairro        = data["bairro"]
    if "cidade"        in data: empresa.cidade        = data["cidade"]
    if "estado"        in data: empresa.estado        = data["estado"]

    if "email" in data:
        if not validar_email(data["email"]):
            return jsonify({"erro": "E-mail inválido."}), 400
        empresa.email = data["email"].strip().lower()

    if "telefone" in data:
        if not validar_telefone(data["telefone"]):
            return jsonify({"erro": "Telefone inválido."}), 400
        empresa.telefone = limpar_telefone(data["telefone"])

    if "taxa_por_km" in data:
        taxa = Decimal(str(data["taxa_por_km"]))
        if taxa < 0:
            return jsonify({"erro": "Taxa por km não pode ser negativa."}), 400
        empresa.taxa_por_km = taxa

    db.session.commit()
    return jsonify(serializar_empresa(empresa)), 200


# ─── White-label — editar configurações visuais ─────────────

@bp.route("/white-label", methods=["PUT"])
@jwt_required()
def editar_whitelabel():
    """
    Exclusivo para o time comercial da Zentra.
    Permite configurar toda a identidade visual do cliente.
    """
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    empresa = Empresa.query.first()
    if not empresa:
        return jsonify({"erro": "Empresa não cadastrada."}), 404

    data = request.get_json()

    campos_wl = [
        "wl_nome_sistema",
        "wl_cor_primaria",
        "wl_cor_secundaria",
        "wl_logo_url",
        "wl_dominio",
        "wl_suporte_email",
        "wl_suporte_fone",
        "wl_rodape_texto",
    ]

    for campo in campos_wl:
        if campo in data:
            setattr(empresa, campo, data[campo])

    if "wl_suporte_email" in data and data["wl_suporte_email"]:
        if not validar_email(data["wl_suporte_email"]):
            return jsonify({"erro": "E-mail de suporte inválido."}), 400

    db.session.commit()
    return jsonify(serializar_empresa(empresa)), 200


# ─── Taxa de entrega ────────────────────────────────────────

@bp.route("/taxa-entrega", methods=["GET"])
def get_taxa():
    """Retorna a taxa configurada e calcula o valor para uma distância."""
    empresa    = Empresa.query.first()
    taxa_km    = float(empresa.taxa_por_km) if empresa and empresa.taxa_por_km else float(TAXA_KM_PADRAO)
    distancia  = request.args.get("distancia_km", type=float)

    resp = {
        "taxa_por_km":        taxa_km,
        "distancia_gratuita": float(DISTANCIA_GRATUITA),
        "info":               f"Entregas até {DISTANCIA_GRATUITA}km são gratuitas.",
    }

    if distancia is not None:
        if distancia <= float(DISTANCIA_GRATUITA):
            resp["valor_entrega"] = 0.00
            resp["calculo"]       = "Gratuito — dentro da faixa livre."
        else:
            valor = round(distancia * taxa_km, 2)
            resp["distancia_km"]  = distancia
            resp["valor_entrega"] = valor
            resp["calculo"]       = f"{distancia}km × R${taxa_km:.2f} = R${valor:.2f}"

    return jsonify(resp), 200


@bp.route("/taxa-entrega", methods=["PUT"])
@jwt_required()
def atualizar_taxa():
    """O restaurante atualiza sua própria taxa por km."""
    erro = requer_cargo("dono", "gerente")
    if erro:
        return erro

    empresa = Empresa.query.first()
    if not empresa:
        return jsonify({"erro": "Empresa não cadastrada."}), 404

    data = request.get_json()
    taxa = data.get("taxa_por_km")

    if taxa is None:
        return jsonify({"erro": "Campo taxa_por_km é obrigatório."}), 400

    taxa = Decimal(str(taxa))
    if taxa < 0:
        return jsonify({"erro": "Taxa não pode ser negativa."}), 400

    empresa.taxa_por_km = taxa
    db.session.commit()

    return jsonify({
        "mensagem":    "Taxa atualizada com sucesso.",
        "taxa_por_km": float(empresa.taxa_por_km),
        "info":        f"Entregas abaixo de {DISTANCIA_GRATUITA}km continuam gratuitas.",
    }), 200


# ─── Formas de pagamento ────────────────────────────────────

@bp.route("/formas-pagamento", methods=["GET"])
@jwt_required()
def listar_formas():
    formas = FormaPagamento.query.order_by(FormaPagamento.nome).all()
    return jsonify([serializar_forma(f) for f in formas]), 200


@bp.route("/formas-pagamento", methods=["POST"])
@jwt_required()
def criar_forma():
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    data = request.get_json()
    nome = data.get("nome", "").strip()

    if not nome:
        return jsonify({"erro": "Nome é obrigatório."}), 400

    if FormaPagamento.query.filter_by(nome=nome).first():
        return jsonify({"erro": "Forma de pagamento já existe."}), 400

    forma = FormaPagamento(
        nome                      = nome,
        taxa_operadora_percentual = data.get("taxa_operadora_percentual", 0),
        dias_para_recebimento     = data.get("dias_para_recebimento", 0),
        ativo                     = True,
    )
    db.session.add(forma)
    db.session.commit()
    return jsonify(serializar_forma(forma)), 201


@bp.route("/formas-pagamento/<int:id>", methods=["PUT"])
@jwt_required()
def editar_forma(id):
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    forma = db.session.get(FormaPagamento, id)
    if not forma:
        return jsonify({"erro": "Forma de pagamento não encontrada."}), 404

    data = request.get_json()
    if "nome"                      in data: forma.nome                      = data["nome"]
    if "taxa_operadora_percentual" in data: forma.taxa_operadora_percentual = data["taxa_operadora_percentual"]
    if "dias_para_recebimento"     in data: forma.dias_para_recebimento     = data["dias_para_recebimento"]
    if "ativo"                     in data: forma.ativo                     = data["ativo"]

    db.session.commit()
    return jsonify(serializar_forma(forma)), 200


@bp.route("/formas-pagamento/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_forma(id):
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    forma = db.session.get(FormaPagamento, id)
    if not forma:
        return jsonify({"erro": "Forma de pagamento não encontrada."}), 404

    db.session.delete(forma)
    db.session.commit()
    return jsonify({"mensagem": "Forma de pagamento excluída."}), 200