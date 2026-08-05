"""
Camada de serviço da integração iFood: converte o "mundo iFood" (JSON da
Merchant API) para os models já existentes do ZentraFood (Pedido, ItemPedido)
e concentra a lógica de idempotência e mapeamento de status.
"""
import logging
from datetime import datetime, timezone

from app import db
from app.models import Pedido, ItemPedido, Produto, IfoodEventoProcessado
from app.ifood import client

logger = logging.getLogger("ifood")

# iFood fullCode → status interno do ZentraFood
STATUS_MAP = {
    "PLACED": "aguardando",
    "CONFIRMED": "em_preparo",
    "SEPARATION_STARTED": "em_preparo",
    "SEPARATION_ENDED": "em_preparo",
    "READY_TO_PICKUP": "pronto",
    "DISPATCHED": "saiu_entrega",
    "CONCLUDED": "cheguei",
    "CANCELLED": "cancelado",
}

# Eventos que apenas atualizam status (não exigem nenhuma ação adicional
# além de refletir no pedido local, se ele já existir)
EVENTOS_DE_STATUS = set(STATUS_MAP.keys()) - {"PLACED"}


def gerar_numero_pedido_ifood():
    """Numeração diária própria para pedidos vindos do iFood: IFD-YYYYMMDD-XXXX."""
    hoje = datetime.now(timezone.utc).date()
    prefixo = f"IFD-{hoje.strftime('%Y%m%d')}"
    ultimo = (
        Pedido.query.filter(Pedido.numero.like(f"{prefixo}-%"))
        .order_by(Pedido.id.desc())
        .first()
    )
    seq = int(ultimo.numero.split("-")[-1]) + 1 if ultimo else 1
    return f"{prefixo}-{seq:04d}"


def _evento_ja_processado(evento_id):
    return IfoodEventoProcessado.query.filter_by(evento_id=evento_id).first() is not None


def _marcar_evento_processado(evento_id, tipo, order_id):
    db.session.add(IfoodEventoProcessado(evento_id=evento_id, tipo=tipo, order_id=order_id))


def _mapear_item(item_ifood):
    """
    Tenta casar um item do pedido iFood com um Produto interno pelo nome
    (case-insensitive). Sem sincronização de catálogo ainda, esse é o melhor
    critério disponível — se não encontrar, guarda como item avulso.
    """
    nome = (item_ifood.get("name") or "").strip()
    produto = Produto.query.filter(db.func.lower(Produto.nome) == nome.lower()).first()

    quantidade = item_ifood.get("quantity") or 1
    preco_unitario = item_ifood.get("unitPrice", item_ifood.get("price", 0))

    return ItemPedido(
        produto_id=produto.id if produto else None,
        nome_externo=None if produto else (nome or "Item do iFood"),
        quantidade=quantidade,
        preco_unitario=preco_unitario,
    )


def criar_pedido_a_partir_do_ifood(detalhe):
    """
    Cria um Pedido local a partir do payload de detalhe retornado por
    GET /order/v1.0/orders/{id}. Idempotente: se já existir um Pedido com
    esse ifood_order_id, apenas retorna o existente.
    """
    ifood_order_id = detalhe["id"]

    existente = Pedido.query.filter_by(ifood_order_id=ifood_order_id).first()
    if existente:
        return existente

    entrega = detalhe.get("delivery") or {}
    endereco = entrega.get("deliveryAddress") or {}
    cliente = detalhe.get("customer") or {}
    total = detalhe.get("total") or {}
    pagamentos = ((detalhe.get("payments") or {}).get("methods")) or []

    forma_pagamento = "ifood"
    if pagamentos:
        metodo = pagamentos[0].get("method", "")
        tipo = pagamentos[0].get("type", "")
        forma_pagamento = f"ifood_{metodo}".lower() if metodo else "ifood"
        if tipo == "OFFLINE":
            # Pago na entrega/retirada (dinheiro, maquininha do entregador etc.)
            forma_pagamento += "_na_entrega"

    pedido = Pedido(
        numero=gerar_numero_pedido_ifood(),
        origem="ifood",
        ifood_order_id=ifood_order_id,
        ifood_display_id=detalhe.get("displayId"),
        cliente_nome=cliente.get("name"),
        user_id=None,  # pedido de marketplace não pertence a um User cadastrado
        forma_pagamento=forma_pagamento,
        observacoes=(detalhe.get("extraInfo") or "")[:255],
        status="aguardando",
        total=total.get("orderAmount", 0),
        endereco_cep=endereco.get("postalCode"),
        endereco_logradouro=endereco.get("streetName"),
        endereco_numero=endereco.get("streetNumber"),
        endereco_complemento=endereco.get("complement"),
        endereco_bairro=endereco.get("neighborhood"),
        endereco_cidade=endereco.get("city"),
        endereco_estado=endereco.get("state"),
        endereco_referencia=endereco.get("reference"),
    )

    for item_ifood in detalhe.get("items", []):
        pedido.itens.append(_mapear_item(item_ifood))

    db.session.add(pedido)
    db.session.commit()

    logger.info("Pedido iFood %s criado localmente como %s", ifood_order_id, pedido.numero)
    return pedido


