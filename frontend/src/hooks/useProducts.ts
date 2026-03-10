import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AxiosError } from 'axios';
import type { Product, Category } from '../types';

export const useProducts = (categoryId?: number) => {
  return useQuery<Product[], AxiosError>({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const { data } = await api.get('/produtos/', {
        params: { categoria_id: categoryId },
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCategories = () => {
  return useQuery<Category[], AxiosError>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/produtos/categorias');
      return data;
    },
    staleTime: 1000 * 60 * 60, // Categorias mudam pouco, 1 hora de cache
  });
};
