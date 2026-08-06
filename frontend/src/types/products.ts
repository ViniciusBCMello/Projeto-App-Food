export interface Category {
  id: number;
  nome: string;
  ativa: boolean;
}

export interface Product {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  disponivel: boolean;
  categoria_id?: number;
  categoria?: string;
  imagem_url?: string;
}
