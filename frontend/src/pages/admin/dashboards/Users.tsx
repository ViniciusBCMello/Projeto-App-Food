import React, { useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Dropdown, Modal, Alert } from 'react-bootstrap';

import {
  FaUsers,
  FaUserXmark,
  FaUserCheck,
  FaEllipsisVertical
} from 'react-icons/fa6';

import { useGetUsers, useToggleUserStatus } from '../../../hooks/useLogin';
import { DataTable, type Column } from '../components/DataTable';
import type { User } from '../../../types';

export const UsersDashboard: React.FC = () => {
  const { data: users, isLoading, isError, error } = useGetUsers('cliente');
  const toggleMutation = useToggleUserStatus();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const stats = useMemo(() => {
    if (!users) return { total: 0, ativos: 0, inativos: 0 };
    const ativos = users.filter(u => u.ativo).length;
    return {
      total: users.length,
      ativos,
      inativos: users.length - ativos,
    };
  }, [users]);

  const columns = useMemo<Column<User>[]>(() => [
    {
      key: 'nome',
      header: 'Cliente',
      className: 'ps-4',
      render: (row) => (
        <>
          <div className="fw-bold">{row.nome}</div>
          <small className="text-muted">CPF: {row.cpf || 'Não informado'}</small>
        </>
      )
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (row) => <span className="text-muted">{row.email}</span>
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (row) => row.telefone || <span className="text-muted fst-italic">—</span>
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (row) => (
        <Badge pill bg={row.ativo ? 'success' : 'secondary'} className="text-uppercase">
          {row.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'criado_em',
      header: 'Cadastro',
      render: (row) => row.criado_em
        ? new Date(row.criado_em).toLocaleDateString('pt-BR')
        : '—'
    }
  ], []);

  const actionsColumn: Column<User> = {
    key: 'actions',
    header: 'Ações',
    render: () => null,
    actions: (row) => (
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="text-muted p-0 border-0">
          <FaEllipsisVertical />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item
            onClick={() => {
              setSelectedUser(row);
              setShowConfirmModal(true);
            }}
            className={row.ativo ? 'text-danger' : 'text-success'}
          >
            {row.ativo ? (
              <><FaUserXmark className="me-2" /> Desativar Conta</>
            ) : (
              <><FaUserCheck className="me-2" /> Ativar Conta</>
            )}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  };

  const handleToggleStatus = () => {
    if (!selectedUser?.id) return;
    toggleMutation.mutate(selectedUser.id, {
      onSuccess: () => setShowConfirmModal(false)
    });
  };

  if (isError) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          Erro ao carregar clientes: {(error as any)?.response?.data?.erro || 'Erro desconhecido'}
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
            <FaUsers className="text-primary" /> Gestão de Clientes
          </h2>
          <small className="text-muted">Gerencie o acesso e visualize os dados dos clientes cadastrados.</small>
        </Col>
      </Row>

      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary">
                <FaUsers size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Total de Clientes</small>
                <h3 className="fw-bold mb-0">{stats.total}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                <FaUserCheck size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Contas Ativas</small>
                <h3 className="fw-bold text-success mb-0">{stats.ativos}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-secondary bg-opacity-10 p-3 me-3 text-secondary">
                <FaUserXmark size={24} />
              </div>
              <div>
                <small className="text-muted d-block">Contas Inativas</small>
                <h3 className="fw-bold text-secondary mb-0">{stats.inativos}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <DataTable
            columns={[...columns, actionsColumn]}
            data={users || []}
            cardTitle="Lista de Clientes Cadastrados"
            emptyMessage="Nenhum cliente encontrado no sistema."
            isLoading={isLoading}
          />
        </Col>
      </Row>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser?.ativo ? 'Desativar Conta' : 'Ativar Conta'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tem certeza que deseja <strong>{selectedUser?.ativo ? 'desativar' : 'ativar'}</strong> a conta do cliente{' '}
            <strong>{selectedUser?.nome}</strong>?
          </p>
          <p className="text-muted small mb-0">
            {selectedUser?.ativo
              ? 'O cliente não poderá mais fazer login ou realizar novos pedidos.'
              : 'O cliente poderá voltar a acessar o sistema e fazer pedidos normalmente.'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button
            variant={selectedUser?.ativo ? 'danger' : 'success'}
            onClick={handleToggleStatus}
            disabled={toggleMutation.isPending}
          >
            {toggleMutation.isPending ? 'Processando...' : 'Confirmar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UsersDashboard;
