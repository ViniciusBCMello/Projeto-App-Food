import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Form, Badge, Spinner } from 'react-bootstrap';
import { useFinancialSummary, useMovements } from '../../hooks/useFinance';
import { FaArrowUp, FaArrowDown, FaWallet, FaRegCalendarAlt } from 'react-icons/fa';

const FinanceDashboard = () => {
  const [filters, setFilters] = useState({
    de: '2026-04-01',
    ate: '2026-04-30'
  });

  const { data: summary, isLoading: loadingSummary } = useFinancialSummary(filters);
  const { data: movements, isLoading: loadingMovements } = useMovements(filters);

  if (loadingSummary || loadingMovements) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      {/* Header com Filtro */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold">Visão Geral Financeira</h2>
        </Col>
        <Col md={4} className="d-flex gap-2">
          <Form.Control
            type="date"
            value={filters.de}
            onChange={(e) => setFilters({ ...filters, de: e.target.value })}
          />
          <Form.Control
            type="date"
            value={filters.ate}
            onChange={(e) => setFilters({ ...filters, ate: e.target.value })}
          />
        </Col>
      </Row>

      {/* Cards de Resumo */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                <FaArrowUp size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Receitas (Pagas)</small>
                <h4 className="fw-bold mb-0">R$ {summary?.receitas.pagas.toLocaleString('pt-BR')}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3 text-danger">
                <FaArrowDown size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Despesas (Pagas)</small>
                <h4 className="fw-bold mb-0">R$ {summary?.despesas.pagas.toLocaleString('pt-BR')}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm text-white bg-primary">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                <FaWallet size={24} />
              </div>
              <div>
                <small className="d-block opacity-75">Saldo Realizado</small>
                <h4 className="fw-bold mb-0">R$ {summary?.saldo.realizado.toLocaleString('pt-BR')}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-0">
              <h5 className="mb-0 fw-bold">Movimentações Recentes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4">Descrição</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {movements?.itens.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4">
                        <div className="fw-bold">{item.descricao}</div>
                        <small className="text-muted">{item.tipo}</small>
                      </td>
                      <td>{item.categoria}</td>
                      <td>{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className={item.tipo === 'RECEITA' ? 'text-success' : 'text-danger'}>
                        {item.tipo === 'RECEITA' ? '+' : '-'} R$ {item.valor_total.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <Badge pill bg={item.status === 'pago' ? 'success' : 'warning'}>
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {movements?.itens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        Nenhuma movimentação encontrada para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FinanceDashboard;
