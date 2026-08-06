import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Dropdown, Modal } from 'react-bootstrap';
import { FaClock, FaCheck, FaXmark, FaEllipsisVertical, FaTruckFast } from 'react-icons/fa6';
import { useOrders, useUpdateOrderStatus, useCancelOrder } from '../../../hooks/useOrders';
import { DataTable, type Column } from '../components/DataTable';
import type { Order, OrderStatus } from '../../../types';

const statusLabels: Record<OrderStatus, string> = {
  aguardando: 'Aguardando',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  saiu_entrega: 'Saiu para Entrega',
  cheguei: 'Motoboy Chegou',
  cancelado: 'Cancelado',
};

const statusColors: Record<OrderStatus, string> = {
  aguardando: 'warning',
  em_preparo: 'info',
  pronto: 'primary',
  saiu_entrega: 'dark',
  cheguei: 'success',
  cancelado: 'secondary',
};

export const OrdersDashboard: React.FC = () => {
  const { data: orders, isLoading } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelMutation = useCancelOrder(); // 👇 Novo hook

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const activeOrders = useMemo(() => {
    return orders?.filter(o => o.status !== 'cancelado') || [];
  }, [orders]);

  const columns = useMemo<Column<Order>[]>(() => [
    {
      key: 'numero',
      header: 'Pedido',
      className: 'ps-4',
      render: (row) => (
        <>
          <div className="fw-bold">#{row.numero}</div>
          <small className="text-muted">{new Date(row.criado_em).toLocaleString('pt-BR')}</small>
        </>
      )
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (row) => (
        <>
          <div className="fw-semibold">{row.cliente.nome}</div>
          <small className="text-muted">{row.cliente.telefone}</small>
        </>
      )
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => (
        <span className="fw-bold text-dark">
          R$ {row.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge pill bg={statusColors[row.status]} className="text-uppercase">
          {statusLabels[row.status]}
        </Badge>
      )
    }
  ], []);

  const actionsColumn: Column<Order> = {
    key: 'actions',
    header: 'Ações',
    render: () => null,
    actions: (row) => (
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="text-muted p-0 border-0">
          <FaEllipsisVertical />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => { setSelectedOrder(row); setShowDetailsModal(true); }}>
            <FaCheck className="me-2 text-primary" /> Ver Detalhes
          </Dropdown.Item>

          {row.status !== 'cheguei' && row.status !== 'cancelado' && (
            <>
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() => {
                  const nextStatus = getNextStatus(row.status);
                  updateStatusMutation.mutate({ id: row.id, status: nextStatus });
                }}
                disabled={updateStatusMutation.isPending}
              >
                <FaTruckFast className="me-2 text-success" /> Avançar para "{statusLabels[getNextStatus(row.status)]}"
              </Dropdown.Item>

              <Dropdown.Divider />
              <Dropdown.Item
                className="text-danger"
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja cancelar o pedido #${row.numero}?`)) {
                    cancelMutation.mutate(row.id);
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                <FaXmark className="me-2" /> Cancelar Pedido
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
    )
  };

  const getNextStatus = (current: OrderStatus): OrderStatus => {
    const flow: OrderStatus[] = ['aguardando', 'em_preparo', 'pronto', 'saiu_entrega', 'cheguei'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : current;
  };

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaClock className="text-primary" /> Pedidos em Andamento
          </h2>
        </Col>
        <Col md="auto">
          <Badge bg="primary" pill className="fs-6 px-3 py-2">
            {activeOrders.length} Ativos
          </Badge>
        </Col>
      </Row>

      <Row>
        <Col>
          <DataTable
            columns={[...columns, actionsColumn]}
            data={activeOrders}
            cardTitle="Monitoramento em Tempo Real"
            emptyMessage="Nenhum pedido em andamento no momento. 🎉"
            isLoading={isLoading}
          />
        </Col>
      </Row>

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalhes do Pedido #{selectedOrder?.numero}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Cliente:</strong> {selectedOrder.cliente.nome} <br />
                  <strong>Telefone:</strong> {selectedOrder.cliente.telefone}
                </Col>
                <Col md={6} className="text-end">
                  <strong>Total:</strong> <span className="text-success fw-bold">R$ {selectedOrder.total.toFixed(2)}</span> <br />
                  <strong>Pagamento:</strong> {selectedOrder.forma_pagamento.toUpperCase()}
                </Col>
              </Row>
              {selectedOrder.observacoes && (
                <Card className="bg-warning bg-opacity-10 border-warning mb-3">
                  <Card.Body className="py-2">
                    <small className="fw-bold text-warning">📝 Observações:</small> {selectedOrder.observacoes}
                  </Card.Body>
                </Card>
              )}
              <h6 className="fw-bold mt-4">Itens do Pedido</h6>
              <ul className="list-group list-group-flush">
                {selectedOrder.itens.map(item => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>{item.quantidade}x {item.produto_nome}</span>
                    <span className="fw-semibold">R$ {item.subtotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrdersDashboard;
