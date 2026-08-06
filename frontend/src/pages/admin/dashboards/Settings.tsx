import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Alert, Nav, Tab,
  Badge, Modal, Dropdown
} from 'react-bootstrap';
import {
  FaBuilding, FaPalette, FaCreditCard, FaFloppyDisk, FaTrash, FaPencil,
  FaEllipsisVertical, FaPlus
} from 'react-icons/fa6';

import {
  useCompanyData, useUpdateCompanyData,
  useDeliverySettings, useUpdateDeliverySettings,
  useUpdateWhiteLabel,
  usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod
} from '../../../hooks/useCompany';
import { DataTable, type Column } from '../components/DataTable';
import type { PaymentMethod } from '../../../types';

export const SettingsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('empresa');

  const { data: companyData, isLoading: loadingCompany } = useCompanyData();
  const updateCompanyMutation = useUpdateCompanyData();
  const [companyForm, setCompanyForm] = useState({
    razao_social: '', nome_fantasia: '', cnpj: '', email: '', telefone: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: ''
  });

  const { data: deliveryData, isLoading: loadingDelivery } = useDeliverySettings();
  const updateDeliveryMutation = useUpdateDeliverySettings();
  const [deliveryForm, setDeliveryForm] = useState({ taxa_por_km: '', distancia_gratuita: '' });

  const updateWhiteLabelMutation = useUpdateWhiteLabel();
  const [wlForm, setWlForm] = useState({
    wl_nome_sistema: '', wl_cor_primaria: '#0d6efd', wl_cor_secundaria: '#6c757d',
    wl_logo_url: '', wl_dominio: '', wl_suporte_email: '', wl_suporte_fone: '', wl_rodape_texto: ''
  });

  const { data: paymentMethods, isLoading: loadingPayments } = usePaymentMethods();
  const createPaymentMutation = useCreatePaymentMethod();
  const updatePaymentMutation = useUpdatePaymentMethod();
  const deletePaymentMutation = useDeletePaymentMethod();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [paymentForm, setPaymentForm] = useState({ nome: '', taxa_operadora_percentual: 0, dias_para_recebimento: 0, ativo: true });

  useEffect(() => {
    if (companyData) {
      setCompanyForm({
        razao_social: companyData.razao_social || '',
        nome_fantasia: companyData.nome_fantasia || '',
        cnpj: companyData.cnpj || '',
        email: companyData.email || '',
        telefone: companyData.telefone || '',
        cep: companyData.cep || '',
        logradouro: companyData.logradouro || '',
        numero: companyData.numero || '',
        bairro: companyData.bairro || '',
        cidade: companyData.cidade || '',
        estado: companyData.estado || '',
      });
      setWlForm({
        wl_nome_sistema: companyData.wl_nome_sistema || '',
        wl_cor_primaria: companyData.wl_cor_primaria || '#0d6efd',
        wl_cor_secundaria: companyData.wl_cor_secundaria || '#6c757d',
        wl_logo_url: companyData.wl_logo_url || '',
        wl_dominio: companyData.wl_dominio || '',
        wl_suporte_email: companyData.wl_suporte_email || '',
        wl_suporte_fone: companyData.wl_suporte_fone || '',
        wl_rodape_texto: companyData.wl_rodape_texto || '',
      });
    }
  }, [companyData]);

  useEffect(() => {
    if (deliveryData) {
      setDeliveryForm({
        taxa_por_km: String(deliveryData.taxa_por_km || 0),
        distancia_gratuita: String(deliveryData.distancia_gratuita || 0)
      });
    }
  }, [deliveryData]);

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate(companyForm);
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeliveryMutation.mutate({
      taxa_por_km: Number(deliveryForm.taxa_por_km),
      distancia_gratuita: Number(deliveryForm.distancia_gratuita)
    });
  };

  const handleWhiteLabelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWhiteLabelMutation.mutate(wlForm);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data: paymentForm }, { onSuccess: () => closeModal() });
    } else {
      createPaymentMutation.mutate(paymentForm, { onSuccess: () => closeModal() });
    }
  };

  const openModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingPayment(method);
      setPaymentForm({ nome: method.nome, taxa_operadora_percentual: method.taxa_operadora_percentual, dias_para_recebimento: method.dias_para_recebimento, ativo: method.ativo });
    } else {
      setEditingPayment(null);
      setPaymentForm({ nome: '', taxa_operadora_percentual: 0, dias_para_recebimento: 0, ativo: true });
    }
    setShowPaymentModal(true);
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const paymentColumns: Column<PaymentMethod>[] = [
    { key: 'nome', header: 'Nome', className: 'ps-4', render: (row) => <span className="fw-semibold">{row.nome}</span> },
    {
      key: 'taxa_operadora_percentual',
      header: 'Taxa (%)',
      render: (row) => `${row.taxa_operadora_percentual}%`
    },
    {
      key: 'dias_para_recebimento',
      header: 'Recebimento',
      render: (row) => `${row.dias_para_recebimento} dia(s)`
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (row) => <Badge pill bg={row.ativo ? 'success' : 'secondary'}>{row.ativo ? 'Ativo' : 'Inativo'}</Badge>
    }
  ];

  const paymentActions: Column<PaymentMethod> = {
    key: 'actions', header: 'Ações', render: () => null,
    actions: (row) => (
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="text-muted p-0 border-0"><FaEllipsisVertical /></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => openModal(row)}><FaPencil className="me-2" /> Editar</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item className="text-danger" onClick={() => { if (window.confirm('Excluir esta forma de pagamento?')) deletePaymentMutation.mutate(row.id); }}>
            <FaTrash className="me-2" /> Excluir
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  };

  if (loadingCompany) return <Container fluid className="py-5 text-center"><div className="spinner-border text-primary" /></Container>;

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold d-flex align-items-center gap-2"><FaBuilding className="text-primary" /> Configurações do Sistema</h2>
          <small className="text-muted">Gerencie os dados da empresa, identidade visual e formas de pagamento.</small>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'empresa')}>
        <Nav variant="pills" className="mb-4 gap-2">
          <Nav.Item><Nav.Link eventKey="empresa"><FaBuilding className="me-2" />Dados da Empresa & Entrega</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="whitelabel"><FaPalette className="me-2" />Identidade Visual</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="pagamentos"><FaCreditCard className="me-2" />Formas de Pagamento</Nav.Link></Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="empresa">
            <Row className="g-4">
              <Col lg={8}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3"><h5 className="mb-0 fw-bold">Dados Cadastrais</h5></Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleCompanySubmit}>
                      <Row className="g-3">
                        <Col md={6}><Form.Label>Razão Social</Form.Label><Form.Control value={companyForm.razao_social} onChange={e => setCompanyForm({ ...companyForm, razao_social: e.target.value })} /></Col>
                        <Col md={6}><Form.Label>Nome Fantasia</Form.Label><Form.Control value={companyForm.nome_fantasia} onChange={e => setCompanyForm({ ...companyForm, nome_fantasia: e.target.value })} /></Col>
                        <Col md={4}><Form.Label>CNPJ</Form.Label><Form.Control value={companyForm.cnpj} onChange={e => setCompanyForm({ ...companyForm, cnpj: e.target.value })} /></Col>
                        <Col md={4}><Form.Label>E-mail</Form.Label><Form.Control type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></Col>
                        <Col md={4}><Form.Label>Telefone</Form.Label><Form.Control value={companyForm.telefone} onChange={e => setCompanyForm({ ...companyForm, telefone: e.target.value })} /></Col>
                        <Col md={3}><Form.Label>CEP</Form.Label><Form.Control value={companyForm.cep} onChange={e => setCompanyForm({ ...companyForm, cep: e.target.value })} /></Col>
                        <Col md={5}><Form.Label>Logradouro</Form.Label><Form.Control value={companyForm.logradouro} onChange={e => setCompanyForm({ ...companyForm, logradouro: e.target.value })} /></Col>
                        <Col md={2}><Form.Label>Número</Form.Label><Form.Control value={companyForm.numero} onChange={e => setCompanyForm({ ...companyForm, numero: e.target.value })} /></Col>
                        <Col md={2}><Form.Label>Estado</Form.Label><Form.Control value={companyForm.estado} onChange={e => setCompanyForm({ ...companyForm, estado: e.target.value })} /></Col>
                        <Col md={6}><Form.Label>Cidade</Form.Label><Form.Control value={companyForm.cidade} onChange={e => setCompanyForm({ ...companyForm, cidade: e.target.value })} /></Col>
                        <Col md={6}><Form.Label>Bairro</Form.Label><Form.Control value={companyForm.bairro} onChange={e => setCompanyForm({ ...companyForm, bairro: e.target.value })} /></Col>
                      </Row>
                      <div className="mt-4 text-end">
                        <Button variant="primary" type="submit" disabled={updateCompanyMutation.isPending}>
                          {updateCompanyMutation.isPending ? 'Salvando...' : <><FaFloppyDisk className="me-2" />Salvar Dados</>}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3"><h5 className="mb-0 fw-bold">Configurações de Entrega</h5></Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleDeliverySubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Taxa por Km (R$)</Form.Label>
                        <Form.Control type="number" step="0.01" value={deliveryForm.taxa_por_km} onChange={e => setDeliveryForm({ ...deliveryForm, taxa_por_km: e.target.value })} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Distância Gratuita (Km)</Form.Label>
                        <Form.Control type="number" step="0.1" value={deliveryForm.distancia_gratuita} onChange={e => setDeliveryForm({ ...deliveryForm, distancia_gratuita: e.target.value })} />
                        <Form.Text className="text-muted">Entregas abaixo deste valor não cobram taxa.</Form.Text>
                      </Form.Group>
                      <Button variant="success" type="submit" className="w-100" disabled={updateDeliveryMutation.isPending}>
                        {updateDeliveryMutation.isPending ? 'Salvando...' : <><FaFloppyDisk className="me-2" />Atualizar Taxas</>}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="whitelabel">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3"><h5 className="mb-0 fw-bold">Identidade Visual (White-Label)</h5></Card.Header>
              <Card.Body>
                <Form onSubmit={handleWhiteLabelSubmit}>
                  <Row className="g-3">
                    <Col md={6}><Form.Label>Nome do Sistema</Form.Label><Form.Control value={wlForm.wl_nome_sistema} onChange={e => setWlForm({ ...wlForm, wl_nome_sistema: e.target.value })} placeholder="Ex: MeuDelivery" /></Col>
                    <Col md={6}><Form.Label>Domínio Personalizado</Form.Label><Form.Control value={wlForm.wl_dominio} onChange={e => setWlForm({ ...wlForm, wl_dominio: e.target.value })} placeholder="Ex: app.meudelivery.com" /></Col>
                    <Col md={3}>
                      <Form.Label>Cor Primária</Form.Label>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control type="color" value={wlForm.wl_cor_primaria} onChange={e => setWlForm({ ...wlForm, wl_cor_primaria: e.target.value })} style={{ height: '38px', width: '60px' }} />
                        <Form.Control value={wlForm.wl_cor_primaria} onChange={e => setWlForm({ ...wlForm, wl_cor_primaria: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={3}>
                      <Form.Label>Cor Secundária</Form.Label>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control type="color" value={wlForm.wl_cor_secundaria} onChange={e => setWlForm({ ...wlForm, wl_cor_secundaria: e.target.value })} style={{ height: '38px', width: '60px' }} />
                        <Form.Control value={wlForm.wl_cor_secundaria} onChange={e => setWlForm({ ...wlForm, wl_cor_secundaria: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={6}><Form.Label>URL do Logo</Form.Label><Form.Control value={wlForm.wl_logo_url} onChange={e => setWlForm({ ...wlForm, wl_logo_url: e.target.value })} placeholder="https://..." /></Col>
                    <Col md={6}><Form.Label>E-mail de Suporte</Form.Label><Form.Control type="email" value={wlForm.wl_suporte_email} onChange={e => setWlForm({ ...wlForm, wl_suporte_email: e.target.value })} /></Col>
                    <Col md={6}><Form.Label>Telefone de Suporte</Form.Label><Form.Control value={wlForm.wl_suporte_fone} onChange={e => setWlForm({ ...wlForm, wl_suporte_fone: e.target.value })} /></Col>
                    <Col md={12}><Form.Label>Texto do Rodapé</Form.Label><Form.Control value={wlForm.wl_rodape_texto} onChange={e => setWlForm({ ...wlForm, wl_rodape_texto: e.target.value })} placeholder="Ex: © 2026 Minha Empresa" /></Col>
                  </Row>
                  <div className="mt-4 text-end">
                    <Button variant="primary" type="submit" disabled={updateWhiteLabelMutation.isPending}>
                      {updateWhiteLabelMutation.isPending ? 'Salvando...' : <><FaFloppyDisk className="me-2" />Salvar Identidade Visual</>}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="pagamentos">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Formas de Pagamento</h5>
                <Button variant="primary" size="sm" onClick={() => openModal()}><FaPlus className="me-2" />Nova Forma</Button>
              </Card.Header>
              <Card.Body className="p-0">
                <DataTable
                  columns={[...paymentColumns, paymentActions]}
                  data={paymentMethods || []}
                  isLoading={loadingPayments}
                  emptyMessage="Nenhuma forma de pagamento cadastrada."
                />
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <Modal show={showPaymentModal} onHide={closeModal} centered>
        <Modal.Header closeButton><Modal.Title>{editingPayment ? 'Editar' : 'Nova'} Forma de Pagamento</Modal.Title></Modal.Header>
        <Form onSubmit={handlePaymentSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control required value={paymentForm.nome} onChange={e => setPaymentForm({ ...paymentForm, nome: e.target.value })} placeholder="Ex: Pix, Cartão de Crédito" />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Taxa da Operadora (%)</Form.Label>
                  <Form.Control type="number" step="0.01" required value={paymentForm.taxa_operadora_percentual} onChange={e => setPaymentForm({ ...paymentForm, taxa_operadora_percentual: Number(e.target.value) })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Dias para Recebimento</Form.Label>
                  <Form.Control type="number" required value={paymentForm.dias_para_recebimento} onChange={e => setPaymentForm({ ...paymentForm, dias_para_recebimento: Number(e.target.value) })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check type="switch" label="Forma de pagamento ativa" checked={paymentForm.ativo} onChange={e => setPaymentForm({ ...paymentForm, ativo: e.target.checked })} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="success" type="submit" disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}>
              {(createPaymentMutation.isPending || updatePaymentMutation.isPending) ? 'Salvando...' : 'Salvar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SettingsDashboard;
