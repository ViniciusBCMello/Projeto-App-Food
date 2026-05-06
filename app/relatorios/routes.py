from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case, and_
from datetime import date, datetime, timedelta, timezone

from app.relatorios import bp
from app import db
from app.models import (
    User, Pedido, ItemPedido, Produto, Categoria,
    TransacaoFinanceira, ProdutoCusto
)


# ─────────────────────────────────────────────
# HELPER — permissão (padrão do projeto)
# ─────────────────────────────────────────────

def requer_cargo(*cargos):
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or user.cargo not in cargos:
        return jsonify({"erro": "Sem permissão."}), 403
    return None


# ─────────────────────────────────────────────
# HELPER — parse e validação de período
# ─────────────────────────────────────────────

def _parse_periodo():
    """
    Lê ?de=YYYY-MM-DD&ate=YYYY-MM-DD da query string.
    Retorna (data_inicio, data_fim) como objetos date.
    Retorna (None, mensagem_erro) se inválido.
    """
    de_str  = request.args.get("de")
    ate_str = request.args.get("ate")

    if not de_str or not ate_str:
        return None, "Parâmetros 'de' e 'ate' são obrigatórios (formato: YYYY-MM-DD)."

    try:
        data_inicio = date.fromisoformat(de_str)
        data_fim    = date.fromisoformat(ate_str)
    except ValueError:
        return None, "Formato de data inválido. Use YYYY-MM-DD."

    if data_inicio > data_fim:
        return None, "A data 'de' não pode ser maior que 'ate'."

    return (data_inicio, data_fim), None


def _periodo_anterior(data_inicio, data_fim):
    """Calcula o período anterior de mesmo tamanho para comparativos."""
    duracao   = (data_fim - data_inicio).days + 1
    fim_ant   = data_inicio - timedelta(days=1)
    inicio_ant = fim_ant - timedelta(days=duracao - 1)
    return inicio_ant, fim_ant


# ─────────────────────────────────────────────
# HELPER — custo vigente de um produto em uma data
# ─────────────────────────────────────────────

def _custo_vigente(produto_id, referencia: date):
    """
    Retorna o custo_unitario vigente para o produto na data de referência.
    Usa o registro com maior data_vigencia <= referencia.
    Retorna 0.0 se não houver custo cadastrado.
    """
    registro = (
        ProdutoCusto.query
        .filter(
            ProdutoCusto.produto_id == produto_id,
            ProdutoCusto.data_vigencia <= referencia
        )
        .order_by(ProdutoCusto.data_vigencia.desc())
        .first()
    )
    return float(registro.custo_unitario) if registro else 0.0


# ─────────────────────────────────────────────
# 1. GET /relatorios/vendas
# ─────────────────────────────────────────────

@bp.route("/vendas")
@jwt_required()
def relatorio_vendas():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    periodo, msg = _parse_periodo()
    if not periodo:
        return jsonify({"erro": msg}), 400
    data_inicio, data_fim = periodo

    # ── Pedidos do período (excluindo cancelados) ──
    pedidos = (
        Pedido.query
        .filter(
            func.date(Pedido.criado_em) >= data_inicio,
            func.date(Pedido.criado_em) <= data_fim,
            Pedido.status != "cancelado"
        )
        .all()
    )

    total_pedidos = len(pedidos)
    faturamento   = sum(float(p.total or 0) for p in pedidos)
    ticket_medio  = round(faturamento / total_pedidos, 2) if total_pedidos else 0.0

    # ── Vendas por dia ──
    por_dia: dict = {}
    for p in pedidos:
        dia = p.criado_em.date().isoformat()
        if dia not in por_dia:
            por_dia[dia] = {"data": dia, "pedidos": 0, "faturamento": 0.0}
        por_dia[dia]["pedidos"]    += 1
        por_dia[dia]["faturamento"] = round(por_dia[dia]["faturamento"] + float(p.total or 0), 2)

    vendas_por_dia = sorted(por_dia.values(), key=lambda x: x["data"])

    # ── Comparativo período anterior ──
    inicio_ant, fim_ant = _periodo_anterior(data_inicio, data_fim)
    pedidos_ant = (
        Pedido.query
        .filter(
            func.date(Pedido.criado_em) >= inicio_ant,
            func.date(Pedido.criado_em) <= fim_ant,
            Pedido.status != "cancelado"
        )
        .all()
    )
    faturamento_ant   = sum(float(p.total or 0) for p in pedidos_ant)
    total_pedidos_ant = len(pedidos_ant)

    def _variacao(atual, anterior):
        if anterior == 0:
            return None  # sem base de comparação
        return round(((atual - anterior) / anterior) * 100, 2)

    return jsonify({
        "periodo": {"de": data_inicio.isoformat(), "ate": data_fim.isoformat()},
        "resumo": {
            "faturamento_total":  round(faturamento, 2),
            "total_pedidos":      total_pedidos,
            "ticket_medio":       ticket_medio,
        },
        "comparativo_periodo_anterior": {
            "de": inicio_ant.isoformat(),
            "ate": fim_ant.isoformat(),
            "faturamento_anterior":  round(faturamento_ant, 2),
            "pedidos_anteriores":    total_pedidos_ant,
            "variacao_faturamento_pct": _variacao(faturamento, faturamento_ant),
            "variacao_pedidos_pct":    _variacao(total_pedidos, total_pedidos_ant),
        },
        "vendas_por_dia": vendas_por_dia,
    }), 200


