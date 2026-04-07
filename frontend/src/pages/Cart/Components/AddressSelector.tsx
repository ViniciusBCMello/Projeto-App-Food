import { useState, useEffect } from 'react';
import { Form, Button, Modal, Spinner, Card, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import { useAddresses, type Address } from '../../../hooks/useAddresses';
import { RiMapPin2Line, RiEditLine, RiDeleteBin7Line, RiCheckLine, RiAddLine } from 'react-icons/ri';

interface AddressSelectorProps {
  selectedAddressId: number | null;
  onChange: (id: number) => void;
}

export default function AddressSelector({ selectedAddressId, onChange }: AddressSelectorProps) {
  const {
    addresses, isLoading, createAddress, isCreating,
    deleteAddress, setPrincipal, updateAddress
  } = useAddresses();

  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [formData, setFormData] = useState({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    referencia: '',
    principal: false,
  });

  const selectedAddress = addresses?.find(a => a.id === selectedAddressId);

  useEffect(() => {
    if (!selectedAddressId && addresses && addresses.length > 0) {
      const principal = addresses.find((a) => a.principal);
      onChange(principal ? principal.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        ...address,
        complemento: address.complemento || '',
        referencia: address.referencia || '',
      });
    } else {
      setEditingAddress(null);
      setFormData({
        apelido: '', cep: '', logradouro: '', numero: '',
        complemento: '', bairro: '', cidade: '', estado: '', referencia: '', principal: false,
      });
    }
    setView('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress({ id: editingAddress.id, data: formData });
      } else {
        await createAddress(formData);
      }
      setView('list');
    } catch (error) {
      alert('Erro ao salvar endereço.');
    }
  };

  if (isLoading) return <Spinner animation="border" size="sm" />;

  return (
    <>
      {/* CARD DE EXIBIÇÃO NA PÁGINA */}
      <Card className="border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Form.Label className="small fw-bold text-muted m-0">Endereço de Entrega</Form.Label>
          <Button variant="link" size="sm" className="p-0 text-decoration-none fw-bold" onClick={() => { setView('list'); setShowModal(true); }}>
            Alterar
          </Button>
        </div>

        {selectedAddress ? (
          <div className="d-flex align-items-center">
            <div className="bg-light p-2 rounded me-3 text-primary">
              <RiMapPin2Line size={24} />
            </div>
            <div>
              <div className="fw-bold text-dark">{selectedAddress.apelido}</div>
              <div className="small text-muted lh-sm">
                {selectedAddress.logradouro}, {selectedAddress.numero}
                {selectedAddress.complemento && ` (${selectedAddress.complemento})`}
                <br />
                {selectedAddress.bairro} - {selectedAddress.cidade}/{selectedAddress.estado}
              </div>
            </div>
          </div>
        ) : (
          <Button variant="outline-primary" className="w-100 py-2 border-dashed" onClick={() => { setShowModal(true); setView('form'); }}>
            <RiAddLine /> Cadastrar Endereço de Entrega
          </Button>
        )}
      </Card>

      {/* MODAL GERENCIADOR */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {view === 'list' ? 'Meus Endereços' : (editingAddress ? 'Editar Endereço' : 'Novo Endereço')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {view === 'list' ? (
            <>
              <ListGroup variant="flush">
                {addresses?.map((addr) => (
                  <ListGroup.Item
                    key={addr.id}
                    className={`px-0 py-3 border-bottom ${selectedAddressId === addr.id ? 'bg-light rounded px-2' : ''}`}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1 cursor-pointer" onClick={() => { onChange(addr.id); setShowModal(false); }}>
                        <div className="fw-bold d-flex align-items-center">
                          {addr.apelido}
                          {addr.principal && <Badge bg="success" className="ms-2 fw-normal" style={{ fontSize: '0.65rem' }}>PRINCIPAL</Badge>}
                          {selectedAddressId === addr.id && <Badge bg="primary" className="ms-2 fw-normal" style={{ fontSize: '0.65rem' }}>SELECIONADO</Badge>}
                        </div>
                        <div className="small text-muted">
                          {addr.logradouro}, {addr.numero} - {addr.bairro}
                        </div>
                      </div>

                      <div className="d-flex gap-1">
                        {!addr.principal && (
                          <Button variant="light" size="sm" className="text-success" onClick={() => setPrincipal(addr.id)} title="Tornar principal">
                            <RiCheckLine size={18} />
                          </Button>
                        )}
                        <Button variant="light" size="sm" className="text-primary" onClick={() => handleOpenForm(addr)}>
                          <RiEditLine size={18} />
                        </Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => deleteAddress(addr.id)}>
                          <RiDeleteBin7Line size={18} />
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Button variant="primary" className="w-100 mt-4 py-2 fw-bold" onClick={() => handleOpenForm()}>
                <RiAddLine /> Adicionar Novo Endereço
              </Button>
            </>
          ) : (
            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Label className="small fw-bold">Apelido (Ex: Casa, Trabalho)</Form.Label>
                  <Form.Control required name="apelido" value={formData.apelido} onChange={handleInputChange} placeholder="Dê um nome para este endereço" />
                </Col>

                <Col md={4}>
                  <Form.Label className="small fw-bold">CEP</Form.Label>
                  <Form.Control required name="cep" value={formData.cep} onChange={handleInputChange} placeholder="00000-000" />
                </Col>

                <Col md={8}>
                  <Form.Label className="small fw-bold">Logradouro</Form.Label>
                  <Form.Control required name="logradouro" value={formData.logradouro} onChange={handleInputChange} placeholder="Rua, Avenida..." />
                </Col>

                <Col md={3}>
                  <Form.Label className="small fw-bold">Número</Form.Label>
                  <Form.Control required name="numero" value={formData.numero} onChange={handleInputChange} placeholder="123" />
                </Col>

                <Col md={9}>
                  <Form.Label className="small fw-bold">Complemento</Form.Label>
                  <Form.Control name="complemento" value={formData.complemento} onChange={handleInputChange} placeholder="Apto, Bloco, Casa..." />
                </Col>

                <Col md={5}>
                  <Form.Label className="small fw-bold">Bairro</Form.Label>
                  <Form.Control required name="bairro" value={formData.bairro} onChange={handleInputChange} />
                </Col>

                <Col md={5}>
                  <Form.Label className="small fw-bold">Cidade</Form.Label>
                  <Form.Control required name="cidade" value={formData.cidade} onChange={handleInputChange} />
                </Col>

                <Col md={2}>
                  <Form.Label className="small fw-bold">UF</Form.Label>
                  <Form.Control required name="estado" value={formData.estado} onChange={handleInputChange} maxLength={2} placeholder="RJ" />
                </Col>

                <Col md={12}>
                  <Form.Label className="small fw-bold">Referência</Form.Label>
                  <Form.Control name="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Perto de onde?" />
                </Col>
              </Row>

              <div className="d-flex gap-2 mt-4 pt-3 border-top">
                <Button variant="light" className="w-100 fw-bold" onClick={() => setView('list')}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" className="w-100 fw-bold" disabled={isCreating}>
                  {isCreating ? <Spinner size="sm" animation="border" /> : 'Salvar Endereço'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}