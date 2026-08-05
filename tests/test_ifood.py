"""
Testes do módulo de integração com o iFood.

Nenhum teste aqui bate na API real do iFood — as funções de rede
(app.ifood.client) são substituídas (monkeypatch) por versões falsas,
então os testes rodam offline e de forma determinística.
"""
import hashlib
import hmac
import json

from app.ifood.signature import validar_assinatura


# ─── Assinatura do webhook ──────────────────────────────────────

def test_assinatura_valida_e_aceita():
    secret = "meu-client-secret"
    corpo = b'{"code":"PLC","fullCode":"PLACED","id":"evt-1","orderId":"ord-1"}'
    assinatura = hmac.new(secret.encode(), corpo, hashlib.sha256).hexdigest()

    assert validar_assinatura(secret, corpo, assinatura) is True


def test_assinatura_com_corpo_adulterado_e_rejeitada():
    secret = "meu-client-secret"
    corpo = b'{"code":"PLC","id":"evt-1"}'
    assinatura = hmac.new(secret.encode(), corpo, hashlib.sha256).hexdigest()

    corpo_adulterado = corpo.replace(b"PLC", b"CFM")
    assert validar_assinatura(secret, corpo_adulterado, assinatura) is False


def test_assinatura_com_secret_errado_e_rejeitada():
    corpo = b'{"code":"PLC","id":"evt-1"}'
    assinatura = hmac.new(b"secret-certo", corpo, hashlib.sha256).hexdigest()

    assert validar_assinatura("secret-errado", corpo, assinatura) is False


def test_assinatura_vazia_e_rejeitada():
    assert validar_assinatura("qualquer-secret", b"{}", "") is False


# ─── Configuração de credenciais ────────────────────────────────

def test_configurar_credenciais_com_sucesso(client, auth_headers, monkeypatch):
    import app.ifood.client as ifood_client

    monkeypatch.setattr(ifood_client, "obter_token_valido", lambda cred: "token-fake")

    resp = client.post(
        "/ifood/credenciais",
        headers=auth_headers,
        json={"client_id": "cid", "client_secret": "segredo", "merchant_id": "mid"},
    )

    assert resp.status_code == 201
    corpo = resp.get_json()
    assert corpo["merchant_id"] == "mid"
    assert "client_secret" not in corpo  # nunca deve vazar o segredo de volta


def test_configurar_credenciais_sem_campo_obrigatorio_retorna_400(client, auth_headers):
    resp = client.post(
        "/ifood/credenciais",
        headers=auth_headers,
        json={"client_id": "cid", "client_secret": "segredo"},  # falta merchant_id
    )
    assert resp.status_code == 400


def test_configurar_credenciais_com_falha_de_autenticacao_retorna_400(client, auth_headers, monkeypatch):
    import app.ifood.client as ifood_client

    def _falha(cred):
        raise ifood_client.IfoodApiError("credenciais inválidas")

    monkeypatch.setattr(ifood_client, "obter_token_valido", _falha)

    resp = client.post(
        "/ifood/credenciais",
        headers=auth_headers,
        json={"client_id": "cid", "client_secret": "errado", "merchant_id": "mid"},
    )
    assert resp.status_code == 400


