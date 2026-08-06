import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { FaScrewdriverWrench } from 'react-icons/fa6';

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  feature,
  description = "Esta funcionalidade está em desenvolvimento e estará disponível em breve."
}) => {
  return (
    <Container fluid className="py-5 min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <Card className="border-0 shadow-sm text-center p-5" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <div className="mb-4">
            <FaScrewdriverWrench size={64} className="text-warning opacity-50" />
          </div>
          <h2 className="fw-bold text-muted mb-3">{feature}</h2>
          <p className="text-muted fs-5 mb-4">{description}</p>
          <div className="d-flex justify-content-center gap-2">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
              🚧 Em Desenvolvimento
            </span>
            <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill">
              Em breve
            </span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ComingSoon;
