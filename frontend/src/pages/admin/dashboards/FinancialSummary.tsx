import React, { useState } from 'react';
import {
  Container, Row, Col, Card, ProgressBar, ListGroup, Badge, Alert, Spinner
} from 'react-bootstrap';
import { FaWallet, FaArrowUp, FaArrowDown, FaChartLine, FaCalendarDays, FaChartPie, FaTriangleExclamation } from 'react-icons/fa6';
import { useFinancialSummary } from '../../../hooks/useFinance';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import type { FinanceFilters, SummaryResponse } from '../../../types';

const defaultFilters: Pick<FinanceFilters, 'de' | 'ate'> = {
  de: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  ate: new Date().toISOString().split('T')[0]
};

export const FinancialSummaryDashboard = () => {
  const [filters, setFilters] = useState(defaultFilters);

  const {
    data: summary,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useFinancialSummary(filters);

  const handleReset = () => setFilters(defaultFilters);

  if (isLoading) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <div className="d-flex flex-column justify-content-center align-items-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <small className="text-muted">Carregando resumo financeiro...</small>
        </div>
      </Container>
    );
  }

  if (isError) {
    const message = (error as any)?.response?.data?.mensagem ||
      (error as any)?.response?.data?.erro ||
      (error as any)?.message ||
      'Erro desconhecido ao carregar dados.';
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <Alert variant="danger" className="d-flex align-items-start gap-3">
          <FaTriangleExclamation size={20} className="mt-1 flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Falha ao carregar o resumo financeiro</strong>
            <p className="mb-2 small">{message}</p>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
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

  if (!summary) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <div className="text-center py-5">
          <FaChartLine size={48} className="text-muted mb-3 opacity-50" />
          <h4 className="text-muted mb-2">Nenhum dado disponível para este período.</h4>
          <p className="text-muted small mb-3">
            Tente ajustar os filtros ou selecione um período diferente.
          </p>
          <button className="btn btn-outline-primary" onClick={handleReset}>
            Redefinir para mês atual
          </button>
        </div>
      </Container>
    );
  }

  const { receitas, despesas, saldo, periodo } = summary;

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaChartLine className="text-primary" /> Resumo Financeiro
          </h2>
          <small className="text-muted">
            <FaCalendarDays className="me-1" />
            {new Date(periodo.de).toLocaleDateString('pt-BR')} - {new Date(periodo.ate).toLocaleDateString('pt-BR')}
          </small>
        </Col>
        {isFetching && (
          <Col xs="auto">
            <Spinner animation="border" size="sm" variant="secondary" />
            <small className="text-muted ms-2">Atualizando...</small>
          </Col>
        )}
      </Row>

      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                <FaArrowUp size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Receitas Totais</small>
                <h3 className="fw-bold text-success mb-1">
                  R$ {receitas.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <small className="text-muted">
                  {receitas.pagas} pagas • {receitas.pendente} pendentes
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3 text-danger">
                <FaArrowDown size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Despesas Totais</small>
                <h3 className="fw-bold text-danger mb-1">
                  R$ {despesas.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <small className="text-muted">
                  {despesas.pagas} pagas • {despesas.pendente} pendentes
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className={`border-0 shadow-sm h-100 ${saldo.situacao === 'positivo' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                <FaWallet size={24} />
              </div>
              <div>
                <small className="d-block opacity-75">Saldo Realizado</small>
                <h3 className="fw-bold mb-1">
                  R$ {saldo.realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <small className="opacity-75">
                  Previsto: R$ {saldo.previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <FinanceFilterBar
        filters={filters}
        onFilterChange={(f) => setFilters({ de: f.de, ate: f.ate })}
        onReset={handleReset}
        showTypeFilter={false}
        showCategoryFilter={false}
      />

      <Row className="g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <FaChartPie /> Despesas por Categoria
              </h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {Object.entries(despesas.por_categoria)
                  .sort(([, a], [, b]) => b - a)
                  .map(([categoria, valor]) => {
                    const percent = despesas.total > 0 ? (valor / despesas.total) * 100 : 0;
                    return (
                      <ListGroup.Item key={categoria} className="border-0 px-0 py-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-medium">{categoria}</span>
                          <div className="text-end">
                            <div className="fw-bold">R$ {valor.toLocaleString('pt-BR')}</div>
                            <small className="text-muted">{percent.toFixed(1)}%</small>
                          </div>
                        </div>
                        <ProgressBar
                          now={percent}
                          variant="secondary"
                          style={{ height: '6px' }}
                          className="rounded"
                        />
                      </ListGroup.Item>
                    );
                  })}
                {Object.keys(despesas.por_categoria).length === 0 && (
                  <p className="text-muted text-center py-3">
                    Nenhuma despesa categorizada neste período.
                  </p>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Row className="g-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="text-muted mb-3">📥 Receitas</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pagas</span>
                    <Badge bg="success">{receitas.pagas}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pendentes</span>
                    <Badge bg="warning" text="dark">{receitas.pendente}</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Taxa de Conversão</span>
                    <span className="fw-bold">
                      {receitas.total > 0
                        ? ((receitas.pagas / receitas.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h6 className="text-muted mb-3">📤 Despesas</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pagas</span>
                    <Badge bg="success">{despesas.pagas}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pendentes</span>
                    <Badge bg="warning" text="dark">{despesas.pendente}</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Taxa de Pagamento</span>
                    <span className="fw-bold">
                      {despesas.total > 0
                        ? ((despesas.pagas / despesas.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="text-muted mb-3">📊 Fluxo de Caixa</h6>
                  <div className="d-flex align-items-center gap-3">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-success">Entradas</span>
                        <span className="text-danger">Saídas</span>
                      </div>
                      <div className="progress" style={{ height: '20px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{
                            width: `${receitas.total + despesas.total > 0
                              ? (receitas.total / (receitas.total + despesas.total)) * 100
                              : 50}%`
                          }}
                        />
                        <div
                          className="progress-bar bg-danger"
                          style={{
                            width: `${receitas.total + despesas.total > 0
                              ? (despesas.total / (receitas.total + despesas.total)) * 100
                              : 50}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold" style={{ fontSize: '1.25rem' }}>
                        R$ {saldo.realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <small className={saldo.situacao === 'positivo' ? 'text-success' : 'text-danger'}>
                        {saldo.situacao === 'positivo' ? '▲ Superávit' : '▼ Déficit'}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default FinancialSummaryDashboard;
