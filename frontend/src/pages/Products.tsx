import { useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { BACKEND_URL } from '../config/config';
import { useProducts, useCategories } from '../hooks/useProducts';
import { useNavigate } from 'react-router-dom';

function Products() {
  const navigate = useNavigate();

  const { data: productsData, isLoading: loadingProducts, isError: errorProducts } = useProducts();
  const { data: categoriesData, isLoading: loadingCats, isError: errorCats } = useCategories();

  const produtos = productsData?.data || [];
  const categories = categoriesData?.data || [];

  useEffect(() => {
    if (errorProducts || errorCats) {
      navigate('/login');
    }
  }, [errorProducts, errorCats, navigate]);

  if (loadingProducts || loadingCats) {
    return <p>Carregando cardápio...</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {categories.map((categoria) => {
        const produtosDaCategoria = produtos.filter(
          (p) => p.categoria_id === categoria.id
        );

        if (produtosDaCategoria.length === 0) return null;

        return (
          <div key={categoria.id} style={{ marginBottom: '40px' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              {categoria.nome}
            </h2>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
              {produtosDaCategoria.map((produto) => (
                <ProductCard
                  key={produto.id}
                  id={produto.id}
                  name={produto.nome}
                  price={produto.preco}
                  available={produto.disponivel}
                  description={produto.descricao}
                  image={`${BACKEND_URL}${produto.imagem_url}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Products;
