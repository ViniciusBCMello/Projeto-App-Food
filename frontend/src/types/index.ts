// --- Usuário e Autenticação ---
export type Role = 'cliente' | 'atendente' | 'gerente' | 'dono';

export interface User {
  id: number;
  nome: string;
  email: string;
  cargo: Role;
}

export interface AuthResponse {
  token: string;
  usuario: User;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

// --- Produtos e Categorias ---
export interface Category {
  id: number;
  nome: string;
}

export interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  disponivel: boolean;
  categoria_id: number;
  categoria: string;
  imagem_url: string;
}

// --- Endereços ---
export interface Address {
  id?: number;
  apelido?: string;
  cep?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
  principal?: boolean;
}

// --- Pedidos (Orders) ---
export type OrderStatus =
  | 'aguardando'
  | 'preparando'
  | 'saiu_para_entrega'
  | 'entregue'
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
  itens: OrderItem[];
  endereco: Address;
  cliente: {
    id: number;
    nome: string;
    telefone: string | null;
  };
  observacoes: string;
  motivo_nao_entrega: string | null;
  entregue: string | null;
  criado_em: string;
}