# ─────────────────────────────────────────────
# 2. GET /relatorios/produtos
# ─────────────────────────────────────────────

@bp.route("/produtos")
@jwt_required()
def relatorio_produtos():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    periodo, msg = _parse_periodo()
    if not periodo:
        return jsonify({"erro": msg}), 400
    data_inicio, data_fim = periodo

    # ── Agrupa itens vendidos no período ──
    itens = (
        db.session.query(
            ItemPedido.produto_id,
            func.sum(ItemPedido.quantidade).label("qtd_vendida"),
            func.sum(ItemPedido.quantidade * ItemPedido.preco_unitario).label("receita"),
        )
        .join(Pedido, ItemPedido.pedido_id == Pedido.id)
        .filter(
            func.date(Pedido.criado_em) >= data_inicio,
            func.date(Pedido.criado_em) <= data_fim,
            Pedido.status != "cancelado"
        )
        .group_by(ItemPedido.produto_id)
        .order_by(func.sum(ItemPedido.receita_bruta if False else ItemPedido.quantidade * ItemPedido.preco_unitario).desc())
        .all()
    )

    faturamento_total = sum(float(i.receita or 0) for i in itens)

    ranking = []
    for i in itens:
        produto    = db.session.get(Produto, i.produto_id)
        nome       = produto.nome if produto else f"Produto #{i.produto_id}"
        receita    = float(i.receita or 0)
        qtd        = int(i.qtd_vendida or 0)
        custo_unit = _custo_vigente(i.produto_id, data_fim)
        custo_total = round(custo_unit * qtd, 2)
        margem_bruta = round(receita - custo_total, 2)
        margem_pct   = round((margem_bruta / receita) * 100, 2) if receita else None
        representatividade = round((receita / faturamento_total) * 100, 2) if faturamento_total else 0.0

        ranking.append({
            "produto_id":        i.produto_id,
            "nome":              nome,
            "qtd_vendida":       qtd,
            "receita":           round(receita, 2),
            "representatividade_pct": representatividade,
            "custo_unitario":    custo_unit,
            "custo_total":       custo_total,
            "margem_bruta":      margem_bruta,
            "margem_pct":        margem_pct,
            "tem_custo_cadastrado": custo_unit > 0,
        })

    return jsonify({
        "periodo":           {"de": data_inicio.isoformat(), "ate": data_fim.isoformat()},
        "faturamento_total": round(faturamento_total, 2),
        "ranking":           ranking,
    }), 200


# ─────────────────────────────────────────────
# 3. GET /relatorios/pedidos
# ─────────────────────────────────────────────

@bp.route("/pedidos")
@jwt_required()
def relatorio_pedidos():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    periodo, msg = _parse_periodo()
    if not periodo:
        return jsonify({"erro": msg}), 400
    data_inicio, data_fim = periodo

    todos_pedidos = (
        Pedido.query
        .filter(
            func.date(Pedido.criado_em) >= data_inicio,
            func.date(Pedido.criado_em) <= data_fim,
        )
        .all()
    )

    total = len(todos_pedidos)

    # ── Por status ──
    por_status: dict = {}
    for p in todos_pedidos:
        por_status[p.status] = por_status.get(p.status, 0) + 1

    status_lista = [
        {"status": s, "quantidade": q, "percentual": round((q / total) * 100, 2) if total else 0}
        for s, q in sorted(por_status.items())
    ]

    # ── Por hora (heatmap) ──
    por_hora: dict = {h: 0 for h in range(24)}
    for p in todos_pedidos:
        hora = p.criado_em.hour
        por_hora[hora] += 1

    heatmap = [{"hora": h, "quantidade": por_hora[h]} for h in range(24)]

    # ── Cancelamentos ──
    cancelados = [p for p in todos_pedidos if p.status == "cancelado"]
    total_cancelados = len(cancelados)
    taxa_cancelamento = round((total_cancelados / total) * 100, 2) if total else 0.0

    # ── Tempo médio de preparo (criado_em → status pronto, se aplicável) ──
    # Nota: sem tabela de histórico de status, calculamos pelo que está disponível
    # Pode ser expandido no futuro com uma tabela PedidoStatusLog

    return jsonify({
        "periodo": {"de": data_inicio.isoformat(), "ate": data_fim.isoformat()},
        "resumo": {
            "total_pedidos":      total,
            "total_cancelados":   total_cancelados,
            "taxa_cancelamento_pct": taxa_cancelamento,
        },
        "por_status":  status_lista,
        "heatmap_por_hora": heatmap,
    }), 200


