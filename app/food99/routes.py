from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.food99 import bp
from app.food99 import client, service
from app.models import User, Pedido, Food99Credencial
from app import db


def requer_cargo(*cargos):
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


def _credencial_ativa():
    return Food99Credencial.query.filter_by(ativa=True).first()


def _serializar_credencial(cred):
    return {
        "id": cred.id,
        "app_id": cred.app_id,
        "app_shop_id": cred.app_shop_id,
        "base_url": cred.base_url,
        "autorizada": cred.autorizada,
        "ativa": cred.ativa,
        "token_valido": cred.token_valido,
    }


# ─── Credenciais e fluxo de autorização da loja ────────────────

@bp.route("/credenciais", methods=["GET"])
@jwt_required()
def ver_credenciais():
    erro = requer_cargo("dono", "administracao")
    if erro:
        return erro

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"configurado": False}), 200

    return jsonify({"configurado": True, **_serializar_credencial(cred)}), 200


@bp.route("/credenciais", methods=["POST"])
@jwt_required()
def configurar_credenciais():
    """
    Cadastra app_id/app_secret/app_shop_id desta instalação. Isso NÃO
    autoriza a loja ainda — depois de salvar, chame
    POST /99food/credenciais/autorizar para pegar a URL de aprovação.
    """
    erro = requer_cargo("dono")
    if erro:
        return erro

    data = request.get_json() or {}
    app_id = (data.get("app_id") or "").strip()
    app_secret = (data.get("app_secret") or "").strip()
    app_shop_id = (data.get("app_shop_id") or "").strip()
    base_url = (data.get("base_url") or "").strip().rstrip("/")

    if not all([app_id, app_secret, app_shop_id]):
        return jsonify({"erro": "app_id, app_secret e app_shop_id são obrigatórios."}), 400

    Food99Credencial.query.filter_by(ativa=True).update({"ativa": False})

    cred = Food99Credencial(app_id=app_id, app_secret=app_secret, app_shop_id=app_shop_id, ativa=True)
    if base_url:
        cred.base_url = base_url

    db.session.add(cred)
    db.session.commit()

    return jsonify({
        "mensagem": "Credenciais salvas. Agora chame POST /99food/credenciais/autorizar para obter o link de autorização.",
        **_serializar_credencial(cred),
    }), 201


@bp.route("/credenciais/autorizar", methods=["POST"])
@jwt_required()
def gerar_link_autorizacao():
    """
    Gera a URL que o dono da loja precisa acessar para aprovar o vínculo do
    app com a loja no 99Food (passo manual, uma vez por loja).
    """
    erro = requer_cargo("dono")
    if erro:
        return erro

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Configure as credenciais primeiro (POST /99food/credenciais)."}), 404

    try:
        url = client.gerar_url_autorizacao(cred)
    except client.Food99ApiError as e:
        return jsonify({"erro": f"99Food recusou a geração do link: {e}"}), 502

    return jsonify({"url_autorizacao": url,
                     "instrucao": "Acesse essa URL logado como dono da loja no 99Food e aprove o vínculo. "
                                   "Depois, chame POST /99food/credenciais/confirmar-autorizacao."}), 200


@bp.route("/credenciais/confirmar-autorizacao", methods=["POST"])
@jwt_required()
def confirmar_autorizacao():
    """
    Marca a loja como autorizada e tenta obter o primeiro auth_token — só
    funciona depois que o dono aprovou o vínculo pela URL gerada acima.
    """
    erro = requer_cargo("dono")
    if erro:
        return erro

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Configure as credenciais primeiro."}), 404

    cred.autorizada = True
    db.session.commit()

    try:
        client.obter_token_valido(cred)
    except client.Food99ApiError as e:
        cred.autorizada = False
        db.session.commit()
        return jsonify({
            "erro": "Não foi possível obter o token — a autorização pode não ter sido concluída ainda.",
            "detalhe": str(e),
        }), 400

    return jsonify({"mensagem": "Loja autorizada e token obtido com sucesso.", **_serializar_credencial(cred)}), 200


# ─── Sincronização manual de pedido (enquanto o mecanismo automático não é confirmado) ──

@bp.route("/pedidos/sincronizar", methods=["POST"])
@jwt_required()
def sincronizar_pedido():
    erro = requer_cargo("dono", "gerente", "atendente", "administracao")
    if erro:
        return erro

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração 99Food não configurada."}), 404

    data = request.get_json() or {}
    order_id = data.get("order_id")
    if not order_id:
        return jsonify({"erro": "order_id é obrigatório."}), 400

    try:
        pedido = service.sincronizar_pedido(cred, order_id)
    except client.Food99ApiError as e:
        return jsonify({"erro": f"Falha ao buscar o pedido no 99Food: {e}"}), 502

    return jsonify({"mensagem": "Pedido sincronizado.", "pedido_id": pedido.id, "numero": pedido.numero}), 200


# ─── Ações sobre um pedido vindo do 99Food ─────────────────────

def _localizar_pedido_99food(pedido_id):
    pedido = db.session.get(Pedido, pedido_id)
    if not pedido or pedido.origem != "99food":
        return None
    return pedido


