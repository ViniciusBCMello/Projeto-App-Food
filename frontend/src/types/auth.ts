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
  cargo: UserRole;
  telefone?: string;
  cpf?: string;
  ativo: boolean;
  criado_em: string;
  motoboy?: {
    cnh: string;
    placa_veiculo: string;
    modelo_veiculo: string;
  };
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  usuario: User;
}
