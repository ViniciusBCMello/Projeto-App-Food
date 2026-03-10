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

export interface Address {
  id: number;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
  principal: boolean;
}

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
  itens: OrderItem[];
  endereco: Partial<Address>;
  cliente: { id: number; nome: string; telefone: string };
  criado_em: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}
