import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AxiosError } from 'axios';
import type { Product, Category } from '../types';

export const useProducts = (categoria_id?: number) => {
  return useQuery<Product[], AxiosError>({
    queryKey: ['products', categoria_id],
    queryFn: async () => {
      const { data } = await api.get('/produtos/', {
        params: { categoria_id },
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
    staleTime: 1000 * 60 * 60,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, AxiosError, FormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post('/produtos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, AxiosError, { id: number; formData: FormData }>({
    mutationFn: async ({ id, formData }) => {
      const { data } = await api.put(`/produtos/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, number>({
    mutationFn: async (id) => {
      await api.delete(`/produtos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
