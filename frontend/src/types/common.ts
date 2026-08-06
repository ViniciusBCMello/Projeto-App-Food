export interface ApiError {
  erro?: string;
  mensagem?: string;
}

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
