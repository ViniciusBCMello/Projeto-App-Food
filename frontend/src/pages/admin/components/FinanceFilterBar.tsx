import React from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { FaFilter, FaRotateLeft } from 'react-icons/fa6';
import type { FinanceFilters, TransactionStatus, TransactionType } from '../types/finance';

interface FinanceFilterBarProps {
  filters: FinanceFilters;
  onFilterChange: (filters: FinanceFilters) => void;
  onReset?: () => void;
  showTypeFilter?: boolean;
  showCategoryFilter?: boolean;
  categories?: string[];
}

export const FinanceFilterBar: React.FC<FinanceFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  showTypeFilter = true,
  showCategoryFilter = true,
  categories = []
}) => {
  const handleChange = (key: keyof FinanceFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  return (
    <Row className="mb-4 align-items-end g-3">
      <Col md={3}>
        <Form.Label className="small text-muted mb-1">De</Form.Label>
        <Form.Control
          type="date"
          value={filters.de || ''}
          onChange={(e) => handleChange('de', e.target.value)}
        />
      </Col>
      <Col md={3}>
        <Form.Label className="small text-muted mb-1">Até</Form.Label>
        <Form.Control
          type="date"
          value={filters.ate || ''}
          onChange={(e) => handleChange('ate', e.target.value)}
        />
      </Col>
      {showTypeFilter && (
        <Col md={2}>
          <Form.Label className="small text-muted mb-1">Tipo</Form.Label>
          <Form.Select
            value={filters.tipo || ''}
            onChange={(e) => handleChange('tipo', e.target.value as TransactionType)}
          >
            <option value="">Todos</option>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </Form.Select>
        </Col>
      )}
      {showCategoryFilter && categories.length > 0 && (
        <Col md={2}>
          <Form.Label className="small text-muted mb-1">Categoria</Form.Label>
          <Form.Select
            value={filters.categoria || ''}
            onChange={(e) => handleChange('categoria', e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Form.Select>
        </Col>
      )}
      <Col md={showCategoryFilter ? 2 : 4}>
        <Form.Label className="small text-muted mb-1">Status</Form.Label>
        <Form.Select
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value as TransactionStatus)}
        >
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </Form.Select>
      </Col>
      {onReset && (
        <Col md="auto" className="d-flex align-items-end pb-2">
          <Button variant="outline-secondary" onClick={onReset} className="d-flex align-items-center gap-2">
            <FaRotateLeft /> Limpar
          </Button>
        </Col>
      )}
    </Row>
  );
};
