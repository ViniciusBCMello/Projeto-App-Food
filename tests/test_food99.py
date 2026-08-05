"""
Testes do módulo de integração com o 99Food.

Assim como nos testes do iFood, nenhuma chamada bate na API real — as
funções de rede (app.food99.client) são substituídas via monkeypatch.
"""


def _configurar_credenciais(client, auth_headers, monkeypatch):
    import app.food99.client as food99_client

    monkeypatch.setattr(food99_client, "obter_token_valido", lambda cred: "token-fake")
    resp = client.post(
        "/99food/credenciais",
        headers=auth_headers,
        json={"app_id": "123456", "app_secret": "segredo-teste", "app_shop_id": "loja-teste-1"},
    )
    assert resp.status_code == 201
    return resp.get_json()


# ─── Configuração de credenciais ────────────────────────────────

def test_configurar_credenciais_com_sucesso(client, auth_headers, monkeypatch):
    corpo = _configurar_credenciais(client, auth_headers, monkeypatch)
    assert corpo["app_shop_id"] == "loja-teste-1"
    assert "app_secret" not in corpo  # nunca deve vazar o segredo


def test_configurar_credenciais_sem_campo_obrigatorio_retorna_400(client, auth_headers):
    resp = client.post(
        "/99food/credenciais",
        headers=auth_headers,
        json={"app_id": "123456", "app_secret": "segredo"},  # falta app_shop_id
    )
    assert resp.status_code == 400


