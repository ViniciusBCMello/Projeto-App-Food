from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.ifood import bp
from app.ifood import client, service
from app.ifood.signature import validar_assinatura
from app.models import User, Pedido, IfoodCredencial
from app import db


def requer_cargo(*cargos):
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


def _credencial_ativa():
    return IfoodCredencial.query.filter_by(ativa=True).first()


def _serializar_credencial(cred):
    return {
        "id": cred.id,
        "client_id": cred.client_id,
        "merchant_id": cred.merchant_id,
        "ativa": cred.ativa,
        "token_valido": cred.token_valido,
        "ultimo_polling_em": cred.ultimo_polling_em.isoformat() if cred.ultimo_polling_em else None,
        # client_secret nunca é retornado pela API
    }


# ─── Configuração de credenciais ───────────────────────────────

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
    """Cadastra (ou substitui) as credenciais do aplicativo iFood desta instalação."""
    erro = requer_cargo("dono")
    if erro:
        return erro

    data = request.get_json() or {}
    client_id = (data.get("client_id") or "").strip()
    client_secret = (data.get("client_secret") or "").strip()
    merchant_id = (data.get("merchant_id") or "").strip()

    if not all([client_id, client_secret, merchant_id]):
        return jsonify({"erro": "client_id, client_secret e merchant_id são obrigatórios."}), 400

    # Desativa credenciais antigas (mantém histórico em vez de excluir)
    IfoodCredencial.query.filter_by(ativa=True).update({"ativa": False})

    cred = IfoodCredencial(
        client_id=client_id,
        client_secret=client_secret,
        merchant_id=merchant_id,
        ativa=True,
    )
    db.session.add(cred)
    db.session.commit()

    # Testa a credencial imediatamente para dar feedback claro
    try:
        client.obter_token_valido(cred)
    except client.IfoodApiError as e:
        return jsonify({
            "erro": "Credenciais salvas, mas a autenticação com o iFood falhou.",
            "detalhe": str(e),
        }), 400

    return jsonify({"mensagem": "Credenciais configuradas com sucesso.", **_serializar_credencial(cred)}), 201


# ─── Webhook (rota pública — autenticada pela assinatura, não por JWT) ──

@bp.route("/webhook", methods=["POST"])
def webhook():
    cred = _credencial_ativa()
    if not cred:
        # Nada configurado ainda — não há como validar a assinatura
        return jsonify({"erro": "Integração iFood não configurada."}), 404

    assinatura = request.headers.get("X-IFood-Signature", "")
    corpo_bruto = request.get_data()  # bytes crus, antes de qualquer parse

    if not validar_assinatura(cred.client_secret, corpo_bruto, assinatura):
        return jsonify({"erro": "Assinatura inválida."}), 401

    evento = request.get_json(silent=True)
    if not evento:
        return jsonify({"erro": "Corpo inválido."}), 400

    # Heartbeat de presença — apenas confirma que a integração está online
    if evento.get("code") == "KEEPALIVE" or evento.get("fullCode") == "KEEPALIVE":
        return jsonify({}), 202

    try:
        service.processar_evento(cred, evento)
    except client.IfoodApiError:
        # Não confirma — o polling de fallback (se configurado) reconcilia depois
        return jsonify({"erro": "Falha ao processar evento."}), 202

    return jsonify({"acknowledged": True}), 202


# ─── Polling manual / fallback (chamado por cron externo ou pelo painel) ──

@bp.route("/polling", methods=["POST"])
@jwt_required()
def polling_manual():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração iFood não configurada."}), 404

    try:
        quantidade = service.executar_polling(cred)
    except client.IfoodApiError as e:
        return jsonify({"erro": f"Falha ao consultar o iFood: {e}"}), 502

    return jsonify({"eventos_processados": quantidade}), 200


# ─── Ações sobre um pedido vindo do iFood ──────────────────────

@bp.route("/pedidos/<int:pedido_id>/confirmar", methods=["POST"])
@jwt_required()
def confirmar_pedido(pedido_id):
    erro = requer_cargo("dono", "gerente", "atendente", "administracao")
    if erro:
        return erro

    pedido = db.session.get(Pedido, pedido_id)
    if not pedido or pedido.origem != "ifood":
        return jsonify({"erro": "Pedido do iFood não encontrado."}), 404

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração iFood não configurada."}), 404

    try:
        client.confirmar_pedido(cred, pedido.ifood_order_id)
    except client.IfoodApiError as e:
        return jsonify({"erro": f"iFood recusou a confirmação: {e}"}), 502

    # Confirmação é assíncrona no iFood — o status "em_preparo" oficial só
    # chega no próximo evento CONFIRMED. Atualizamos otimisticamente aqui
    # para refletir a ação imediatamente no painel.
    pedido.status = "em_preparo"
    db.session.commit()

    return jsonify({"mensagem": "Pedido confirmado junto ao iFood.", "id": pedido.id}), 200


@bp.route("/pedidos/<int:pedido_id>/cancelar", methods=["POST"])
@jwt_required()
def cancelar_pedido(pedido_id):
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    pedido = db.session.get(Pedido, pedido_id)
    if not pedido or pedido.origem != "ifood":
        return jsonify({"erro": "Pedido do iFood não encontrado."}), 404

    cred = _credencial_ativa()
    if not cred:
        return jsonify({"erro": "Integração iFood não configurada."}), 404

    data = request.get_json(silent=True) or {}
    motivo_codigo = data.get("motivo_codigo", "501")  # 501 = erro no sistema (genérico)

    try:
        client.solicitar_cancelamento(cred, pedido.ifood_order_id, motivo_codigo)
    except client.IfoodApiError as e:
        return jsonify({"erro": f"iFood recusou o cancelamento: {e}"}), 502

    return jsonify({"mensagem": "Cancelamento solicitado ao iFood. Aguardando confirmação."}), 200
