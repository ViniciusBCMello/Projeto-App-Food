import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Modal, Button } from 'react-bootstrap';
import { FaClock, FaStore, FaCheck, FaXmark, FaTruckFast } from 'react-icons/fa6';
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
  const { data: orders, isLoading, isError, error } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelMutation = useCancelOrder();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 🔒 Garante que estamos trabalhando com um Array
  const ordersArray = Array.isArray(orders)
    ? orders
    : (orders as any)?.data || [];

  const activeOrders = useMemo(() => {
    return ordersArray.filter((o: any) => o.status !== 'cancelado');
  }, [ordersArray]);

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
      key: 'origem',
      header: 'Origem',
      render: (row) => {
        if (row.origem === 'ifood') {
          return (
            <>
              <Badge bg="danger" className="mb-1 d-flex align-items-center gap-1 w-fit-content">
                <FaStore size={12} /> iFood
              </Badge>
              <div className="small text-muted fw-semibold">
                ID: {row.ifood_display_id || 'N/A'}
              </div>
            </>
          );
        }
        if (row.origem === 'food99') {
          return (
            <>
              <Badge bg="warning" text="dark" className="mb-1 d-flex align-items-center gap-1 w-fit-content">
                <FaStore size={12} /> Food99
              </Badge>
              <div className="small text-muted fw-semibold">
                ID: {row.food99_display_id || 'N/A'}
              </div>
            </>
          );
        }
        return (
          <>
            <Badge bg="primary" className="mb-1 d-flex align-items-center gap-1 w-fit-content">
              <FaStore size={12} /> Interno
            </Badge>
            <div className="small text-muted">Pedido Direto</div>
          </>
        );
      }
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (row) => (
        <>
          <div className="fw-semibold">{row.cliente.nome}</div>
          <small className="text-muted">{row.cliente.telefone || 'Sem telefone'}</small>
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

  const getNextStatus = (current: OrderStatus): OrderStatus => {
    const flow: OrderStatus[] = ['aguardando', 'em_preparo', 'pronto', 'saiu_entrega', 'cheguei'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : current;
  };

  const handleAdvanceStatus = (order: Order) => {
    const nextStatus = getNextStatus(order.status);
    updateStatusMutation.mutate({ id: order.id, status: nextStatus });
  };

  const handleCancelOrder = (orderId: number) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      cancelMutation.mutate(orderId);
      setShowDetailsModal(false);
    }
  };

  // Tratamento de erro visual caso a requisição falhe
  if (isError) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <Alert variant="danger" className="mt-4">
          <strong>Erro ao carregar pedidos:</strong> {(error as any)?.response?.data?.erro || 'Verifique sua conexão ou tente novamente mais tarde.'}
        </Alert>
      </Container>
    );
  }

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
            columns={columns}
            data={activeOrders}
            cardTitle="Monitoramento em Tempo Real"
            emptyMessage="Nenhum pedido em andamento no momento. 🎉"
            isLoading={isLoading}
            // 👇 AQUI ESTÁ A MÁGICA: Torna a linha clicável e abre o modal
            onRowClick={(row) => {
              setSelectedOrder(row);
              setShowDetailsModal(true);
            }}
          />
        </Col>
      </Row>

      {/* Modal de Detalhes do Pedido */}
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
                  <strong>Telefone:</strong> {selectedOrder.cliente.telefone || 'Não informado'}
                </Col>
                <Col md={6} className="text-end">
                  <strong>Total:</strong> <span className="text-success fw-bold">R$ {selectedOrder.total.toFixed(2)}</span> <br />
                  <strong>Pagamento:</strong> {selectedOrder.forma_pagamento.replace('_', ' ').toUpperCase()}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <strong>Origem:</strong> {selectedOrder.origem === 'ifood' ? 'iFood' : selectedOrder.origem === 'food99' ? 'Food99' : 'Interno'}
                  {selectedOrder.origem === 'ifood' && selectedOrder.ifood_display_id && ` (ID: ${selectedOrder.ifood_display_id})`}
                  {selectedOrder.origem === 'food99' && selectedOrder.food99_display_id && ` (ID: ${selectedOrder.food99_display_id})`}
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

        {/* Ações movidas para o rodapé do modal, mantendo a tabela limpa */}
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fechar
          </Button>

          {selectedOrder && selectedOrder.status !== 'cheguei' && selectedOrder.status !== 'cancelado' && (
            <div className="d-flex gap-2">
              <Button
                variant="danger"
                onClick={() => handleCancelOrder(selectedOrder.id)}
                disabled={cancelMutation.isPending}
              >
                <FaXmark className="me-1" /> Cancelar
              </Button>
              <Button
                variant="success"
                onClick={() => handleAdvanceStatus(selectedOrder)}
                disabled={updateStatusMutation.isPending}
              >
                <FaTruckFast className="me-1" /> Avançar para {statusLabels[getNextStatus(selectedOrder.status)]}
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrdersDashboard;
