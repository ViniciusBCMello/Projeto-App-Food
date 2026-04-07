import { useState } from 'react';
import { Container, Card, Badge, Button, Spinner, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrder';
import type { Order } from '../types';

export default function Orders() {
  const navigate = useNavigate();
  const { useGetOrders, cancelOrder } = useOrder();

  // @ts-ignore
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: orders, isLoading, isError } = useGetOrders(statusFilter);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'aguardando': return <Badge bg="warning" text="dark">Aguardando</Badge>;
      case 'preparando': return <Badge bg="info">Preparando</Badge>;
      case 'saiu_para_entrega': return <Badge bg="primary">Saiu para Entrega</Badge>;
      case 'entregue': return <Badge bg="success">Entregue</Badge>;
      case 'cancelado': return <Badge bg="danger">Cancelado</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await cancelOrder(orderId);
        alert('Pedido cancelado com sucesso!');
      } catch (error) {
        alert('Erro ao cancelar o pedido. Ele pode já estar em preparo.');
      }
    }
  };

  if (isLoading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (isError) return <Container className="py-5"><Alert variant="danger">Erro ao carregar os pedidos.</Alert></Container>;

  const ordersList: Order[] = Array.isArray(orders) ? orders : orders?.data || [];

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">Meus Pedidos</h2>
        <Button variant="outline-primary" onClick={() => navigate('/')}>Novo Pedido</Button>
      </div>

      {ordersList.length === 0 ? (
        <Card className="text-center p-5 border-0 shadow-sm bg-light">
          <h5 className="text-muted mb-3">Nenhum pedido encontrado.</h5>
        </Card>
      ) : (
        <Row className="g-3">
          {ordersList.map((order) => (
            <Col xs={12} key={order.id}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">Pedido #{order.numero}</h5>
                      <small className="text-muted">{formatDate(order.criado_em)}</small>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="mb-3 text-muted small">
                    <strong>Itens:</strong> {order.itens.reduce((acc, item) => acc + item.quantidade, 0)}<br />
                    <strong>Pagamento:</strong> <span className="text-uppercase">{order.forma_pagamento}</span><br />
                    <strong>Total:</strong> R$ {Number(order.total).toFixed(2)}
                  </div>

                  <div className="d-flex justify-content-end border-top pt-3">
                    {order.status === 'aguardando' && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleCancelOrder(order.id)}>
                        Cancelar
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      className="ms-2"
                      onClick={() => navigate(`/pedidos/${order.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
