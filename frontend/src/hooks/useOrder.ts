import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface OrderItem {
  produto_id: number;
  quantidade: number;
}

interface CreateOrderPayload {
  endereco_id: number;
  forma_pagamento: 'pix' | 'dinheiro' | 'cartao';
  observacoes?: string;
  itens: OrderItem[];
}

export const useOrder = () => {
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderPayload) => {
      const { data } = await api.post('/pedidos/', orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const useGetOrders = (status?: string) => {
    return useQuery({
      queryKey: ['orders', status],
      queryFn: async () => {
        const { data } = await api.get('/pedidos/', {
          params: { status },
        });
        console.log("pedidos", data);
        return data;
      },
    });
  };

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const { data } = await api.patch(`/pedidos/${orderId}/cancelar`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    createOrder: createOrderMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    useGetOrders,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isCancelling: cancelOrderMutation.isPending,
  };
};
