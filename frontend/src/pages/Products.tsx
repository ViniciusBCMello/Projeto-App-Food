import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Row, Col } from 'react-bootstrap';

import ProductCard from '../components/ProductCard';
import { BACKEND_URL } from '../config/config';
import { useProducts, useCategories } from '../hooks/useProducts';

function Products() {
  const navigate = useNavigate();

  const {
    data: products,
    isLoading: loadingProducts,
    isError: errorProducts,
    error
  } = useProducts();

  const {
    data: categories,
    isLoading: loadingCats,
    isError: errorCats
  } = useCategories();

  const produtos = products || [];
  const categorias = categories || [];

  useEffect(() => {
    if (error) {
      const status = (error as any)?.response?.status;
      if (status === 401 || status === 403) {
        navigate('/login');
      }
    }
  }, [error, navigate]);

  if (loadingProducts || loadingCats) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted fw-semibold">Carregando cardápio...</p>
        </div>
      </Container>
    );
  }

  if ((errorProducts || errorCats) && (error as any)?.response?.status !== 401) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <strong>Ops!</strong> Não foi possível carregar o cardápio. Tente novamente mais tarde.
        </Alert>
      </Container>
    );
  }

  if (produtos.length === 0 || categorias.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="text-muted mb-3">Cardápio indisponível no momento</h3>
        <p className="text-muted">Não há produtos cadastrados ou disponíveis.</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {categorias.map((categoria) => {
        const produtosDaCategoria = produtos.filter(
          (p) => p.categoria_id === categoria.id && p.disponivel
        );

        if (produtosDaCategoria.length === 0) return null;

        return (
          <div key={categoria.id} className="mb-5">
            <h2 className="fw-bold mb-3" style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              {categoria.nome}
            </h2>

            <Row className="g-4">
              {produtosDaCategoria.map((produto) => (
                <Col key={produto.id} xs={12} sm={6} md={4} lg={3}>
                  <ProductCard
                    id={produto.id}
                    name={produto.nome}
                    price={produto.preco}
                    available={produto.disponivel}
                    description={produto.descricao || 'Sem descrição'}
                    image={produto.imagem_url ? `${BACKEND_URL}${produto.imagem_url}` : undefined}
                  />
                </Col>
              ))}
            </Row>
          </div>
        );
      })}
    </Container>
  );
}

export default Products;
