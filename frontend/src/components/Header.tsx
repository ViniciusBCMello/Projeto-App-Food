import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Navbar, Container, Button, Nav, Form, FormControl,
  Modal, Row, Col
} from 'react-bootstrap';
import {
  FaUtensils, FaUser, FaRightFromBracket, FaGear,
  FaStore, FaMagnifyingGlass, FaChevronRight
} from 'react-icons/fa6';

import { auth } from '../services/auth';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../hooks/useCartStore';
import { BACKEND_URL } from '../config/config';
import Placeholder from '../assets/hamburg.png'; // Ajuste o caminho se necessário
import type { Product } from '../types';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data: allProducts } = useProducts();
  const user = auth((state) => state.user || state.usuario);
  const logout = auth((state) => state.logout || state.clearAuth);

  // 👇 CORREÇÃO: Lemos os itens do carrinho reativamente
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const adminRoles = ['dono', 'gerente', 'administracao'];
  const hasAdminAccess = user && adminRoles.includes(user.cargo);

  const filteredProducts = allProducts?.filter((p) =>
    p.disponivel && (
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).slice(0, 5) || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsDropdownOpen(false);
      setSearchTerm('');
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  // 👇 CORREÇÃO: Agora o React recalcula isso sempre que cartItems muda
  const modalQuantity = selectedProduct
    ? cartItems.find((item) => Number(item.id) === Number(selectedProduct.id))?.quantity || 0
    : 0;

  const handleModalIncrease = () => {
    if (!selectedProduct) return;
    if (modalQuantity === 0) addItem(selectedProduct.id);
    else updateQuantity(selectedProduct.id, modalQuantity + 1);
  };

  const handleModalDecrease = () => {
    if (!selectedProduct) return;
    if (modalQuantity === 1) removeItem(selectedProduct.id);
    else updateQuantity(selectedProduct.id, modalQuantity - 1);
  };

  return (
    <>
      <Navbar expand="lg" className="bg-white shadow-sm sticky-top py-2" style={{ zIndex: 1030 }}>
        <Container>
          <Navbar.Brand as={NavLink} to="/" className="fw-bold text-primary d-flex align-items-center gap-2 mb-0">
            <FaUtensils size={22} />
            <span className="d-none d-sm-inline">ZentraFood</span>
          </Navbar.Brand>

          <div className="position-relative mx-auto my-2 my-lg-0" style={{ maxWidth: '400px', width: '100%' }} ref={searchContainerRef}>
            <Form onSubmit={handleSearchSubmit} className="d-flex">
              <FormControl
                type="search"
                placeholder="Buscar no cardápio..."
                className="me-2 rounded-pill border-secondary-subtle"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(e.target.value.length > 0);
                }}
                onFocus={() => searchTerm.length > 0 && setIsDropdownOpen(true)}
                style={{ fontSize: '0.9rem' }}
              />
              <Button
                variant="primary"
                type="submit"
                className="rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: '38px', height: '38px', flexShrink: 0 }}
              >
                <FaMagnifyingGlass size={16} />
              </Button>
            </Form>

            {isDropdownOpen && searchTerm.length > 0 && (
              <div className="position-absolute w-100 mt-2 bg-white rounded shadow-lg border" style={{ zIndex: 1050, maxHeight: '300px', overflowY: 'auto' }}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      className="w-100 text-start border-0 bg-transparent px-3 py-2 d-flex align-items-center gap-2"
                      style={{ transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <FaUtensils className="text-muted" size={14} />
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{product.nome}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem', maxWidth: '250px' }}>
                          {product.descricao || 'Sem descrição'}
                        </div>
                      </div>
                      <FaChevronRight className="text-primary" size={12} />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-center text-muted" style={{ fontSize: '0.9rem' }}>
                    Nenhum produto encontrado para "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="align-items-center gap-lg-3 gap-2">
              <Nav.Link as={NavLink} to="/produtos" className={({ isActive }) => `fw-semibold ${isActive ? 'text-primary' : 'text-dark'}`}>
                Cardápio
              </Nav.Link>
              <Nav.Link as={NavLink} to="/perfil-loja" className={({ isActive }) => `fw-semibold ${isActive ? 'text-primary' : 'text-dark'}`}>
                <FaStore className="me-1" /> Loja
              </Nav.Link>
              <Nav.Link as={NavLink} to="/meus-pedidos" className={({ isActive }) => `fw-semibold ${isActive ? 'text-primary' : 'text-dark'}`}>
                Meus Pedidos
              </Nav.Link>

              <div className="vr d-none d-lg-block mx-2"></div>

              {hasAdminAccess ? (
                <>
                  <Button as={NavLink} to="/admin/dashboard" variant="outline-primary" size="sm" className="rounded-pill d-flex align-items-center gap-2 border-0" title="Painel Admin">
                    <FaGear size={16} />
                    <span className="d-none d-sm-inline">Painel</span>
                  </Button>
                  <Button variant="light" size="sm" className="rounded-circle d-flex align-items-center justify-content-center text-danger" style={{ width: '34px', height: '34px' }} onClick={logout} title="Sair">
                    <FaRightFromBracket size={16} />
                  </Button>
                </>
              ) : user ? (
                <Button variant="light" size="sm" className="rounded-circle d-flex align-items-center justify-content-center text-danger" style={{ width: '34px', height: '34px' }} onClick={logout} title="Sair">
                  <FaRightFromBracket size={16} />
                </Button>
              ) : (
                <Button as={NavLink} to="/login" variant="primary" size="sm" className="rounded-pill d-flex align-items-center gap-2 shadow-sm">
                  <FaUser size={14} />
                  <span className="d-none d-sm-inline">Entrar</span>
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* MODAL DE DETALHES DO PRODUTO */}
      <Modal show={!!selectedProduct} onHide={handleCloseModal} centered size="lg">
        {selectedProduct && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold fs-5">{selectedProduct.nome}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <Row className="g-4">
                <Col md={5}>
                  <div className="position-relative rounded overflow-hidden bg-light" style={{ aspectRatio: '1/1' }}>
                    <img
                      src={selectedProduct.imagem_url ? `${BACKEND_URL}${selectedProduct.imagem_url}` : Placeholder}
                      alt={selectedProduct.nome}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = Placeholder; }}
                    />
                    {!selectedProduct.disponivel && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75 text-white fw-bold text-uppercase">
                        Esgotado
                      </div>
                    )}
                  </div>
                </Col>

                <Col md={7} className="d-flex flex-column">
                  <div className="mb-3">
                    <h3 className="fw-bold text-primary mb-2">
                      R$ {selectedProduct.preco.toFixed(2)}
                    </h3>
                    <p className="text-muted" style={{ lineHeight: '1.5' }}>
                      {selectedProduct.descricao || 'Delicioso item preparado com ingredientes selecionados e o toque especial da casa.'}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {!selectedProduct.disponivel ? (
                      <Button variant="outline-secondary" className="w-100 rounded-pill py-2 fw-semibold" disabled>
                        Produto Indisponível
                      </Button>
                    ) : modalQuantity === 0 ? (
                      <Button
                        variant="primary"
                        className="w-100 rounded-pill py-2 fw-semibold shadow-sm"
                        onClick={handleModalIncrease}
                      >
                        Adicionar ao Carrinho
                      </Button>
                    ) : (
                      <div className="d-flex align-items-center justify-content-between bg-light rounded-pill p-2 border">
                        <Button
                          variant="light"
                          className="rounded-circle fw-bold p-0 d-flex align-items-center justify-content-center border-0"
                          style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}
                          onClick={handleModalDecrease}
                        >
                          −
                        </Button>
                        <span className="fw-bold fs-5" style={{ minWidth: '30px', textAlign: 'center' }}>
                          {modalQuantity}
                        </span>
                        <Button
                          variant="primary"
                          className="rounded-circle fw-bold p-0 d-flex align-items-center justify-content-center border-0 shadow-sm"
                          style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}
                          onClick={handleModalIncrease}
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>
    </>
  );
}

export default Header;
