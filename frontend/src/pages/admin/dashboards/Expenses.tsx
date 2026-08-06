import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, ProgressBar } from 'react-bootstrap';
import { FaArrowDown, FaPlus, FaCheck, FaXmark, FaChartPie } from 'react-icons/fa6';
import { useExpenses, usePayMovement, useCancelMovement } from '../../../hooks/useFinance';
import { FinanceFilterBar } from '../components/FinanceFilterBar'
import { DataTable, type Column } from '../components/DataTable';
import type { TransactionItem, FinanceFilters } from '../../../types';

const defaultFilters: FinanceFilters = {
  de: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  ate: new Date().toISOString().split('T')[0],
  tipo: 'DESPESA'
};

const ExpensesDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FinanceFilters>(defaultFilters);
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: expenses, isLoading } = useExpenses(filters);
  const payMutation = usePayMovement();
  const cancelMutation = useCancelMovement();

  const categoriesSummary = useMemo(() => {
    if (!expenses?.itens) return [];
    const map = new Map<string, number>();
    expenses.itens.forEach(item => {
      map.set(item.categoria, (map.get(item.categoria) || 0) + item.valor_total);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [expenses]);

  const columns = useMemo<Column<TransactionItem>[]>(() => [
    {
      key: 'descricao',
      header: 'Descrição',
      className: 'ps-4',
      render: (row) => (
        <>
          <div className="fw-bold">{row.descricao}</div>
          {row.pedido_id && <small className="text-muted">Pedido #{row.pedido_id}</small>}
          {row.favorecido_nome && <small className="text-muted d-block">Favorecido: {row.favorecido_nome}</small>}
        </>
      )
    },
    { key: 'categoria', header: 'Categoria' },
    {
      key: 'data_vencimento',
      header: 'Vencimento',
      render: (row) => {
        const isOverdue = new Date(row.data_vencimento) < new Date() && row.status === 'pendente';
        return (
          <span className={isOverdue ? 'text-danger fw-semibold' : ''}>
            {new Date(row.data_vencimento).toLocaleDateString('pt-BR')}
            {isOverdue && <small className="d-block text-danger">• Vencido</small>}
          </span>
        );
      }
    },
    {
      key: 'valor_total',
      header: 'Valor',
      render: (row) => (
        <span className="text-danger fw-semibold">
          - R$ {row.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          pill
          bg={
            row.status === 'pago' ? 'success' :
              row.status === 'cancelado' ? 'secondary' : 'warning'
          }
        >
          {row.status.toUpperCase()}
        </Badge>
      )
    }
  ], []);

  const handlePay = () => {
    if (!selected?.id) return;
    payMutation.mutate({ id: selected.id, data_pagamento: paymentDate });
    setShowModal(false);
    setSelected(null);
  };

  const handleCancel = (id: number) => {
    if (window.confirm('Tem certeza que deseja cancelar esta despesa?')) {
      cancelMutation.mutate(id);
    }
  };

  const handleReset = () => setFilters(defaultFilters);

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaArrowDown className="text-danger" /> Despesas
          </h2>
        </Col>
        <Col md="auto">
          <Button variant="danger" className="d-flex align-items-center gap-2">
            <FaPlus /> Nova Despesa
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Total do Período</small>
              <h3 className="fw-bold text-danger mb-0">
                R$ {expenses?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Despesas Pendentes</small>
              <h3 className="fw-bold mb-0">
                {expenses?.itens.filter(i => i.status === 'pendente').length}
                <small className="text-muted fs-6"> / {expenses?.quantidade}</small>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted d-flex align-items-center gap-2">
                <FaChartPie /> Top Categorias
              </small>
              <div className="mt-2">
                {categoriesSummary.map(([cat, value], idx) => (
                  <div key={cat} className="mb-2">
                    <div className="d-flex justify-content-between small">
                      <span>{cat}</span>
                      <span className="fw-semibold">R$ {value.toLocaleString('pt-BR')}</span>
                    </div>
                    <ProgressBar
                      now={(value / (expenses?.total || 1)) * 100}
                      variant={idx === 0 ? 'danger' : 'secondary'}
                      style={{ height: '4px' }}
                    />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <FinanceFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        showTypeFilter={false}
        categories={expenses?.categorias || []}
      />

      <Row>
        <Col>
          <DataTable
            columns={columns}
            data={expenses?.itens || []}
            cardTitle="Lista de Despesas"
            emptyMessage="Nenhuma despesa encontrada para este período."
            isLoading={isLoading}
            onRowClick={(row) => row.status === 'pendente' && setSelected(row)}
          />
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Pagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="fw-bold">{selected?.descricao}</p>
          <p className="text-danger mb-3">
            - R$ {selected?.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Data do Pagamento</Form.Label>
            <Form.Control
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Observações (opcional)</Form.Label>
            <Form.Control as="textarea" rows={2} placeholder="Ex: Pago via PIX" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="success" onClick={handlePay} disabled={payMutation.isPending}>
            {payMutation.isPending ? 'Processando...' : <><FaCheck /> Confirmar Pagamento</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ExpensesDashboard;
