import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useCartStore } from './useCartStore';
import type { AxiosError } from 'axios';
import type { Order, OrderStatus } from '../types';

export interface CreateOrderDTO {
  endereco_id: number;
  forma_pagamento: string;
  itens: { produto_id: number; quantidade: number }[];
  observacoes?: string;
}

export interface UpdateDeliveryDTO {
  entregue: boolean;
  motivo?: string;
}

export const useOrders = (status?: OrderStatus) => {
  return useQuery<Order[], AxiosError>({
    queryKey: ['orders', status],
    queryFn: async () => {
      const { data } = await api.get('/pedidos/', { params: { status } });
      return data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
};

export const useOrder = (id: number) => {
  return useQuery<Order, AxiosError>({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await api.get(`/pedidos/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation<Order, AxiosError, CreateOrderDTO>({
    mutationFn: async (orderData) => {
      const { data } = await api.post('/pedidos/', orderData);
      return data;
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, AxiosError, { id: number; status: OrderStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/pedidos/${id}/status`, { status });
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', updatedOrder.id] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<{ mensagem: string; numero: string }, AxiosError, number>({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/pedidos/${id}/cancelar`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useFinalizeDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    AxiosError,
    { id: number; payload: UpdateDeliveryDTO }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/pedidos/${id}/entrega`, payload);
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', updatedOrder.id] });
    },
  });
};
