import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AxiosError } from 'axios';
import type {
  TransactionListResponse,
  MovementResponse,
  SummaryResponse,
  FinanceFilters,
  TransactionItem
} from '../types/finance';

// ==========================================
// QUERIES
// ==========================================

export const useRevenue = (filters?: FinanceFilters) => {
  return useQuery<TransactionListResponse, AxiosError>({
    queryKey: ['revenue', filters],
    queryFn: async () => {
      const { data } = await api.get('/financeiro/receitas', { params: filters });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useExpenses = (filters?: FinanceFilters) => {
  return useQuery<TransactionListResponse, AxiosError>({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const { data } = await api.get('/financeiro/despesas', { params: filters });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useMovements = (filters?: FinanceFilters) => {
  return useQuery<MovementResponse, AxiosError>({
    queryKey: ['movements', filters],
    queryFn: async () => {
      const { data } = await api.get('/financeiro/movimentos', { params: filters });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useFinancialSummary = (filters?: Pick<FinanceFilters, 'de' | 'ate'>) => {
  return useQuery<SummaryResponse, AxiosError>({
    queryKey: ['financialSummary', filters],
    queryFn: async () => {
      const { data } = await api.get('/financeiro/resumo', { params: filters });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

export const useCreateRevenue = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionItem, AxiosError, Partial<TransactionItem>>({
    mutationFn: async (newRevenue) => {
      const { data } = await api.post('/financeiro/receitas', newRevenue);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionItem, AxiosError, Partial<TransactionItem>>({
    mutationFn: async (newExpense) => {
      const { data } = await api.post('/financeiro/despesas', newExpense);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
    },
  });
};

export const usePayMovement = () => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError, { id: number; data_pagamento?: string; banco_id?: number }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch(`/financeiro/movimentos/${id}/pagar`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
    },
  });
};

export const useCancelMovement = () => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError, number>({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/financeiro/movimentos/${id}/cancelar`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
    },
  });
};
