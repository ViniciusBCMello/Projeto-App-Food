"""
Cliente HTTP para a Merchant API do iFood.

Referência: https://developer.ifood.com.br (módulos Authentication, Events, Order)

Este módulo só fala HTTP com o iFood — não conhece os models do ZentraFood.
Toda tradução entre "mundo iFood" e "mundo ZentraFood" fica em app/ifood/service.py.
"""
import requests
from datetime import datetime, timedelta, timezone

from app import db

BASE_URL = "https://merchant-api.ifood.com.br"
TIMEOUT = 15  # segundos — evita travar a request por instabilidade do iFood


class IfoodApiError(Exception):
    """Erro de comunicação com a API do iFood (HTTP ou de negócio)."""

    def __init__(self, mensagem, status_code=None, payload=None):
        super().__init__(mensagem)
        self.status_code = status_code
        self.payload = payload


def _request(metodo, caminho, cred, **kwargs):
    """Executa uma request autenticada contra a Merchant API."""
    token = obter_token_valido(cred)
    headers = kwargs.pop("headers", {})
    headers["Authorization"] = f"Bearer {token}"

    try:
        resp = requests.request(
            metodo, f"{BASE_URL}{caminho}", headers=headers, timeout=TIMEOUT, **kwargs
        )
    except requests.RequestException as e:
        raise IfoodApiError(f"Falha de rede ao chamar o iFood: {e}") from e

    if resp.status_code >= 400:
        raise IfoodApiError(
            f"iFood retornou erro {resp.status_code} em {caminho}: {resp.text[:500]}",
            status_code=resp.status_code,
            payload=_safe_json(resp),
        )

    return resp


def _safe_json(resp):
    try:
        return resp.json()
    except ValueError:
        return None


# ─── Autenticação ──────────────────────────────────────────────

def obter_token_valido(cred):
    """
    Retorna um access_token válido para a credencial informada, renovando
    via client_credentials quando necessário. Persiste o novo token no banco.
    """
    if cred.token_valido:
        return cred.access_token

    resp = requests.post(
        f"{BASE_URL}/authentication/v1.0/oauth/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grantType": "client_credentials",
            "clientId": cred.client_id,
            "clientSecret": cred.client_secret,
        },
        timeout=TIMEOUT,
    )

    if resp.status_code >= 400:
        raise IfoodApiError(
            f"Falha ao autenticar no iFood ({resp.status_code}): {resp.text[:500]}",
            status_code=resp.status_code,
        )

    dados = resp.json()
    # accessToken expira por padrão em 6h (expiresIn em segundos)
    expira_em = int(dados.get("expiresIn", 21600))
    cred.access_token = dados["accessToken"]
    # Margem de segurança de 60s para evitar usar um token na borda da expiração
    cred.token_expira_em = datetime.now(timezone.utc) + timedelta(seconds=expira_em - 60)
    db.session.commit()

    return cred.access_token


# ─── Eventos (polling) ─────────────────────────────────────────

def buscar_eventos_polling(cred):
    """
    GET /events:polling — retorna a lista de eventos pendentes (não confirmados).
    Retorna [] se não houver eventos novos (204).
    """
    resp = _request(
        "GET",
        "/events/v1.0/events:polling",
        cred,
        headers={"x-polling-merchants": cred.merchant_id},
    )
    if resp.status_code == 204:
        return []
    return resp.json() or []


def confirmar_recebimento_eventos(cred, evento_ids):
    """POST /events/acknowledgment — obrigatório após consumir eventos do polling."""
    if not evento_ids:
        return
    _request(
        "POST",
        "/events/v1.0/events/acknowledgment",
        cred,
        json=[{"id": eid} for eid in evento_ids],
    )


# ─── Pedidos ────────────────────────────────────────────────────

def buscar_detalhe_pedido(cred, ifood_order_id):
    """GET /order/v1.0/orders/{id} — consultar uma única vez, dados são imutáveis."""
    resp = _request("GET", f"/order/v1.0/orders/{ifood_order_id}", cred)
    return resp.json()


def confirmar_pedido(cred, ifood_order_id):
    """POST /order/v1.0/orders/{id}/confirm — aceita o pedido (assíncrono, 202)."""
    _request("POST", f"/order/v1.0/orders/{ifood_order_id}/confirm", cred)


def solicitar_cancelamento(cred, ifood_order_id, motivo_codigo="501"):
    """POST /order/v1.0/orders/{id}/requestCancellation (assíncrono, 202)."""
    _request(
        "POST",
        f"/order/v1.0/orders/{ifood_order_id}/requestCancellation",
        cred,
        json={"reason": motivo_codigo},
    )
