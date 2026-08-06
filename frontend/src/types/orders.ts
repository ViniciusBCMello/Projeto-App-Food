export type OrderStatus =
  | 'aguardando'
  | 'em_preparo'
  | 'pronto'
  | 'saiu_entrega'
  | 'cheguei'
  | 'cancelado';

export interface OrderItem {
  id: number;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Order {
  id: number;
  numero: string;
  status: OrderStatus;
  total: number;
  forma_pagamento: string;
  observacoes?: string;
  entregue: boolean | null;
  motivo_nao_entrega?: string | null;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    referencia?: string;
  };
  cliente: {
    id: number;
    nome: string;
    telefone: string;
  };
  itens: OrderItem[];
  criado_em: string;
}
