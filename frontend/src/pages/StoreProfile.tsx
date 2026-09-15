import React from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import {
  FaStore, FaPhone, FaEnvelope, FaLocationDot,
  FaMotorcycle, FaIdCard, FaMapPin
} from 'react-icons/fa6';
import { useCompanyData } from '../hooks/useCompany';

// Imagem de fallback caso a loja não tenha logo
import PlaceholderLogo from '../assets/hamburg.png'; // Ajuste o caminho se necessário

function StoreProfile() {
  const { data: company, isLoading, isError, error } = useCompanyData();

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted fw-semibold">Carregando informações da loja...</p>
        </div>
      </Container>
    );
  }

  if (isError || !company) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <strong>Ops!</strong> Não foi possível carregar os dados da loja. Tente novamente mais tarde.
        </Alert>
      </Container>
    );
  }

  // Define a cor primária baseada no white-label ou usa o azul padrão do Bootstrap
  const primaryColor = company.wl_cor_primaria || '#0d6efd';

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Hero Section / Cabeçalho da Loja */}
      <div
        className="text-center py-5 mb-4 shadow-sm"
        style={{
          backgroundColor: primaryColor,
          color: 'white',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px'
        }}
      >
        <Container>
          <img
            src={company.wl_logo_url || PlaceholderLogo}
            alt="Logo da Loja"
            className="rounded-circle border border-4 border-white mb-3 shadow"
            style={{ width: '120px', height: '120px', objectFit: 'cover', backgroundColor: 'white' }}
            onError={(e) => { (e.target as HTMLImageElement).src = PlaceholderLogo; }}
          />
          <h1 className="fw-bold mb-1">{company.nome_fantasia || 'Nome da Loja'}</h1>
          <p className="mb-0 opacity-75 fs-5">{company.razao_social}</p>
          {company.ativo ? (
            <Badge bg="light" text="success" className="mt-2 px-3 py-2 rounded-pill fw-semibold">
              ● Aberto Agora
            </Badge>
          ) : (
            <Badge bg="light" text="secondary" className="mt-2 px-3 py-2 rounded-pill fw-semibold">
              ● Fechado
            </Badge>
          )}
        </Container>
      </div>

      {/* Conteúdo Principal */}
      <Container>
        <Row className="g-4">

          {/* Coluna da Esquerda: Endereço e Entrega */}
          <Col md={7}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaLocationDot className="text-primary" /> Localização e Entrega
                </h5>
                <small className="text-muted">Onde estamos e como entregamos para você</small>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-start mb-4">
                  <FaMapPin size={20} className="text-primary mt-1 me-3 flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold mb-1">Endereço</h6>
                    <p className="text-muted mb-0">
                      {company.logradouro}, {company.numero}
                      {company.complemento && ` - ${company.complemento}`}
                      <br />
                      {company.bairro} - {company.cidade}/{company.estado}
                      <br />
                      <span className="small">CEP: {company.cep}</span>
                    </p>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="d-flex align-items-start">
                  <FaMotorcycle size={20} className="text-primary mt-1 me-3 flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold mb-1">Regras de Entrega</h6>
                    <ul className="list-unstyled text-muted mb-0">
                      <li className="mb-2">
                        <span className="fw-semibold text-dark">Distância Gratuita:</span> Até {company.distancia_gratuita || 0} km do estabelecimento.
                      </li>
                      <li>
                        <span className="fw-semibold text-dark">Taxa Adicional:</span> R$ {company.taxa_por_km?.toFixed(2) || '0.00'} por km excedente.
                      </li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Coluna da Direita: Contato e Dados Legais */}
          <Col md={5}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaStore className="text-primary" /> Informações de Contato
                </h5>
                <small className="text-muted">Fale conosco ou verifique nossos dados</small>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3 text-primary">
                    <FaPhone size={18} />
                  </div>
                  <div>
                    <small className="text-muted d-block">Telefone / WhatsApp</small>
                    <span className="fw-semibold">{company.telefone || 'Não informado'}</span>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3 text-primary">
                    <FaEnvelope size={18} />
                  </div>
                  <div>
                    <small className="text-muted d-block">E-mail</small>
                    <span className="fw-semibold text-break">{company.email || 'Não informado'}</span>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="d-flex align-items-center">
                  <div className="bg-secondary bg-opacity-10 p-2 rounded-circle me-3 text-secondary">
                    <FaIdCard size={18} />
                  </div>
                  <div>
                    <small className="text-muted d-block">CNPJ</small>
                    <span className="fw-semibold">{company.cnpj || 'Não informado'}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* Rodapé da Página (White-label) */}
        {company.wl_rodape_texto && (
          <div className="text-center mt-5 pt-4 border-top">
            <small className="text-muted">{company.wl_rodape_texto}</small>
          </div>
        )}
      </Container>
    </div>
  );
}

export default StoreProfile;