def test_ver_credenciais_sem_configuracao(client, auth_headers):
    resp = client.get("/99food/credenciais", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["configurado"] is False


def test_credenciais_recem_criadas_ainda_nao_autorizadas(client, auth_headers, monkeypatch):
    _configurar_credenciais(client, auth_headers, monkeypatch)
    resp = client.get("/99food/credenciais", headers=auth_headers)
    assert resp.get_json()["autorizada"] is False


# ─── Fluxo de autorização da loja ───────────────────────────────

def test_gerar_link_autorizacao(client, auth_headers, monkeypatch):
    import app.food99.client as food99_client

    _configurar_credenciais(client, auth_headers, monkeypatch)
    monkeypatch.setattr(food99_client, "gerar_url_autorizacao", lambda cred: "https://99food.com/authorize?token=abc")

    resp = client.post("/99food/credenciais/autorizar", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["url_autorizacao"] == "https://99food.com/authorize?token=abc"


def test_gerar_link_autorizacao_sem_credencial_retorna_404(client, auth_headers):
    resp = client.post("/99food/credenciais/autorizar", headers=auth_headers)
    assert resp.status_code == 404


def test_confirmar_autorizacao_com_sucesso(client, auth_headers, monkeypatch):
    import app.food99.client as food99_client

    _configurar_credenciais(client, auth_headers, monkeypatch)
    monkeypatch.setattr(food99_client, "obter_token_valido", lambda cred: "token-real-fake")

    resp = client.post("/99food/credenciais/confirmar-autorizacao", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["autorizada"] is True


def test_confirmar_autorizacao_sem_aprovacao_real_desfaz_o_flag(client, auth_headers, monkeypatch):
    """
    Se a loja marcar 'autorizada' mas o token não vier (porque o dono não
    aprovou de fato no 99Food), a rota deve reverter o flag em vez de
    deixar o sistema num estado inconsistente.
    """
    import app.food99.client as food99_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    def _falha(cred):
        raise food99_client.Food99ApiError("loja ainda não autorizou")

    monkeypatch.setattr(food99_client, "obter_token_valido", _falha)

    resp = client.post("/99food/credenciais/confirmar-autorizacao", headers=auth_headers)
    assert resp.status_code == 400

    resp2 = client.get("/99food/credenciais", headers=auth_headers)
    assert resp2.get_json()["autorizada"] is False


# ─── Sincronização manual de pedido ──────────────────────────────

def test_sincronizar_pedido_cria_pedido_local(client, auth_headers, produto_teste, monkeypatch, app):
    import app.food99.client as food99_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    detalhe_fake = {
        "order_id": 555111,
        "order_index": "42",
        "remark": "sem cebola",
        "pay_type": 1,
        "receive_address": {
            "name": "Cliente 99", "city": "Salvador",
            "poi_address": "Rua Nova, 55", "house_number": "55",
        },
        "price": {"customer_need_paying_money": 5180},  # centavos
        "order_items": [{"name": "Produto Teste", "amount": 2, "sku_price": 2590}],
    }
    monkeypatch.setattr(food99_client, "buscar_detalhe_pedido", lambda cred, order_id: detalhe_fake)

    resp = client.post("/99food/pedidos/sincronizar", headers=auth_headers, json={"order_id": 555111})
    assert resp.status_code == 200

    with app.app_context():
        from app.models import Pedido
        pedido = Pedido.query.filter_by(food99_order_id="555111").first()
        assert pedido is not None
        assert pedido.origem == "99food"
        assert pedido.status == "aguardando"
        assert float(pedido.total) == 51.80  # 5180 centavos -> 51.80
        assert pedido.forma_pagamento == "99food_online"
        assert len(pedido.itens) == 1
        assert pedido.itens[0].produto_id is not None
        assert float(pedido.itens[0].preco_unitario) == 25.90  # 2590 centavos -> 25.90


def test_sincronizar_pedido_e_idempotente(client, auth_headers, monkeypatch, app):
    import app.food99.client as food99_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    detalhe_fake = {
        "order_id": 555222, "receive_address": {}, "price": {}, "order_items": [],
    }
    monkeypatch.setattr(food99_client, "buscar_detalhe_pedido", lambda cred, order_id: detalhe_fake)

    resp1 = client.post("/99food/pedidos/sincronizar", headers=auth_headers, json={"order_id": 555222})
    resp2 = client.post("/99food/pedidos/sincronizar", headers=auth_headers, json={"order_id": 555222})
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp1.get_json()["pedido_id"] == resp2.get_json()["pedido_id"]

    with app.app_context():
        from app.models import Pedido
        assert Pedido.query.filter_by(food99_order_id="555222").count() == 1


def test_sincronizar_pedido_sem_order_id_retorna_400(client, auth_headers, monkeypatch):
    _configurar_credenciais(client, auth_headers, monkeypatch)
    resp = client.post("/99food/pedidos/sincronizar", headers=auth_headers, json={})
    assert resp.status_code == 400


def test_sincronizar_pedido_item_sem_produto_correspondente_nao_quebra(client, auth_headers, monkeypatch, app):
    import app.food99.client as food99_client

    _configurar_credenciais(client, auth_headers, monkeypatch)

    detalhe_fake = {
        "order_id": 555333, "receive_address": {}, "price": {"customer_need_paying_money": 1000},
        "order_items": [{"name": "Item Desconhecido do 99Food", "amount": 1, "sku_price": 1000}],
    }
    monkeypatch.setattr(food99_client, "buscar_detalhe_pedido", lambda cred, order_id: detalhe_fake)

    resp = client.post("/99food/pedidos/sincronizar", headers=auth_headers, json={"order_id": 555333})
    assert resp.status_code == 200

    with app.app_context():
        from app.models import Pedido
        from app.pedidos.routes import serializar_pedido
        pedido = Pedido.query.filter_by(food99_order_id="555333").first()
        assert pedido.itens[0].produto_id is None
        serializado = serializar_pedido(pedido)  # não pode quebrar
        assert serializado["itens"][0]["produto_nome"] == "Item Desconhecido do 99Food"


# ─── Ações sobre pedido ──────────────────────────────────────────

def test_confirmar_pedido_99food(client, auth_headers, monkeypatch, app, db):
    import app.food99.client as food99_client
    from app.models import Pedido

    chamadas = []
    _configurar_credenciais(client, auth_headers, monkeypatch)
    monkeypatch.setattr(food99_client, "confirmar_pedido", lambda cred, order_id: chamadas.append(order_id))

    with app.app_context():
        pedido = Pedido(numero="F99-TESTE-0001", origem="99food", food99_order_id="777111", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/99food/pedidos/{pedido_id}/confirmar", headers=auth_headers)
    assert resp.status_code == 200
    assert chamadas == ["777111"]

    with app.app_context():
        assert db.session.get(Pedido, pedido_id).status == "em_preparo"


def test_marcar_pronto_99food(client, auth_headers, monkeypatch, app, db):
    import app.food99.client as food99_client
    from app.models import Pedido

    _configurar_credenciais(client, auth_headers, monkeypatch)
    monkeypatch.setattr(food99_client, "marcar_pronto", lambda cred, order_id: None)

    with app.app_context():
        pedido = Pedido(numero="F99-TESTE-0002", origem="99food", food99_order_id="777222", status="em_preparo", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/99food/pedidos/{pedido_id}/pronto", headers=auth_headers)
    assert resp.status_code == 200
    with app.app_context():
        assert db.session.get(Pedido, pedido_id).status == "pronto"


def test_marcar_entregue_99food(client, auth_headers, monkeypatch, app, db):
    import app.food99.client as food99_client
    from app.models import Pedido

    _configurar_credenciais(client, auth_headers, monkeypatch)
    monkeypatch.setattr(food99_client, "marcar_entregue", lambda cred, order_id: None)

    with app.app_context():
        pedido = Pedido(numero="F99-TESTE-0003", origem="99food", food99_order_id="777333", status="saiu_entrega", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/99food/pedidos/{pedido_id}/entregar", headers=auth_headers)
    assert resp.status_code == 200
    with app.app_context():
        assert db.session.get(Pedido, pedido_id).status == "cheguei"


def test_cancelar_pedido_99food(client, auth_headers, monkeypatch, app, db):
    import app.food99.client as food99_client
    from app.models import Pedido

    chamadas = []
    _configurar_credenciais(client, auth_headers, monkeypatch)
    monkeypatch.setattr(
        food99_client, "cancelar_pedido",
        lambda cred, order_id, reason_id, motivo="": chamadas.append((order_id, reason_id, motivo)),
    )

    with app.app_context():
        pedido = Pedido(numero="F99-TESTE-0004", origem="99food", food99_order_id="777444", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/99food/pedidos/{pedido_id}/cancelar", headers=auth_headers, json={"reason_id": 1020, "motivo": "sem estoque"})
    assert resp.status_code == 200
    assert chamadas == [("777444", 1020, "sem estoque")]

    with app.app_context():
        assert db.session.get(Pedido, pedido_id).status == "cancelado"


def test_acao_em_pedido_de_origem_interna_retorna_404(client, auth_headers, app, db):
    from app.models import Pedido

    with app.app_context():
        pedido = Pedido(numero="INT-0002", origem="interno", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/99food/pedidos/{pedido_id}/confirmar", headers=auth_headers)
    assert resp.status_code == 404


def test_acao_sem_permissao_retorna_403(client, app, db):
    """Um 'atendente' não pode cancelar pedido no 99Food (só dono/gerente/administracao)."""
    from app.models import User, Pedido

    with app.app_context():
        u = User(nome="Atendente99", email="atendente99@teste.com", cargo="atendente", cpf="88888888888")
        u.set_senha("senha1234")
        db.session.add(u)
        pedido = Pedido(numero="F99-TESTE-0005", origem="99food", food99_order_id="777555", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    token = client.post("/auth/login", json={"email": "atendente99@teste.com", "senha": "senha1234"}).get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(f"/99food/pedidos/{pedido_id}/cancelar", headers=headers)
    assert resp.status_code == 403


def test_acao_sem_credencial_configurada_retorna_404(client, auth_headers, app, db):
    from app.models import Pedido

    with app.app_context():
        pedido = Pedido(numero="F99-TESTE-0006", origem="99food", food99_order_id="777666", status="aguardando", total=10)
        db.session.add(pedido)
        db.session.commit()
        pedido_id = pedido.id

    resp = client.post(f"/99food/pedidos/{pedido_id}/confirmar", headers=auth_headers)
    assert resp.status_code == 404
