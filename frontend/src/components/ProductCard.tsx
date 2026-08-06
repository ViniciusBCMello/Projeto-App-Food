import { useCartStore } from '../hooks/useCartStore';
import { Card, Badge, Button } from 'react-bootstrap';

import Placeholder from "../assets/hamburg.png";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  available: boolean;
  image: string;
  description: string;
}

function ProductCard({ id, name, price, available, image, description }: ProductCardProps) {
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
    <Card
      className="h-100 border-0 shadow-sm"
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ position: 'relative', paddingTop: '60%', backgroundColor: '#f8f9fa' }}>
        <Card.Img
          src={image || Placeholder}
          alt={name}
          onError={(e) => { e.currentTarget.src = Placeholder; }}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
        {!available && (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Esgotado
          </div>
        )}
        {available && (
          <Badge
            pill
            bg="success"
            className="position-absolute top-0 end-0 m-2"
            style={{ fontSize: '0.7rem', padding: '0.4em 0.8em' }}
          >
            Disponível
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column p-3">
        <Card.Title
          className="fw-bold mb-2"
          style={{
            fontSize: '1.05rem',
            color: '#212529',
            lineHeight: '1.3',
            minHeight: '2.6em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {name}
        </Card.Title>

        <Card.Text
          className="text-muted mb-3 flex-grow-1"
          style={{
            fontSize: '0.85rem',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4em'
          }}
        >
          {displayDescription}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center mt-auto">
          <div>
            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Preço</small>
            <span className="fw-bold text-dark" style={{ fontSize: '1.25rem' }}>
              R$ {price.toFixed(2)}
            </span>
          </div>

          {!available ? (
            <Button
              variant="outline-secondary"
              size="sm"
              disabled
              className="rounded-pill px-3"
              style={{ fontSize: '0.8rem' }}
            >
              Indisponível
            </Button>
          ) : quantity === 0 ? (
            <Button
              variant="primary"
              size="sm"
              className="rounded-pill px-4 fw-semibold"
              onClick={handleIncrease}
              style={{ fontSize: '0.85rem' }}
            >
              Adicionar
            </Button>
          ) : (
            <div className="d-flex align-items-center bg-light rounded-pill p-1">
              <Button
                variant="light"
                size="sm"
                className="rounded-circle fw-bold p-0 d-flex align-items-center justify-content-center border-0"
                style={{ width: '30px', height: '30px', fontSize: '1.1rem' }}
                onClick={handleDecrease}
              >
                −
              </Button>
              <span
                className="fw-bold mx-2"
                style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.95rem' }}
              >
                {quantity}
              </span>
              <Button
                variant="primary"
                size="sm"
                className="rounded-circle fw-bold p-0 d-flex align-items-center justify-content-center border-0"
                style={{ width: '30px', height: '30px', fontSize: '1.1rem' }}
                onClick={handleIncrease}
              >
                +
              </Button>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default ProductCard;
