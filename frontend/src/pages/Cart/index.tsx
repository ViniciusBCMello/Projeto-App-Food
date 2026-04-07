import { useState } from 'react';
import { useCartStore } from '../../hooks/useCartStore';
import { useProducts } from '../../hooks/useProducts';
import { useOrder } from '../../hooks/useOrder';
import { Container, Row, Col, Button, Table, Card, Spinner, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config/config';

import CartItem from '../../components/CartItem';
import AddressSelector from './Components/AddressSelector';
import Placeholder from "../../assets/hamburg.png";

function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const { data: productsData, isLoading } = useProducts();
  const { createOrder, isCreating } = useOrder();

  const [formaPagamento, setFormaPagamento] = useState<"pix" | "dinheiro" | "cartao">("pix");  const [observacoes, setObservacoes] = useState('');

  const [enderecoId, setEnderecoId] = useState<number | null>(null);

  const allProducts = Array.isArray(productsData) ? productsData : productsData?.data || [];

  const cartWithDetails = items.map((cartItem) => {
    const product = allProducts.find((p) => Number(p.id) === Number(cartItem.id));

    return {
      id: Number(cartItem.id),
      nome: product?.nome || 'Produto...',
      preco: product?.preco ? Number(product.preco) : 0,
      quantidade: Number(cartItem.quantity) || 0,
      imagem: product?.imagem_url ? `${BACKEND_URL}${product.imagem_url}` : Placeholder,
      descricao: product?.descricao || ''
    };
  });

  const totalGeral = cartWithDetails.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const handleDecrement = (id: number, currentQty: number) => {
    if (currentQty <= 1) {
      removeItem(id);
    } else {
      updateQuantity(id, currentQty - 1);
    }
  };

  const handleFinalize = async () => {
    if (!enderecoId) {
      alert('Por favor, selecione ou adicione um endereço para entrega.');
      return;
    }

    try {
      const payload = {
        endereco_id: enderecoId,
        forma_pagamento: formaPagamento,
        observacoes: observacoes,
        itens: items.map(item => ({
          produto_id: Number(item.id),
          quantidade: Number(item.quantity)
        }))
      };

      const result = await createOrder(payload);
      alert(`Pedido #${result.numero} realizado com sucesso!`);
      clearCart();
      navigate('/meus-pedidos');
    } catch (error) {
      console.error(error);
      alert('Erro ao processar pedido. Verifique os dados e tente novamente.');
    }
  };

  if (isLoading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h2 className="fw-bold">Carrinho vazio</h2>
        <Button variant="primary" className="mt-3" onClick={() => navigate('/')}>Voltar ao Cardápio</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: '900px' }}>
      <h2 className="fw-bold mb-4">Finalizar Pedido</h2>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm overflow-hidden mb-3">
            <Table responsive hover className="align-middle mb-0" style={{ fontSize: '0.9rem' }}>
              <thead className="table-light">
                <tr>
                  <th colSpan={2} className="ps-3">Item</th>
                  <th className="text-center" style={{ width: '120px' }}>Quantidade</th>
                  <th className="text-end pe-3" style={{ width: '100px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cartWithDetails.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onIncrement={(id, qty) => updateQuantity(id, qty + 1)}
                    onDecrement={handleDecrement}
                  />
                ))}
              </tbody>
            </Table>
          </Card>

          <Card className="border-0 shadow-sm p-3">
            <Form.Group>
              <Form.Label className="fw-bold small text-muted">Observações do Pedido</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Ex: Tirar cebola, ponto da carne..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="border-0 bg-light shadow-none"
              />
            </Form.Group>
          </Card>

          <Button variant="link" className="text-muted mt-2 small p-0 text-decoration-none" onClick={clearCart}>
            Esvaziar carrinho
          </Button>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm p-4 sticky-top" style={{ top: '20px' }}>
            <h5 className="fw-bold mb-3">Resumo</h5>

            <AddressSelector
              selectedAddressId={enderecoId}
              onChange={setEnderecoId}
            />

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Forma de Pagamento</Form.Label>
              <Form.Select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as "pix" | "dinheiro" | "cartao")}
                className="bg-light border-0 shadow-none"
              >
                <option value="pix">PIX</option>
                <option value="cartao">Cartão na Entrega</option>
                <option value="dinheiro">Dinheiro</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-between mb-2 align-items-center">
              <span>Total:</span>
              <span className="h4 fw-bold text-success m-0">R$ {totalGeral.toFixed(2)}</span>
            </div>

            <Button
              variant="success"
              size="lg"
              className="w-100 py-3 fw-bold mt-3 shadow-sm"
              onClick={handleFinalize}
              disabled={isCreating || !enderecoId}
            >
              {isCreating ? <Spinner size="sm" animation="border" /> : 'CONCLUIR PEDIDO'}
            </Button>

            <Button variant="link" className="w-100 mt-2 text-muted small" onClick={() => navigate('/')}>
              Adicionar mais itens
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;
