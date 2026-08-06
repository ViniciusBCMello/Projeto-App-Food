import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Card, Badge, Button, Spinner, Table, Row, Col } from 'react-bootstrap';
import { api } from '../services/api';
import type { Order } from '../types';

import CartItem from '../components/CartItem';
import Placeholder from "../assets/hamburg.png";

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/pedidos/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const order: Order = orderData?.data || orderData;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

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

  if (isLoading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!order) return <Container className="py-5 text-center">Pedido não encontrado.</Container>;

  return (
    <Container className="py-5" style={{ maxWidth: '900px' }}>
      <Button variant="link" className="text-decoration-none mb-3 p-0" onClick={() => navigate('/meus-pedidos')}>
        &larr; Voltar para Meus Pedidos
      </Button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0">Pedido #{order.numero}</h2>
          <span className="text-muted small">{formatDate(order.criado_em)}</span>
        </div>
        <h4>{getStatusBadge(order.status)}</h4>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm overflow-hidden mb-4">
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th colSpan={2} className="ps-3">Item</th>
                  <th className="text-center">Quantidade</th>
                  <th className="text-end pe-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.itens.map((item) => (
                  <CartItem
                    key={item.id}
                    item={{
                      id: item.id,
                      nome: item.produto_nome,
                      preco: item.preco_unitario,
                      quantidade: item.quantidade,
                      imagem: Placeholder,
                      descricao: ""
                    }}
                    onIncrement={() => { }}
                    onDecrement={() => { }}
                  />
                ))}
              </tbody>
            </Table>
          </Card>

          {order.observacoes && (
            <Card className="border-0 shadow-sm bg-light">
              <Card.Body>
                <p className="fw-bold small text-muted mb-1">Observações do Cliente:</p>
                <p className="m-0 small">{order.observacoes}</p>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-3 p-3">
            <h6 className="fw-bold mb-3 border-bottom pb-2">Resumo</h6>
            <div className="d-flex justify-content-between small mb-2">
              <span className="text-muted">Pagamento</span>
              <span className="text-uppercase fw-bold">{order.forma_pagamento}</span>
            </div>
            <div className="d-flex justify-content-between mt-3 pt-2 border-top">
              <span className="fw-bold">Total</span>
              <span className="fw-bold text-success h5 m-0">R$ {Number(order.total).toFixed(2)}</span>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-3">
            <h6 className="fw-bold mb-3 border-bottom pb-2">Entrega</h6>
            <div className="small">
              <div className="fw-bold">{order.endereco.logradouro}, {order.endereco.numero}</div>
              {order.endereco.complemento && <div>{order.endereco.complemento}</div>}
              <div className="text-muted">
                {order.endereco.bairro} - {order.endereco.cidade}/{order.endereco.estado}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