@bp.route("/pedidos/<int:pedido_id>/confirmar", methods=["POST"])
@jwt_required()
def confirmar_pedido(pedido_id):
    erro = requer_cargo("dono", "gerente", "atendente", "administracao")
    if erro:
        return erro

    pedido = _localizar_pedido_99food(pedido_id)
    if not pedido:
        return jsonify({"erro": "Pedido do 99Food não encontrado."}), 404

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração 99Food não configurada."}), 404

    try:
        client.confirmar_pedido(cred, pedido.food99_order_id)
    except client.Food99ApiError as e:
        return jsonify({"erro": f"99Food recusou a confirmação: {e}"}), 502

    pedido.status = "em_preparo"
    db.session.commit()
    return jsonify({"mensagem": "Pedido confirmado junto ao 99Food."}), 200


@bp.route("/pedidos/<int:pedido_id>/pronto", methods=["POST"])
@jwt_required()
def marcar_pronto(pedido_id):
    erro = requer_cargo("dono", "gerente", "atendente", "administracao")
    if erro:
        return erro

    pedido = _localizar_pedido_99food(pedido_id)
    if not pedido:
        return jsonify({"erro": "Pedido do 99Food não encontrado."}), 404

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração 99Food não configurada."}), 404

    try:
        client.marcar_pronto(cred, pedido.food99_order_id)
    except client.Food99ApiError as e:
        return jsonify({"erro": f"99Food recusou a ação: {e}"}), 502

    pedido.status = "pronto"
    db.session.commit()
    return jsonify({"mensagem": "Pedido marcado como pronto."}), 200


@bp.route("/pedidos/<int:pedido_id>/entregar", methods=["POST"])
@jwt_required()
def marcar_entregue(pedido_id):
    """Só se aplica a pedidos com entrega própria (delivery_type=2 no 99Food)."""
    erro = requer_cargo("dono", "gerente", "motoboy", "administracao")
    if erro:
        return erro

    pedido = _localizar_pedido_99food(pedido_id)
    if not pedido:
        return jsonify({"erro": "Pedido do 99Food não encontrado."}), 404

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração 99Food não configurada."}), 404

    try:
        client.marcar_entregue(cred, pedido.food99_order_id)
    except client.Food99ApiError as e:
        return jsonify({"erro": f"99Food recusou a ação: {e}"}), 502

    pedido.status = "cheguei"
    db.session.commit()
    return jsonify({"mensagem": "Pedido marcado como entregue."}), 200


@bp.route("/pedidos/<int:pedido_id>/cancelar", methods=["POST"])
@jwt_required()
def cancelar_pedido(pedido_id):
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    pedido = _localizar_pedido_99food(pedido_id)
    if not pedido:
        return jsonify({"erro": "Pedido do 99Food não encontrado."}), 404

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração 99Food não configurada."}), 404

    data = request.get_json(silent=True) or {}
    reason_id = data.get("reason_id", 1010)
    motivo = data.get("motivo", "")

    try:
        client.cancelar_pedido(cred, pedido.food99_order_id, reason_id, motivo)
    except client.Food99ApiError as e:
        return jsonify({"erro": f"99Food recusou o cancelamento: {e}"}), 502

    pedido.status = "cancelado"
    db.session.commit()
    return jsonify({"mensagem": "Pedido cancelado no 99Food."}), 200


# ─── Webhook (rota pública) ─────────────────────────────────────
#
# ⚠️ MODO DIAGNÓSTICO: ainda não sabemos o formato real do payload que o
# 99Food envia (não documentado no swagger.yaml oficial). Por segurança,
# esse endpoint aceita qualquer POST, apenas GRAVA o corpo bruto recebido
# em Food99WebhookLog e responde 200 rápido — sem tentar interpretar nada
# ainda. Assim que um webhook real chegar (ex: de um pedido de teste), dá
# pra consultar GET /99food/webhook/logs para ver o formato exato e então
# eu implemento o processamento automático de verdade.

@bp.route("/webhook", methods=["POST"])
def webhook():
    from app.models import Food99WebhookLog
    import json as _json

    corpo_bruto = request.get_data(as_text=True)
    headers_relevantes = {k: v for k, v in request.headers.items()}

    log = Food99WebhookLog(
        headers=_json.dumps(headers_relevantes, ensure_ascii=False),
        corpo_bruto=corpo_bruto,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"recebido": True}), 200


@bp.route("/webhook/logs", methods=["GET"])
@jwt_required()
def ver_logs_webhook():
    """Lista os últimos payloads brutos recebidos em /99food/webhook, para diagnóstico."""
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    from app.models import Food99WebhookLog
    import json as _json

    logs = Food99WebhookLog.query.order_by(Food99WebhookLog.id.desc()).limit(20).all()
    return jsonify([
        {
            "id": log.id,
            "recebido_em": log.recebido_em.isoformat() if log.recebido_em else None,
            "headers": _json.loads(log.headers) if log.headers else {},
            "corpo_bruto": log.corpo_bruto,
        }
        for log in logs
    ]), 200
