import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useCartStore } from './useCartStore';
import type { AxiosError } from 'axios';
import type { Order, OrderStatus } from '../types';

interface CreateOrderDTO {
  endereco_id: number;
  forma_pagamento: string;
  itens: { produto_id: number; quantidade: number }[];
  observacoes?: string;
}

export const useOrders = (status?: OrderStatus) => {
  return useQuery<Order[], AxiosError>({
    queryKey: ['orders', status],
    queryFn: async () => {
      const { data } = await api.get('/pedidos/', { params: { status } });
      return data;
    },
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
      // Atualiza também o cache do pedido individual se você tiver um useOrder(id)
      queryClient.invalidateQueries({ queryKey: ['orders', updatedOrder.id] });
    },
  });
};