def atualizar_status_local(ifood_order_id, full_code):
    """Reflete um evento de status do iFood no Pedido local correspondente."""
    novo_status = STATUS_MAP.get(full_code)
    if not novo_status:
        return  # evento informativo, sem mapeamento de status (ex: ORDER_PATCHED)

    pedido = Pedido.query.filter_by(ifood_order_id=ifood_order_id).first()
    if not pedido:
        # Evento chegou antes do PLACED ser processado, ou pedido de teste
        # sem detalhe disponível ainda — ignorar com segurança.
        logger.warning("Evento %s para pedido iFood %s sem Pedido local correspondente", full_code, ifood_order_id)
        return

    pedido.status = novo_status
    db.session.commit()


def processar_evento(cred, evento):
    """
    Processa um único evento (vindo do webhook ou do polling) de forma
    idempotente. Retorna True se o evento foi tratado com sucesso (deve ser
    confirmado/"ack" junto ao iFood).
    """
    evento_id = evento.get("id")
    full_code = evento.get("fullCode") or evento.get("code")
    order_id = evento.get("orderId")

    if not evento_id:
        return False

    if _evento_ja_processado(evento_id):
        return True  # já tratado antes — apenas confirma de novo, sem reprocessar

    if full_code == "PLACED":
        detalhe = client.buscar_detalhe_pedido(cred, order_id)
        criar_pedido_a_partir_do_ifood(detalhe)
    elif full_code in EVENTOS_DE_STATUS:
        atualizar_status_local(order_id, full_code)
    else:
        # Eventos que não exigem ação (RECOMMENDED_PREPARATION_START, ORDER_PATCHED,
        # heartbeats etc.) — apenas registra e confirma, conforme boas práticas do iFood.
        logger.info("Evento iFood ignorado (sem ação necessária): %s", full_code)

    _marcar_evento_processado(evento_id, full_code, order_id)
    db.session.commit()
    return True


def executar_polling(cred):
    """
    Busca eventos pendentes via polling, processa cada um e confirma (ack)
    os que foram tratados com sucesso. Retorna a quantidade de eventos processados.
    """
    eventos = client.buscar_eventos_polling(cred)
    if not eventos:
        cred.ultimo_polling_em = datetime.now(timezone.utc)
        db.session.commit()
        return 0

    # A API pode entregar eventos fora de ordem — processar por createdAt
    eventos.sort(key=lambda e: e.get("createdAt", ""))

    ids_para_confirmar = []
    for evento in eventos:
        try:
            if processar_evento(cred, evento):
                ids_para_confirmar.append(evento["id"])
        except client.IfoodApiError:
            logger.exception("Falha ao processar evento iFood %s", evento.get("id"))
            # Não confirma (ack) — o evento volta no próximo polling

    if ids_para_confirmar:
        client.confirmar_recebimento_eventos(cred, ids_para_confirmar)

    cred.ultimo_polling_em = datetime.now(timezone.utc)
    db.session.commit()
    return len(ids_para_confirmar)
