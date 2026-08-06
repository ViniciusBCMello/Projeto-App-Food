export type TransactionStatus = 'pendente' | 'pago' | 'cancelado';
export type TransactionType = 'RECEITA' | 'DESPESA';

export interface TransactionItem {
  id: number;
  tipo: TransactionType;
  categoria: string;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: TransactionStatus;
  pedido_id?: number;
  favorecido_nome?: string | null;
  criado_em?: string;
}

export interface FinanceFilters {
  status?: TransactionStatus;
  categoria?: string;
  tipo?: TransactionType;
  de?: string;
  ate?: string;
}

export interface TransactionListResponse {
  total: number;
  quantidade: number;
  categorias: string[];
  itens: TransactionItem[];
}

export interface MovementResponse {
  resumo: {
    receitas: number;
    despesas: number;
    saldo: number;
    situacao: 'positivo' | 'negativo';
  };
  quantidade: number;
  itens: TransactionItem[];
}

export interface SummaryResponse {
  periodo: { de: string; ate: string };
  receitas: { pagas: number; pendente: number; total: number };
  despesas: {
    pagas: number;
    pendente: number;
    total: number;
    por_categoria: Record<string, number>;
  };
  saldo: {
    realizado: number;
    previsto: number;
    situacao: 'positivo' | 'negativo';
  };
}
