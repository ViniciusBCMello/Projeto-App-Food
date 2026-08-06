import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import { FaArrowUp, FaPlus, FaCheck, FaXmark } from 'react-icons/fa6';
import { useRevenue, usePayMovement, useCancelMovement } from '../../../hooks/useFinance';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { DataTable, type Column } from '../components/DataTable';
import type { TransactionItem, FinanceFilters } from '../../../types';

const defaultFilters: FinanceFilters = {
  de: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  ate: new Date().toISOString().split('T')[0],
  tipo: 'RECEITA'
};

const RevenueDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FinanceFilters>(defaultFilters);
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: revenue, isLoading } = useRevenue(filters);
  const payMutation = usePayMovement();
  const cancelMutation = useCancelMovement();

  const columns = useMemo<Column<TransactionItem>[]>(() => [
    {
      key: 'descricao',
      header: 'Descrição',
      className: 'ps-4',
      render: (row) => (
        <>
          <div className="fw-bold">{row.descricao}</div>
          {row.pedido_id && <small className="text-muted">Pedido #{row.pedido_id}</small>}
          {row.favorecido_nome && <small className="text-muted d-block">{row.favorecido_nome}</small>}
        </>
      )
    },
    { key: 'categoria', header: 'Categoria' },
    {
      key: 'data_vencimento',
      header: 'Vencimento',
      render: (row) => new Date(row.data_vencimento).toLocaleDateString('pt-BR')
    },
    {
      key: 'data_pagamento',
      header: 'Pagamento',
      render: (row) => row.data_pagamento
        ? new Date(row.data_pagamento).toLocaleDateString('pt-BR')
        : <span className="text-muted">—</span>
    },
    {
      key: 'valor_total',
      header: 'Valor',
      render: (row) => (
        <span className="text-success fw-semibold">
          + R$ {row.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
    if (window.confirm('Tem certeza que deseja cancelar esta receita?')) {
      cancelMutation.mutate(id);
    }
  };

  const handleReset = () => setFilters(defaultFilters);

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaArrowUp className="text-success" /> Receitas
          </h2>
        </Col>
        <Col md="auto">
          <Button variant="primary" className="d-flex align-items-center gap-2">
            <FaPlus /> Nova Receita
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Total do Período</small>
              <h3 className="fw-bold text-success mb-0">
                R$ {revenue?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Receitas Pagas</small>
              <h3 className="fw-bold mb-0">
                {revenue?.itens.filter(i => i.status === 'pago').length}
                <small className="text-muted fs-6"> / {revenue?.quantidade}</small>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Categorias</small>
              <div className="d-flex flex-wrap gap-1 mt-2">
                {revenue?.categorias.slice(0, 4).map(cat => (
                  <Badge key={cat} bg="light" text="dark">{cat}</Badge>
                ))}
                {revenue && revenue.categorias.length > 4 && (
                  <Badge bg="light" text="dark">+{revenue.categorias.length - 4}</Badge>
                )}
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
        categories={revenue?.categorias || []}
      />

      <Row>
        <Col>
          <DataTable
            columns={columns}
            data={revenue?.itens || []}
            cardTitle="Lista de Receitas"
            emptyMessage="Nenhuma receita encontrada para este período."
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
          <p className="text-success mb-3">
            + R$ {selected?.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <Form.Group>
            <Form.Label>Data do Pagamento</Form.Label>
            <Form.Control
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="success" onClick={handlePay} disabled={payMutation.isPending}>
            {payMutation.isPending ? 'Processando...' : <><FaCheck /> Confirmar Pagamento</>}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .table tbody tr:hover {
          background-color: rgba(0,0,0,0.02);
        }
        .table tbody tr:hover .action-buttons {
          opacity: 1;
        }
        .action-buttons {
          opacity: 0;
          transition: opacity 0.2s;
        }
      `}</style>
    </Container>
  );
};

export default RevenueDashboard;
