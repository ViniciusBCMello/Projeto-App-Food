"""
Camada de serviço da integração 99Food — mapeamento do OrderModel real
(confirmado via swagger.yaml) para o Pedido interno do ZentraFood.

⚠️ PONTO EM ABERTO — leia antes de usar em produção:
O swagger.yaml documenta apenas as chamadas que FAZEMOS para o 99Food
(consultar, confirmar, marcar pronto/entregue, cancelar). Ele não documenta
como recebemos a notificação de que um pedido novo chegou (nem polling, nem
webhook). Até confirmarmos esse mecanismo com o suporte do 99Food, o fluxo
de entrada é MANUAL: o lojista vê o pedido novo no app/painel do 99Food e
aciona `POST /99food/pedidos/sincronizar` com o order_id, que busca o
detalhe via API e cria o Pedido local. Assim que soubermos o mecanismo real
(webhook ou outro), plugamos a automação sem mudar o resto do módulo.
"""
import logging
from datetime import datetime, timezone

from app import db
from app.models import Pedido, ItemPedido, Produto
from app.food99 import client

logger = logging.getLogger("food99")


def gerar_numero_pedido_99food():
    """Numeração diária própria para pedidos do 99Food: F99-YYYYMMDD-XXXX."""
    hoje = datetime.now(timezone.utc).date()
    prefixo = f"F99-{hoje.strftime('%Y%m%d')}"
    ultimo = (
        Pedido.query.filter(Pedido.numero.like(f"{prefixo}-%"))
        .order_by(Pedido.id.desc())
        .first()
    )
    seq = int(ultimo.numero.split("-")[-1]) + 1 if ultimo else 1
    return f"{prefixo}-{seq:04d}"


def _centavos_para_reais(valor_centavos):
    return round((valor_centavos or 0) / 100, 2)


def _mapear_item(item_didi):
    """
    Casa um item do pedido 99Food com um Produto interno pelo nome.
    Preços do 99Food vêm em centavos (menor unidade da moeda).
    """
    nome = (item_didi.get("name") or "").strip()
    produto = Produto.query.filter(db.func.lower(Produto.nome) == nome.lower()).first()

    quantidade = item_didi.get("amount") or 1
    preco_unitario = _centavos_para_reais(
        item_didi.get("sku_price") or (item_didi.get("total_price", 0))
    )

    return ItemPedido(
        produto_id=produto.id if produto else None,
        nome_externo=None if produto else (nome or "Item do 99Food"),
        quantidade=quantidade,
        preco_unitario=preco_unitario,
    )


def criar_pedido_a_partir_do_99food(detalhe):
    """
    Cria um Pedido local a partir do OrderModel retornado por
    GET /v1/order/order/detail. Idempotente por food99_order_id.
    """
    order_id = str(detalhe["order_id"])

    existente = Pedido.query.filter_by(food99_order_id=order_id).first()
    if existente:
        return existente

    endereco = detalhe.get("receive_address") or {}
    preco = detalhe.get("price") or {}
    itens = detalhe.get("order_items") or []

    nome_cliente = endereco.get("name") or " ".join(
        filter(None, [endereco.get("first_name"), endereco.get("last_name")])
    ) or None

    # pay_type: 1 online, 2 cash, 3 pos (cartão na entrega), 4 wallet (didi wallet, também online)
    pay_type_map = {1: "99food_online", 2: "99food_dinheiro_na_entrega", 3: "99food_pos_na_entrega", 4: "99food_carteira"}
    forma_pagamento = pay_type_map.get(detalhe.get("pay_type"), "99food")

    total = preco.get("customer_need_paying_money", preco.get("real_pay_price", preco.get("order_price", 0)))

    pedido = Pedido(
        numero=gerar_numero_pedido_99food(),
        origem="99food",
        food99_order_id=order_id,
        food99_display_id=str(detalhe.get("order_index")) if detalhe.get("order_index") else None,
        cliente_nome=nome_cliente,
        user_id=None,
        forma_pagamento=forma_pagamento,
        observacoes=(detalhe.get("remark") or "")[:255],
        status="aguardando",
        total=_centavos_para_reais(total),
        # ⚠️ o schema do 99Food não tem bairro/estado/CEP separados — só um
        # endereço "geocodificado" (poi_address + house_number + city).
        endereco_cep=None,
        endereco_logradouro=endereco.get("poi_address"),
        endereco_numero=endereco.get("house_number"),
        endereco_complemento=None,
        endereco_bairro=None,
        endereco_cidade=endereco.get("city"),
        endereco_estado=None,
        endereco_referencia=endereco.get("poi_display_name"),
    )

    for item in itens:
        pedido.itens.append(_mapear_item(item))

    db.session.add(pedido)
    db.session.commit()

    logger.info("Pedido 99Food %s criado localmente como %s", order_id, pedido.numero)
    return pedido


def sincronizar_pedido(cred, order_id):
    """
    Busca o detalhe de um pedido pelo order_id (informado manualmente, até
    termos o mecanismo automático de notificação) e cria o Pedido local.
    """
    detalhe = client.buscar_detalhe_pedido(cred, order_id)
    return criar_pedido_a_partir_do_99food(detalhe)