# ─────────────────────────────────────────────
# 4. GET /relatorios/motoboys
# ─────────────────────────────────────────────

@bp.route("/motoboys")
@jwt_required()
def relatorio_motoboys():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    periodo, msg = _parse_periodo()
    if not periodo:
        return jsonify({"erro": msg}), 400
    data_inicio, data_fim = periodo

    # ── Pedidos entregues no período com motoboy atribuído ──
    pedidos_entrega = (
        Pedido.query
        .filter(
            func.date(Pedido.criado_em) >= data_inicio,
            func.date(Pedido.criado_em) <= data_fim,
            Pedido.motoboy_id.isnot(None),
            Pedido.status != "cancelado"
        )
        .all()
    )

    # Agrupa por motoboy
    por_motoboy: dict = {}
    for p in pedidos_entrega:
        mid = p.motoboy_id
        if mid not in por_motoboy:
            motoboy = db.session.get(User, mid)
            por_motoboy[mid] = {
                "motoboy_id":   mid,
                "nome":         motoboy.nome if motoboy else f"Motoboy #{mid}",
                "entregas":     0,
                "km_total":     0.0,
                "repasse_total": 0.0,
                "entregues":    0,
                "nao_entregues": 0,
            }
        por_motoboy[mid]["entregas"]      += 1
        por_motoboy[mid]["km_total"]      += float(p.distancia_km or 0)
        por_motoboy[mid]["repasse_total"] += float(p.valor_repasse_motoboy or 0)
        if p.entregue is True:
            por_motoboy[mid]["entregues"] += 1
        elif p.entregue is False:
            por_motoboy[mid]["nao_entregues"] += 1

    motoboys_lista = []
    for dados in por_motoboy.values():
        dados["km_total"]      = round(dados["km_total"], 2)
        dados["repasse_total"] = round(dados["repasse_total"], 2)
        taxa_sucesso = round(
            (dados["entregues"] / dados["entregas"]) * 100, 2
        ) if dados["entregas"] else 0.0
        dados["taxa_sucesso_pct"] = taxa_sucesso
        motoboys_lista.append(dados)

    motoboys_lista.sort(key=lambda x: x["entregas"], reverse=True)

    total_repasse = round(sum(m["repasse_total"] for m in motoboys_lista), 2)
    total_km      = round(sum(m["km_total"] for m in motoboys_lista), 2)

    return jsonify({
        "periodo": {"de": data_inicio.isoformat(), "ate": data_fim.isoformat()},
        "resumo": {
            "total_entregas":    sum(m["entregas"] for m in motoboys_lista),
            "total_km_rodados":  total_km,
            "total_repasse":     total_repasse,
        },
        "motoboys": motoboys_lista,
    }), 200


# ─────────────────────────────────────────────
# 5. GET /relatorios/clientes
# ─────────────────────────────────────────────

@bp.route("/clientes")
@jwt_required()
def relatorio_clientes():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    periodo, msg = _parse_periodo()
    if not periodo:
        return jsonify({"erro": msg}), 400
    data_inicio, data_fim = periodo

    pedidos = (
        Pedido.query
        .filter(
            func.date(Pedido.criado_em) >= data_inicio,
            func.date(Pedido.criado_em) <= data_fim,
            Pedido.status != "cancelado"
        )
        .all()
    )

    por_cliente: dict = {}
    for p in pedidos:
        uid = p.user_id
        if uid not in por_cliente:
            cliente = db.session.get(User, uid)
            por_cliente[uid] = {
                "user_id":       uid,
                "nome":          cliente.nome if cliente else f"Cliente #{uid}",
                "email":         cliente.email if cliente else None,
                "total_pedidos": 0,
                "total_gasto":   0.0,
                "ultimo_pedido": None,
            }
        por_cliente[uid]["total_pedidos"] += 1
        por_cliente[uid]["total_gasto"]   += float(p.total or 0)

        data_pedido = p.criado_em.date().isoformat()
        if (
            por_cliente[uid]["ultimo_pedido"] is None
            or data_pedido > por_cliente[uid]["ultimo_pedido"]
        ):
            por_cliente[uid]["ultimo_pedido"] = data_pedido

    ranking = []
    for dados in por_cliente.values():
        dados["total_gasto"]   = round(dados["total_gasto"], 2)
        dados["ticket_medio"]  = round(
            dados["total_gasto"] / dados["total_pedidos"], 2
        ) if dados["total_pedidos"] else 0.0
        ranking.append(dados)

    ranking.sort(key=lambda x: x["total_gasto"], reverse=True)

    return jsonify({
        "periodo":          {"de": data_inicio.isoformat(), "ate": data_fim.isoformat()},
        "total_clientes":   len(ranking),
        "ranking_vip":      ranking,
    }), 200


