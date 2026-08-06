import React from 'react';
import { Card, Table } from 'react-bootstrap';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  actions?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  cardTitle?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  cardTitle,
  emptyMessage = "Nenhum registro encontrado.",
  isLoading = false,
  onRowClick
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        {cardTitle && (
          <Card.Header className="bg-white py-3 border-0">
            <h5 className="mb-0 fw-bold">{cardTitle}</h5>
          </Card.Header>
        )}
        <Card.Body className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      {cardTitle && (
        <Card.Header className="bg-white py-3 border-0">
          <h5 className="mb-0 fw-bold">{cardTitle}</h5>
        </Card.Header>
      )}
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className || ''}>
                  {col.header}
                </th>
              ))}
              {columns.some(c => c.actions) && <th className="text-center">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={col.className || ''}>
                      {col.render ? col.render(row) : row[col.key as keyof T]}
                    </td>
                  ))}
                  {columns.some(c => c.actions) && (
                    <td className="text-center">
                      {columns.find(c => c.actions)?.actions?.(row)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4 text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
