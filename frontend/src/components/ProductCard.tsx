import { useCartStore } from '../hooks/useCartStore';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';

import Placeholder from "../assets/hamburg.png";

function ProductCard({ id, name, price, available, image, description }) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const cartItem = useCartStore((state) =>
    state.items.find((item) => Number(item.id) === Number(id))
  );

  const quantity = cartItem ? cartItem.quantity : 0;

  const handleIncrease = () => {
    if (quantity === 0) {
      addItem(id);
    } else {
      updateQuantity(id, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity === 1) {
      removeItem(id);
    } else {
      updateQuantity(id, quantity - 1);
    }
  };

  const displayDescription = description && description.trim().length > 0
    ? description
    : "Delicioso item preparado com ingredientes selecionados e o toque especial da casa.";

  return (
    <Card className="mb-3 border-0 shadow-sm w-100" style={{ overflow: 'hidden', borderRadius: '12px' }}>
      <Row className="g-0 align-items-center">

        <Col xs={4} sm={3} md={2}>
          <div style={{ position: 'relative', paddingTop: '100%', backgroundColor: '#f8f9fa' }}>
            <Card.Img
              src={image || Placeholder}
              alt={name}
              onError={(e) => { e.currentTarget.src = Placeholder; }}
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0, left: 0
              }}
            />
            {!available && (
              <div
                className="d-flex align-items-center justify-content-center text-center p-1"
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  zIndex: 1,
                  textTransform: 'uppercase'
                }}
              >
                Esgotado
              </div>
            )}
          </div>
        </Col>

        <Col xs={8} sm={9} md={10}>
          <Card.Body className="d-flex flex-column justify-content-between py-2 px-3">
            <div>
              <div className="d-flex justify-content-between align-items-start gap-2">
                <Card.Title
                  className="h6 mb-1 text-truncate fw-bold"
                  style={{ fontSize: '1.1rem', color: '#333' }}
                >
                  {name}
                </Card.Title>
                <Badge
                  pill
                  bg={available ? "success" : "secondary"}
                  style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}
                >
                  {available ? "Disponível" : "Indisponível"}
                </Badge>
              </div>

              <Card.Text
                className="small text-muted mb-2"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.85rem',
                  lineHeight: '1.2',
                  minHeight: '32px',
                }}
              >
                {displayDescription}
              </Card.Text>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-1">
              <span className="fw-bold text-dark" style={{ fontSize: '1.15rem' }}>
                R$ {price.toFixed(2)}
              </span>

              <div className="d-flex align-items-center">
                {!available ? (
                  <Button variant="outline-secondary" size="sm" disabled className="px-3 fw-bold border-0">
                    Indisponível
                  </Button>
                ) : quantity === 0 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="px-4 fw-bold rounded-pill shadow-sm"
                    onClick={handleIncrease}
                  >
                    Adicionar
                  </Button>
                ) : (
                  <div className="d-flex align-items-center bg-light rounded-pill p-1 border shadow-sm">
                    <Button
                      variant="light"
                      size="sm"
                      className="rounded-circle fw-bold p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px' }}
                      onClick={handleDecrease}
                    >
                      -
                    </Button>
                    <span className="mx-3 fw-bold" style={{ minWidth: '15px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      className="rounded-circle fw-bold p-0 d-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: '28px', height: '28px' }}
                      onClick={handleIncrease}
                    >
                      +
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Col>
      </Row>
    </Card>
  );
}

export default ProductCard;
