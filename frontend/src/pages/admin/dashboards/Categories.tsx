import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaTags, FaPlus, FaPencil, FaTrash } from 'react-icons/fa6';

// ⚠️ ATENÇÃO: Ajuste o caminho abaixo se você separou os hooks de categoria em outro arquivo.
// Se eles estiveram no mesmo arquivo dos produtos, o caminho está correto.
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory
} from '../../../hooks/useProducts';

import { DataTable, type Column } from '../components/DataTable';
import type { Category } from '../../../types';

export const CategoriesDashboard: React.FC = () => {
  const { data: categories, isLoading, isError, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ nome: '', ativa: true });
  const [apiError, setApiError] = useState('');

  const columns = useMemo<Column<Category>[]>(() => [
    {
      key: 'nome',
      header: 'Nome da Categoria',
      className: 'ps-4',
      render: (row) => <span className="fw-semibold">{row.nome}</span>
    },
    {
      key: 'ativa',
      header: 'Status',
      render: (row) => (
        <Badge pill bg={row.ativa ? 'success' : 'secondary'} className="text-uppercase">
          {row.ativa ? 'Ativa' : 'Inativa'}
        </Badge>
      )
    }
  ], []);

  const actionsColumn: Column<Category> = {
    key: 'actions',
    header: 'Ações',
    render: () => null,
    actions: (row) => (
      <div className="d-flex gap-2 justify-content-center">
        <Button variant="outline-primary" size="sm" title="Editar" onClick={() => handleEdit(row)}>
          <FaPencil size={14} />
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          title="Excluir"
          onClick={() => {
            if (window.confirm(`Deseja realmente excluir a categoria "${row.nome}"?\n\nAtenção: A exclusão falhará se houver produtos vinculados a ela.`)) {
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

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ nome: category.nome, ativa: category.ativa });
    setApiError('');
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingCategory(null);
    setFormData({ nome: '', ativa: true });
    setApiError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    try {
      if (editingCategory) {
        // Atualização: envia nome e status
        await updateMutation.mutateAsync({ id: editingCategory.id, data: formData });
      } else {
        // Criação: a API geralmente só precisa do nome (ativa é true por padrão)
        await createMutation.mutateAsync({ nome: formData.nome });
      }
      setShowModal(false);
    } catch (err: any) {
      setApiError(err.response?.data?.erro || 'Erro ao salvar categoria.');
    }
  };

  if (isError) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <Alert variant="danger" className="mt-4">
          <strong>Erro ao carregar categorias:</strong> {(error as any)?.response?.data?.erro || 'Erro desconhecido'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2">
            <FaTags className="text-primary" /> Gestão de Categorias
          </h2>
          <small className="text-muted">Organize seus produtos criando e gerenciando categorias.</small>
        </Col>
        <Col md="auto">
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleNew}>
            <FaPlus /> Nova Categoria
          </Button>
        </Col>
      </Row>

      {/* Tabela */}
      <Row>
        <Col>
          <DataTable
            columns={[...columns, actionsColumn]}
            data={categories || []}
            cardTitle="Categorias Cadastradas"
            emptyMessage="Nenhuma categoria encontrada. Clique em 'Nova Categoria' para começar."
            isLoading={isLoading}
          />
        </Col>
      </Row>

      {/* Modal de Criação/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? 'Editar' : 'Nova'} Categoria</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {apiError && <Alert variant="danger" className="py-2 mb-3">{apiError}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Nome da Categoria *</Form.Label>
              <Form.Control
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Lanches, Bebidas, Sobremesas, Combos"
                autoFocus
              />
            </Form.Group>

            {/* O switch de "Ativa" só faz sentido na edição, pois na criação ela já nasce ativa */}
            {editingCategory && (
              <Form.Check
                type="switch"
                id="ativa-switch"
                label="Categoria ativa (visível no cardápio)"
                checked={formData.ativa}
                onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button
              variant="success"
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 'Salvar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CategoriesDashboard;
