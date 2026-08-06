import { NavLink } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { RiStore2Line, RiFileList3Line, RiShoppingBasket2Line } from 'react-icons/ri';
import { useCartStore } from '../hooks/useCartStore';

export default function Footer() {
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <footer className="fixed-bottom bg-white border-top py-2 shadow-lg d-lg-none">
      <Container>
        <Row className="text-center g-0">
          <Col>
            <NavLink
              to="/produtos"
              className={({ isActive }) =>
                `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`
              }
            >
              <RiStore2Line size={24} />
              <span style={{ fontSize: '0.75rem' }}>Cardápio</span>
            </NavLink>
          </Col>

          <Col>
            <NavLink
              to="/meus-pedidos"
              className={({ isActive }) =>
                `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`
              }
            >
              <RiFileList3Line size={24} />
              <span style={{ fontSize: '0.75rem' }}>Pedidos</span>
            </NavLink>
          </Col>

          <Col>
            <NavLink
              to="/carrinho"
              className={({ isActive }) =>
                `d-flex flex-column align-items-center text-decoration-none position-relative ${isActive ? 'text-primary' : 'text-muted'}`
              }
            >
              <RiShoppingBasket2Line size={24} />
              {cartCount > 0 && (
                <span
                  className="position-absolute top-0 start-50 badge rounded-pill bg-danger"
                  style={{ fontSize: '0.6rem', transform: 'translate(5px, -5px)' }}
                >
                  {cartCount}
                </span>
              )}
              <span style={{ fontSize: '0.75rem' }}>Carrinho</span>
            </NavLink>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}