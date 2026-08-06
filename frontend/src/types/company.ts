export interface CompanyData {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  wl_nome_sistema?: string;
  wl_cor_primaria?: string;
  wl_cor_secundaria?: string;
  wl_logo_url?: string;
  wl_dominio?: string;
  wl_suporte_email?: string;
  wl_suporte_fone?: string;
  wl_rodape_texto?: string;
}

export interface DeliverySettings {
  taxa_por_km: number;
  distancia_gratuita: number;
  distancia_km?: number;
  valor_entrega?: number;
}

export interface WhiteLabelSettings {
  wl_nome_sistema?: string;
  wl_cor_primaria?: string;
  wl_cor_secundaria?: string;
  wl_logo_url?: string;
  wl_dominio?: string;
  wl_suporte_email?: string;
  wl_suporte_fone?: string;
  wl_rodape_texto?: string;
}

export interface PaymentMethod {
  id: number;
  nome: string;
  taxa_operadora_percentual: number;
  dias_para_recebimento: number;
  ativo: boolean;
}