# ─────────────────────────────────────────────
# 6. GET /relatorios/financeiro
# ─────────────────────────────────────────────

@bp.route("/financeiro")
@jwt_required()
def relatorio_financeiro():
    erro = requer_cargo("dono", "gerente", "administracao")
    if erro:
        return erro

    periodo, msg = _parse_periodo()
    if not periodo:
        return jsonify({"erro": msg}), 400
    data_inicio, data_fim = periodo

    def _carregar_transacoes(inicio, fim):
        return (
            TransacaoFinanceira.query
            .filter(
                TransacaoFinanceira.data_pagamento >= inicio,
                TransacaoFinanceira.data_pagamento <= fim,
                TransacaoFinanceira.status == "pago"
            )
            .all()
        )

    transacoes      = _carregar_transacoes(data_inicio, data_fim)
    inicio_ant, fim_ant = _periodo_anterior(data_inicio, data_fim)
    transacoes_ant  = _carregar_transacoes(inicio_ant, fim_ant)

    CUSTOS_FIXOS = {"Aluguel", "Funcionário", "Manutenção", "Marketing", "Outros"}
    CUSTOS_VARIAVEIS = {"Acerto Motoboy", "Compra Insumos"}

    def _consolidar(lista):
        receita_bruta   = 0.0
        custo_fixo      = 0.0
        custo_variavel  = 0.0
        outras_despesas = 0.0
        por_categoria: dict = {}

        for t in lista:
            valor = float(t.valor_total or 0)
            cat   = t.categoria

            if t.tipo == "RECEITA":
                receita_bruta += valor
            else:  # DESPESA
                if cat in CUSTOS_FIXOS:
                    custo_fixo += valor
                elif cat in CUSTOS_VARIAVEIS:
                    custo_variavel += valor
                else:
                    outras_despesas += valor

            chave = f"{t.tipo}:{cat}"
            if chave not in por_categoria:
                por_categoria[chave] = {"tipo": t.tipo, "categoria": cat, "total": 0.0, "quantidade": 0}
            por_categoria[chave]["total"]     += valor
            por_categoria[chave]["quantidade"] += 1

        total_despesas  = custo_fixo + custo_variavel + outras_despesas
        lucro_liquido   = receita_bruta - total_despesas
        margem_liquida  = round((lucro_liquido / receita_bruta) * 100, 2) if receita_bruta else None

        # Ponto de equilíbrio: custos_fixos / (1 - custos_variáveis/receita)
        if receita_bruta > 0:
            ratio_variavel = custo_variavel / receita_bruta
            ponto_equilibrio = round(custo_fixo / (1 - ratio_variavel), 2) if ratio_variavel < 1 else None
        else:
            ponto_equilibrio = None

        categorias_lista = sorted(por_categoria.values(), key=lambda x: x["total"], reverse=True)
        for c in categorias_lista:
            c["total"] = round(c["total"], 2)

        return {
            "receita_bruta":    round(receita_bruta, 2),
            "custos_fixos":     round(custo_fixo, 2),
            "custos_variaveis": round(custo_variavel, 2),
            "outras_despesas":  round(outras_despesas, 2),
            "total_despesas":   round(total_despesas, 2),
            "lucro_liquido":    round(lucro_liquido, 2),
            "margem_liquida_pct": margem_liquida,
            "ponto_equilibrio": ponto_equilibrio,
            "por_categoria":    categorias_lista,
        }

    dre         = _consolidar(transacoes)
    dre_anterior = _consolidar(transacoes_ant)

    def _variacao(atual, anterior):
        if anterior == 0:
            return None
        return round(((atual - anterior) / anterior) * 100, 2)

    return jsonify({
        "periodo": {"de": data_inicio.isoformat(), "ate": data_fim.isoformat()},
        "dre": dre,
        "comparativo_periodo_anterior": {
            "de":  inicio_ant.isoformat(),
            "ate": fim_ant.isoformat(),
            "receita_bruta":          dre_anterior["receita_bruta"],
            "lucro_liquido":          dre_anterior["lucro_liquido"],
            "total_despesas":         dre_anterior["total_despesas"],
            "variacao_receita_pct":   _variacao(dre["receita_bruta"],  dre_anterior["receita_bruta"]),
            "variacao_lucro_pct":     _variacao(dre["lucro_liquido"],  dre_anterior["lucro_liquido"]),
            "variacao_despesas_pct":  _variacao(dre["total_despesas"], dre_anterior["total_despesas"]),
        },
    }), 200