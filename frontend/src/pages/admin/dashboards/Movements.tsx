import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Dropdown } from 'react-bootstrap';
import { FaArrowsUpDown, FaCheck, FaXmark, FaEllipsisVertical } from 'react-icons/fa6';
import { useMovements, usePayMovement, useCancelMovement } from '../../../hooks/useFinance';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { DataTable, type Column } from '../components/DataTable';
import type { TransactionItem, FinanceFilters } from '../../../types';

const defaultFilters: FinanceFilters = {
  de: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  ate: new Date().toISOString().split('T')[0]
};

const MovementsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FinanceFilters>(defaultFilters);
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'pay' | 'cancel' | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: movements, isLoading } = useMovements(filters);
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
          <small className={`text-muted ${row.tipo === 'RECEITA' ? '' : 'd-block'}`}>
            {row.tipo === 'RECEITA' ? '📥 Receita' : '📤 Despesa'}
          </small>
          {row.pedido_id && <small className="text-muted d-block">Pedido #{row.pedido_id}</small>}
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

  const handleAction = (action: 'pay' | 'cancel') => {
    if (!selected?.id) return;
    setModalAction(action);
    if (action === 'pay') {
      setShowModal(true);
    } else {
      if (window.confirm(`Tem certeza que deseja ${action === 'cancel' ? 'cancelar' : 'baixar'} esta movimentação?`)) {
        cancelMutation.mutate(selected.id);
      }
    }
  };

  const handleConfirmPay = () => {
    if (!selected?.id) return;
    payMutation.mutate({ id: selected.id, data_pagamento: paymentDate });
    setShowModal(false);
    setSelected(null);
  };

  const handleReset = () => setFilters(defaultFilters);

  const actionsColumn: Column<TransactionItem> = {
    key: 'actions',
    header: '',
    render: () => null,
    actions: (row) => (
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="text-muted p-0 border-0 action-buttons">
          <FaEllipsisVertical />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {row.status === 'pendente' && (
            <>
              <Dropdown.Item onClick={() => { setSelected(row); handleAction('pay'); }}>
                <FaCheck className="me-2 text-success" /> Marcar como Pago
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => handleAction('cancel')} className="text-danger">
                <FaXmark className="me-2" /> Cancelar
              </Dropdown.Item>
            </>
          )}
          {row.status === 'pago' && (
            <Dropdown.Item disabled>
              <FaCheck className="me-2 text-success" /> Já pago
            </Dropdown.Item>
          )}
          {row.status === 'cancelado' && (
            <Dropdown.Item disabled className="text-muted">
              <FaXmark className="me-2" /> Cancelado
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    )
  };

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaArrowsUpDown /> Movimentações
          </h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Receitas</small>
              <h4 className="fw-bold text-success mb-0">
                R$ {movements?.resumo.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Despesas</small>
              <h4 className="fw-bold text-danger mb-0">
                R$ {movements?.resumo.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className={`border-0 shadow-sm ${movements?.resumo.situacao === 'positivo' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
            <Card.Body>
              <small className="d-block opacity-75">Saldo</small>
              <h4 className="fw-bold mb-0">
                R$ {movements?.resumo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <small className="text-muted">Total de Itens</small>
              <h4 className="fw-bold mb-0">{movements?.quantidade || 0}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <FinanceFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        categories={Array.from(new Set(movements?.itens.map(i => i.categoria) || []))}
      />

      <Row>
        <Col>
          <DataTable
            columns={[...columns, actionsColumn]}
            data={movements?.itens || []}
            cardTitle="Todas as Movimentações"
            emptyMessage="Nenhuma movimentação encontrada para este período."
            isLoading={isLoading}
          />
        </Col>
      </Row>

      <Modal show={showModal && modalAction === 'pay'} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Pagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="fw-bold">{selected?.descricao}</p>
          <p className={selected?.tipo === 'RECEITA' ? 'text-success' : 'text-danger'}>
            {selected?.tipo === 'RECEITA' ? '+' : '-'} R$ {selected?.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <Button
            variant={selected?.tipo === 'RECEITA' ? 'success' : 'danger'}
            onClick={handleConfirmPay}
            disabled={payMutation.isPending}
          >
            {payMutation.isPending ? 'Processando...' : 'Confirmar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MovementsDashboard;
