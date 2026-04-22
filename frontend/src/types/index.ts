// --- 1. Auth & Users ---

export type UserRole =
  | 'dono'
  | 'administracao'
  | 'gerente'
  | 'atendente'
  | 'motoboy'
  | 'cliente';

export interface User {
  id: number;
  nome: string;
  email: string;
  cargo: UserRole; // Mantido o nome da chave da API, mas tipo em inglês
  telefone?: string;
  cpf?: string;
  ativo?: boolean;
  criado_em?: string;
  motoboy?: {
    cnh: string;
    placa_veiculo: string;
    modelo_veiculo: string;
  };
}

export interface LoginCredentials {
  email: string;
  senha: string; // Senha é o campo esperado pelo seu backend
}

export interface AuthResponse {
  token: string;
  usuario: User;
}

export interface ApiError {
  erro?: string;
  mensagem?: string;
}

// --- 2. Products & Categories ---

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

// --- 3. Addresses ---

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

// --- 4. Orders ---

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
  de?: string; // from
  ate?: string; // to
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