def test_ver_credenciais_sem_configuracao(client, auth_headers):
    resp = client.get("/ifood/credenciais", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["configurado"] is False


def _configurar_credenciais(client, auth_headers, monkeypatch):
    import app.ifood.client as ifood_client

    monkeypatch.setattr(ifood_client, "obter_token_valido", lambda cred: "token-fake")
    resp = client.post(
        "/ifood/credenciais",
        headers=auth_headers,
        json={"client_id": "cid", "client_secret": "segredo-teste", "merchant_id": "mid"},
    )
    assert resp.status_code == 201


# ─── Webhook: recebimento de pedido ─────────────────────────────

def test_webhook_com_assinatura_valida_cria_pedido(client, auth_headers, produto_teste, monkeypatch, app):
    import app.ifood.client as ifood_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    detalhe_fake = {
        "id": "ifood-order-1",
        "displayId": "AB12",
        "customer": {"name": "Cliente Teste"},
        "delivery": {"deliveryAddress": {
            "streetName": "Rua Teste", "streetNumber": "10", "neighborhood": "Centro",
            "city": "Salvador", "state": "BA",
        }},
        "total": {"orderAmount": 51.80},
        "payments": {"methods": [{"method": "PIX", "type": "ONLINE"}]},
        "items": [{"name": "Produto Teste", "quantity": 2, "unitPrice": 25.90}],
    }
    monkeypatch.setattr(ifood_client, "buscar_detalhe_pedido", lambda cred, order_id: detalhe_fake)

    with app.app_context():
        from app.models import IfoodCredencial
        secret = IfoodCredencial.query.first().client_secret

    evento = {"id": "evt-1", "code": "PLC", "fullCode": "PLACED", "orderId": "ifood-order-1", "createdAt": "2026-07-07T12:00:00Z"}
    corpo = json.dumps(evento).encode()
    assinatura = hmac.new(secret.encode(), corpo, hashlib.sha256).hexdigest()

    resp = client.post(
        "/ifood/webhook",
        data=corpo,
        headers={"X-IFood-Signature": assinatura, "Content-Type": "application/json"},
    )
    assert resp.status_code == 202

    with app.app_context():
        from app.models import Pedido
        pedido = Pedido.query.filter_by(ifood_order_id="ifood-order-1").first()
        assert pedido is not None
        assert pedido.origem == "ifood"
        assert pedido.status == "aguardando"
        assert float(pedido.total) == 51.80
        assert len(pedido.itens) == 1
        assert pedido.itens[0].produto_id is not None  # casou pelo nome


def test_webhook_com_assinatura_invalida_e_rejeitado(client, auth_headers, monkeypatch):
    _configurar_credenciais(client, auth_headers, monkeypatch)

    corpo = json.dumps({"id": "evt-x", "code": "PLC", "orderId": "ord-x"}).encode()
    resp = client.post(
        "/ifood/webhook",
        data=corpo,
        headers={"X-IFood-Signature": "assinatura-forjada", "Content-Type": "application/json"},
    )
    assert resp.status_code == 401


def test_webhook_sem_credencial_configurada_retorna_404(client):
    corpo = json.dumps({"id": "evt-x"}).encode()
    resp = client.post("/ifood/webhook", data=corpo, headers={"X-IFood-Signature": "x"})
    assert resp.status_code == 404


def test_webhook_item_sem_produto_correspondente_nao_quebra(client, auth_headers, monkeypatch, app):
    """Item que não bate com nenhum Produto interno deve virar item avulso, sem crash."""
    import app.ifood.client as ifood_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    detalhe_fake = {
        "id": "ifood-order-2",
        "customer": {"name": "Cliente 2"},
        "delivery": {"deliveryAddress": {}},
        "total": {"orderAmount": 30.0},
        "payments": {"methods": []},
        "items": [{"name": "Item Desconhecido", "quantity": 1, "unitPrice": 30.0}],
    }
    monkeypatch.setattr(ifood_client, "buscar_detalhe_pedido", lambda cred, order_id: detalhe_fake)

    with app.app_context():
        from app.models import IfoodCredencial
        secret = IfoodCredencial.query.first().client_secret

    evento = {"id": "evt-2", "code": "PLC", "fullCode": "PLACED", "orderId": "ifood-order-2", "createdAt": "2026-07-07T12:01:00Z"}
    corpo = json.dumps(evento).encode()
    assinatura = hmac.new(secret.encode(), corpo, hashlib.sha256).hexdigest()

    resp = client.post(
        "/ifood/webhook", data=corpo,
        headers={"X-IFood-Signature": assinatura, "Content-Type": "application/json"},
    )
    assert resp.status_code == 202

    with app.app_context():
        from app.models import Pedido
        pedido = Pedido.query.filter_by(ifood_order_id="ifood-order-2").first()
        assert pedido.itens[0].produto_id is None
        assert pedido.itens[0].nome == "Item Desconhecido"

    # a serialização usada pelo GET /pedidos/ não pode quebrar com item sem produto
    with app.app_context():
        from app.models import Pedido
        from app.pedidos.routes import serializar_pedido
        pedido = Pedido.query.filter_by(ifood_order_id="ifood-order-2").first()
        serializado = serializar_pedido(pedido)
        assert serializado["itens"][0]["produto_nome"] == "Item Desconhecido"


def test_webhook_e_idempotente(client, auth_headers, monkeypatch, app):
    """Reenviar o mesmo evento (mesmo id) não deve criar um segundo pedido."""
    import app.ifood.client as ifood_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    detalhe_fake = {
        "id": "ifood-order-3", "customer": {}, "delivery": {"deliveryAddress": {}},
        "total": {"orderAmount": 10.0}, "payments": {"methods": []},
        "items": [],
    }
    monkeypatch.setattr(ifood_client, "buscar_detalhe_pedido", lambda cred, order_id: detalhe_fake)

    with app.app_context():
        from app.models import IfoodCredencial
        secret = IfoodCredencial.query.first().client_secret

    evento = {"id": "evt-repetido", "code": "PLC", "fullCode": "PLACED", "orderId": "ifood-order-3", "createdAt": "2026-07-07T12:02:00Z"}
    corpo = json.dumps(evento).encode()
    assinatura = hmac.new(secret.encode(), corpo, hashlib.sha256).hexdigest()
    headers = {"X-IFood-Signature": assinatura, "Content-Type": "application/json"}

    resp1 = client.post("/ifood/webhook", data=corpo, headers=headers)
    resp2 = client.post("/ifood/webhook", data=corpo, headers=headers)
    assert resp1.status_code == 202
    assert resp2.status_code == 202

    with app.app_context():
        from app.models import Pedido
        assert Pedido.query.filter_by(ifood_order_id="ifood-order-3").count() == 1


# ─── Ações sobre pedido (confirmar / cancelar) ──────────────────

def test_confirmar_pedido_ifood(client, auth_headers, monkeypatch, app, db):
    import app.ifood.client as ifood_client
    from app.models import Pedido

    chamadas = []
    monkeypatch.setattr(ifood_client, "obter_token_valido", lambda cred: "token-fake")
    monkeypatch.setattr(ifood_client, "confirmar_pedido", lambda cred, order_id: chamadas.append(order_id))

    _configurar_credenciais(client, auth_headers, monkeypatch)

    with app.app_context():
        pedido = Pedido(numero="IFD-TESTE-0001", origem="ifood", ifood_order_id="ord-conf-1", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/ifood/pedidos/{pedido_id}/confirmar", headers=auth_headers)
    assert resp.status_code == 200
    assert chamadas == ["ord-conf-1"]

    with app.app_context():
        assert db.session.get(Pedido, pedido_id).status == "em_preparo"


def test_confirmar_pedido_inexistente_retorna_404(client, auth_headers):
    resp = client.post("/ifood/pedidos/99999/confirmar", headers=auth_headers)
    assert resp.status_code == 404


def test_confirmar_pedido_de_origem_interna_retorna_404(client, auth_headers, app, db):
    """Não pode confirmar via iFood um pedido que não veio do iFood."""
    from app.models import Pedido

    with app.app_context():
        pedido = Pedido(numero="INT-0001", origem="interno", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/ifood/pedidos/{pedido_id}/confirmar", headers=auth_headers)
    assert resp.status_code == 404


def test_cancelar_pedido_ifood(client, auth_headers, monkeypatch, app, db):
    import app.ifood.client as ifood_client
    from app.models import Pedido

    chamadas = []
    monkeypatch.setattr(ifood_client, "obter_token_valido", lambda cred: "token-fake")
    monkeypatch.setattr(
        ifood_client, "solicitar_cancelamento",
        lambda cred, order_id, motivo: chamadas.append((order_id, motivo)),
    )

    _configurar_credenciais(client, auth_headers, monkeypatch)

    with app.app_context():
        pedido = Pedido(numero="IFD-TESTE-0002", origem="ifood", ifood_order_id="ord-canc-1", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/ifood/pedidos/{pedido_id}/cancelar", headers=auth_headers, json={"motivo_codigo": "503"})
    assert resp.status_code == 200
    assert chamadas == [("ord-canc-1", "503")]


def test_acao_sem_permissao_retorna_403(client, app, db):
    """Um usuário 'atendente' não pode cancelar pedido (só dono/gerente/administracao)."""
    from app.models import User, Pedido

    with app.app_context():
        u = User(nome="Atendente", email="atendente@teste.com", cargo="atendente", cpf="99999999999")
        u.set_senha("senha1234")
        db.session.add(u)
        pedido = Pedido(numero="IFD-TESTE-0003", origem="ifood", ifood_order_id="ord-perm-1", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    token = client.post("/auth/login", json={"email": "atendente@teste.com", "senha": "senha1234"}).get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(f"/ifood/pedidos/{pedido_id}/cancelar", headers=headers)
    assert resp.status_code == 403
