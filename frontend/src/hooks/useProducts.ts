import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AxiosError } from 'axios';
import type { Product, Category } from '../types';

interface ProductsQueryResponse {
  data: Product[];
  status: number;
}

interface CategoriesQueryResponse {
  data: Category[];
  status: number;
}

export const useProducts = (categoryId?: number) => {
  return useQuery<ProductsQueryResponse, AxiosError>({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const response = await api.get('/produtos/', {
        params: { categoria_id: categoryId },
      });
      console.log('products data', response.data);
      return {
        data: response.data,
        status: response.status,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCategories = () => {
  return useQuery<CategoriesQueryResponse, AxiosError>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/produtos/categorias');
      console.log('categories data', response.data);
      return {
        data: response.data,
        status: response.status,
      };
    },
    staleTime: 1000 * 60 * 60,
  });
};
