import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaBox, FaPlus, FaTrash, FaPencil, FaImage } from 'react-icons/fa6';
import { useProducts, useCategories, useCreateProduct, useDeleteProduct } from '../../../hooks/useProducts';
import { DataTable, type Column } from '../components/DataTable';
import type { Product } from '../../../types';

export const ProductsDashboard: React.FC = () => {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    descricao: '',
    categoria_id: '',
    disponivel: true,
    imagem: null as File | null,
  });
  const [error, setError] = useState('');

  const columns = useMemo<Column<Product>[]>(() => [
    {
      key: 'imagem_url',
      header: 'Img',
      render: (row) => row.imagem_url ? (
        <img
          src={`https://projeto-app-food.onrender.com${row.imagem_url}`}
          alt={row.nome}
          className="rounded"
          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
        />
      ) : (
        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
          <FaImage className="text-muted" />
        </div>
      )
    },
    {
      key: 'nome',
      header: 'Produto',
      className: 'ps-3',
      render: (row) => (
        <>
          <div className="fw-bold">{row.nome}</div>
          <small className="text-muted">{row.categoria || 'Sem categoria'}</small>
        </>
      )
    },
    {
      key: 'preco',
      header: 'Preço',
      render: (row) => (
        <span className="fw-semibold text-dark">
          R$ {row.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'disponivel',
      header: 'Status',
      render: (row) => (
        <Badge pill bg={row.disponivel ? 'success' : 'secondary'}>
          {row.disponivel ? 'Disponível' : 'Indisponível'}
        </Badge>
      )
    }
  ], []);

  const actionsColumn: Column<Product> = {
    key: 'actions',
    header: 'Ações',
    render: () => null,
    actions: (row) => (
      <div className="d-flex gap-2 justify-content-center">
        <Button variant="outline-primary" size="sm" title="Editar (Em breve)">
          <FaPencil size={14} />
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          title="Excluir"
          onClick={() => {
            if (window.confirm(`Deseja realmente excluir "${row.nome}"?`)) {
              deleteMutation.mutate(row.id);
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <FaTrash size={14} />
        </Button>
      </div>
    )
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, imagem: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = new FormData();
    payload.append('nome', formData.nome);
    payload.append('preco', formData.preco);
    if (formData.descricao) payload.append('descricao', formData.descricao);
    if (formData.categoria_id) payload.append('categoria_id', formData.categoria_id);
    payload.append('disponivel', formData.disponivel.toString());
    if (formData.imagem) payload.append('imagem', formData.imagem);

    try {
      await createMutation.mutateAsync(payload);
      setShowModal(false);
      setFormData({ nome: '', preco: '', descricao: '', categoria_id: '', disponivel: true, imagem: null });
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao criar produto.');
    }
  };

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaBox className="text-primary" /> Gestão de Produtos
          </h2>
        </Col>
        <Col md="auto">
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
            <FaPlus /> Novo Produto
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <DataTable
            columns={[...columns, actionsColumn]}
            data={products || []}
            cardTitle="Cardápio Ativo"
            emptyMessage="Nenhum produto cadastrado."
            isLoading={isLoading}
          />
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cadastrar Novo Produto</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Nome do Produto *</Form.Label>
              <Form.Control name="nome" value={formData.nome} onChange={handleInputChange} required />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Preço (R$) *</Form.Label>
                  <Form.Control
                    type="number" step="0.01" name="preco"
                    value={formData.preco} onChange={handleInputChange} required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange}>
                    <option value="">Selecione...</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control as="textarea" rows={2} name="descricao" value={formData.descricao} onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Imagem do Produto</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              <Form.Text className="text-muted">Formatos: JPG, PNG. Max 5MB.</Form.Text>
            </Form.Group>

            <Form.Check
              type="switch"
              id="disponivel-switch"
              label="Produto disponível para venda"
              name="disponivel"
              checked={formData.disponivel}
              onChange={handleInputChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="success" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ProductsDashboard;
