import React, { useState, useMemo, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import {
  FaArrowUp, FaArrowDown, FaWallet, FaChartPie, FaClock, FaCircleCheck, FaTriangleExclamation, FaDatabase
} from 'react-icons/fa6';
import { useFinancialSummary, useMovements } from '../../../hooks/useFinance';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { DataTable, type Column } from '../components/DataTable';
import type { TransactionItem, FinanceFilters } from '../../../types';

const defaultFilters: FinanceFilters = {
  de: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  ate: new Date().toISOString().split('T')[0]
};

export const FinanceDashboard = () => {
  const [filters, setFilters] = useState<FinanceFilters>(defaultFilters);

  const {
    data: summary,
    isLoading: loadingSummary,
    isError: errorSummary,
    error: errSummary,
    refetch: refetchSummary
  } = useFinancialSummary(filters);

  const {
    data: movements,
    isLoading: loadingMovements,
    isError: errorMovements,
    error: errMovements,
    refetch: refetchMovements
  } = useMovements(filters);

  useEffect(() => {
    if (summary) console.log('📊 Summary recebido:', summary);
    if (movements) console.log('📋 Movements recebido:', movements);
    if (errorSummary) console.error('❌ Erro summary:', errorSummary);
    if (errorMovements) console.error('❌ Erro movements:', errorMovements);
  }, [summary, movements, errorSummary, errorMovements]);

  const movementsColumns = useMemo<Column<TransactionItem>[]>(() => [
    {
      key: 'descricao',
      header: 'Descrição',
      className: 'ps-4',
      render: (row) => (
        <>
          <div className="fw-bold">{row.descricao}</div>
          <small className={`text-muted ${row.tipo === 'RECEITA' ? '' : 'd-block'}`}>
            {row.tipo === 'RECEITA' ? '📥 Receita' : '📤 Despesa'} • {row.categoria}
          </small>
          {row.pedido_id && <small className="text-muted d-block">Pedido #{row.pedido_id}</small>}
        </>
      )
    },
    {
      key: 'data_vencimento',
      header: 'Vencimento',
      render: (row) => {
        const isOverdue = new Date(row.data_vencimento) < new Date() && row.status === 'pendente';
        return (
          <span className={isOverdue ? 'text-danger fw-medium' : ''}>
            {new Date(row.data_vencimento).toLocaleDateString('pt-BR')}
            {isOverdue && <small className="d-block text-danger" style={{ fontSize: '0.75rem' }}>• Vencido</small>}
          </span>
        );
      }
    },
    {
      key: 'valor_total',
      header: 'Valor',
      render: (row) => {
        const isReceita = row.tipo === 'RECEITA';
        return (
          <span className={`fw-semibold ${isReceita ? 'text-success' : 'text-danger'}`}>
            {isReceita ? '+' : '-'} R$ {row.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          pill
          bg={row.status === 'pago' ? 'success' : row.status === 'cancelado' ? 'secondary' : 'warning'}
          className="text-uppercase"
          style={{ fontSize: '0.7rem' }}
        >
          {row.status}
        </Badge>
      )
    }
  ], []);

  const handleReset = () => setFilters(defaultFilters);

  if (errorSummary || errorMovements) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <Alert variant="danger" className="d-flex align-items-start gap-3">
          <FaTriangleExclamation size={20} className="mt-1 flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Falha ao carregar dados financeiros</strong>
            <p className="mb-2 small">
              {errorSummary?.message || errorMovements?.message || 'Erro desconhecido'}
            </p>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-danger" onClick={() => { refetchSummary(); refetchMovements(); }}>
                Tentar novamente
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleReset}>
                Redefinir filtros
              </button>
            </div>
          </div>
        </Alert>
      </Container>
    );
  }

  if (loadingSummary || loadingMovements) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <div className="d-flex flex-column justify-content-center align-items-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <small className="text-muted">Carregando dados financeiros...</small>
        </div>
      </Container>
    );
  }

  const totalReceitasPagas = summary?.receitas?.pagas ?? 0;
  const totalDespesasPagas = summary?.despesas?.pagas ?? 0;
  const saldoRealizado = summary?.saldo?.realizado ?? 0;
  const totalPendentes = (summary?.receitas?.pendente ?? 0) + (summary?.despesas?.pendente ?? 0);
  const movimentacoesLista = movements?.itens ?? [];

  const hasNoData = !summary && movimentacoesLista.length === 0;

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold mb-1">📊 Visão Geral Financeira</h2>
          <small className="text-muted">
            Acompanhe suas receitas, despesas e saldo em tempo real
          </small>
        </Col>
      </Row>

      {hasNoData && (
        <Alert variant="info" className="d-flex align-items-center gap-2 mb-4">
          <FaDatabase className="flex-shrink-0" />
          <div>
            <strong>Nenhum dado encontrado</strong> para o período selecionado.
            <div className="mt-1">
              <button className="btn btn-sm btn-outline-primary me-2" onClick={handleReset}>
                Ver mês atual
              </button>
              <small className="text-muted">
                Período: {filters.de} até {filters.ate}
              </small>
            </div>
          </div>
        </Alert>
      )}

      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success flex-shrink-0">
                <FaArrowUp size={24} />
              </div>
              <div>
                <small className="text-muted d-block mb-1">Receitas (Pagas)</small>
                <h3 className="fw-bold text-success mb-0">
                  R$ {totalReceitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 pt-0">
              <small className="text-muted">
                <FaCircleCheck className="me-1 text-success" />
                {summary?.receitas?.pagas ?? 0} de {summary?.receitas?.total ?? 0} recebidas
              </small>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3 text-danger flex-shrink-0">
                <FaArrowDown size={24} />
              </div>
              <div>
                <small className="text-muted d-block mb-1">Despesas (Pagas)</small>
                <h3 className="fw-bold text-danger mb-0">
                  R$ {totalDespesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 pt-0">
              <small className="text-muted">
                <FaClock className="me-1" />
                {summary?.despesas?.pendente ?? 0} pendentes de pagamento
              </small>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className={`border-0 shadow-sm h-100 ${saldoRealizado >= 0 ? 'bg-primary text-white' : 'bg-danger text-white'}`}>
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3 flex-shrink-0">
                <FaWallet size={24} />
              </div>
              <div>
                <small className="d-block mb-1 opacity-75">Saldo Realizado</small>
                <h3 className="fw-bold mb-0">
                  R$ {saldoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 pt-0">
              <small className="opacity-75">
                {saldoRealizado >= 0 ? '▲' : '▼'} {summary?.saldo?.situacao === 'positivo' ? 'Superávit' : 'Déficit'}
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaChartPie className="text-info mb-2" size={24} />
              <h5 className="fw-bold mb-0">
                {Object.keys(summary?.despesas?.por_categoria || {}).length}
              </h5>
              <small className="text-muted">Categorias</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaClock className="text-warning mb-2" size={24} />
              <h5 className="fw-bold mb-0">{totalPendentes}</h5>
              <small className="text-muted">Pendentes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaArrowUp className="text-success mb-2" size={24} />
              <h5 className="fw-bold mb-0">
                {summary?.receitas?.total && summary.receitas.total > 0
                  ? ((summary.receitas.pagas ?? 0) / summary.receitas.total * 100).toFixed(0)
                  : 0}%
              </h5>
              <small className="text-muted">Recebido</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaArrowDown className="text-danger mb-2" size={24} />
              <h5 className="fw-bold mb-0">
                {summary?.despesas?.total && summary.despesas.total > 0
                  ? ((summary.despesas.pagas ?? 0) / summary.despesas.total * 100).toFixed(0)
                  : 0}%
              </h5>
              <small className="text-muted">Pago</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <FinanceFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        categories={Array.from(new Set(movimentacoesLista.map(i => i.categoria)))}
      />

      <Row>
        <Col>
          <DataTable
            columns={movementsColumns}
            data={movimentacoesLista.slice(0, 10)}
            cardTitle="🕐 Movimentações Recentes"
            emptyMessage="Nenhuma movimentação encontrada para este período."
            isLoading={false} // Já tratamos o loading acima
          />
        </Col>
      </Row>

      {process.env.NODE_ENV === 'development' && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 bg-light">
              <Card.Body className="small">
                <strong>Debug:</strong>
                <pre className="mb-0 mt-2" style={{ maxHeight: '150px', overflow: 'auto' }}>
                  {JSON.stringify({ summary, movements }, null, 2)}
                </pre>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <style>{`
        .card-footer { background: transparent !important; }
      `}</style>
    </Container>
  );
};

export default FinanceDashboard;
