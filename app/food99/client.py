"""
Cliente HTTP para a API do 99Food (DiDi Food Open Platform).

Baseado no swagger.yaml oficial fornecido pelo parceiro (portal
developer-food.99app.com, seção OpenAPI). Diferente do iFood, esta API:

- Não usa OAuth Bearer. Cada chamada leva `auth_token` como parâmetro
  (query string em GET, campo no corpo JSON em POST).
- Sempre responde HTTP 200. Sucesso/erro vem no campo `errno` do corpo
  (0 = sucesso; qualquer outro valor = erro, com detalhe em `errmsg`).
- Valores monetários são inteiros na menor unidade da moeda (centavos).
- Antes de obter um auth_token, a loja precisa concluir um fluxo de
  autorização manual (ver `gerar_url_autorizacao` + `obter_auth_token`).
"""
import requests
from datetime import datetime, timedelta, timezone

from app import db

TIMEOUT = 15


class Food99ApiError(Exception):
    """Erro de negócio (errno != 0) ou de comunicação com a API do 99Food."""

    def __init__(self, mensagem, errno=None, payload=None):
        super().__init__(mensagem)
        self.errno = errno
        self.payload = payload


def _post(caminho, cred, body):
    try:
        resp = requests.post(f"{cred.base_url}{caminho}", json=body, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise Food99ApiError(f"Falha de rede ao chamar o 99Food: {e}") from e
    return _tratar_resposta(resp, caminho)


def _get(caminho, cred, params):
    try:
        resp = requests.get(f"{cred.base_url}{caminho}", params=params, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise Food99ApiError(f"Falha de rede ao chamar o 99Food: {e}") from e
    return _tratar_resposta(resp, caminho)


def _tratar_resposta(resp, caminho):
    """
    A API do 99Food responde sempre HTTP 200 (mesmo em erro de negócio).
    O sucesso/erro é indicado pelo campo `errno` do corpo (0 = sucesso).
    """
    try:
        corpo = resp.json()
    except ValueError:
        raise Food99ApiError(f"Resposta não-JSON do 99Food em {caminho}: {resp.text[:300]}")

    if resp.status_code >= 400:
        raise Food99ApiError(
            f"99Food retornou HTTP {resp.status_code} em {caminho}: {resp.text[:300]}",
            payload=corpo,
        )

    errno = corpo.get("errno", 0)
    if errno != 0:
        raise Food99ApiError(
            f"99Food recusou a chamada em {caminho} (errno={errno}): {corpo.get('errmsg')}",
            errno=errno,
            payload=corpo,
        )

    return corpo.get("data")


# ─── Autorização da loja (fluxo manual, uma vez por loja) ──────

def gerar_url_autorizacao(cred):
    """
    POST /v1/auth/authorizationpage/getUrl — retorna a URL que o dono da
    loja deve acessar para autorizar o vínculo do app com a loja no 99Food.
    Precisa ser feito manualmente uma vez antes de qualquer auth_token
    poder ser emitido para essa loja.
    """
    data = _post(
        "/v1/auth/authorizationpage/getUrl",
        cred,
        {"app_id": int(cred.app_id), "app_shop_id": cred.app_shop_id},
    )
    # A doc mostra `data` como uma lista com a URL na posição 0
    if isinstance(data, list) and data:
        return data[0]
    return data


# ─── Autenticação (token por loja) ──────────────────────────────

def obter_token_valido(cred):
    """
    Garante um auth_token válido para a credencial, buscando um novo (ou
    renovando) quando necessário.
    """
    if cred.token_valido:
        return cred.auth_token

    if not cred.autorizada:
        raise Food99ApiError(
            "Esta loja ainda não concluiu o fluxo de autorização no 99Food "
            "(chame gerar_url_autorizacao e peça para o dono aprovar antes)."
        )

    data = _get(
        "/v1/auth/authtoken/get",
        cred,
        {"app_id": cred.app_id, "app_secret": cred.app_secret, "app_shop_id": cred.app_shop_id},
    )
    _salvar_token(cred, data)
    return cred.auth_token


def renovar_token(cred):
    """POST /v1/auth/authtoken/refresh — sempre gera um token novo."""
    data = _get(
        "/v1/auth/authtoken/refresh",
        cred,
        {"app_id": cred.app_id, "app_secret": cred.app_secret, "app_shop_id": cred.app_shop_id},
    )
    if data:
        data = _get(
            "/v1/auth/authtoken/get",
            cred,
            {"app_id": cred.app_id, "app_secret": cred.app_secret, "app_shop_id": cred.app_shop_id},
        )
        _salvar_token(cred, data)
    return cred.auth_token


def _salvar_token(cred, data):
    cred.auth_token = data["auth_token"]
    # ⚠️ token_expiration_time: assumido como timestamp unix absoluto, por
    # consistência com os demais campos "_time" do spec (create_time,
    # pay_time etc. são todos unix_timestamp). Validar no sandbox: se vier
    # como "segundos restantes" em vez de timestamp absoluto, ajustar aqui.
    expiracao = data.get("token_expiration_time")
    if expiracao:
        cred.token_expira_em = datetime.fromtimestamp(expiracao, tz=timezone.utc) - timedelta(seconds=60)
    else:
        cred.token_expira_em = datetime.now(timezone.utc) + timedelta(hours=1)
    db.session.commit()


# ─── Pedidos ────────────────────────────────────────────────────

def buscar_detalhe_pedido(cred, order_id):
    """GET /v1/order/order/detail"""
    token = obter_token_valido(cred)
    return _get("/v1/order/order/detail", cred, {"auth_token": token, "order_id": order_id})


def confirmar_pedido(cred, order_id):
    """POST /v1/order/order/confirm"""
    token = obter_token_valido(cred)
    _post("/v1/order/order/confirm", cred, {"auth_token": token, "order_id": order_id})


def cancelar_pedido(cred, order_id, reason_id, motivo=""):
    """
    POST /v1/order/order/cancel
    reason_id: um dos códigos enumerados pela DiDi (1010, 1020, 1030, 1040,
    1050, 1060, 1080) — confirmar a tabela de significados no portal.
    """
    token = obter_token_valido(cred)
    _post(
        "/v1/order/order/cancel",
        cred,
        {"auth_token": token, "order_id": order_id, "reason_id": reason_id, "reason": motivo},
    )


def marcar_pronto(cred, order_id):
    """GET /v1/order/order/ready — sinaliza que o prato está pronto."""
    token = obter_token_valido(cred)
    _get("/v1/order/order/ready", cred, {"auth_token": token, "order_id": order_id})


def marcar_entregue(cred, order_id):
    """GET /v1/order/order/delivered — só para pedidos de entrega própria."""
    token = obter_token_valido(cred)
    _get("/v1/order/order/delivered", cred, {"auth_token": token, "order_id": order_id})


def responder_solicitacao_cancelamento(cred, order_id, apply_id, aceitar, motivo=""):
    """POST /v1/order/apply/cancel — aceita/recusa pedido de cancelamento do cliente."""
    token = obter_token_valido(cred)
    _post(
        "/v1/order/apply/cancel",
        cred,
        {
            "auth_token": token,
            "order_id": order_id,
            "apply_id": apply_id,
            "agree": aceitar,
            "reason": motivo,
        },
    )
