import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AxiosError } from 'axios';
import type {
  CompanyData,
  DeliverySettings,
  WhiteLabelSettings,
  PaymentMethod,
} from '../types';

export const useCompanyData = () => {
  return useQuery<CompanyData, AxiosError>({
    queryKey: ['company'],
    queryFn: async () => {
      const { data } = await api.get('/empresa/');
      return data;
    },
  });
};

export const useDeliverySettings = () => {
  return useQuery<DeliverySettings, AxiosError>({
    queryKey: ['company', 'delivery'],
    queryFn: async () => {
      const { data } = await api.get('/empresa/taxa-entrega');
      return data;
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery<PaymentMethod[], AxiosError>({
    queryKey: ['company', 'paymentMethods'],
    queryFn: async () => {
      const { data } = await api.get('/empresa/formas-pagamento');
      return data;
    },
  });
};

export const useUpdateCompanyData = () => {
  const queryClient = useQueryClient();
  return useMutation<CompanyData, AxiosError, Partial<CompanyData>>({
    mutationFn: async (data) => {
      const { data: response } = await api.put('/empresa/', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};

export const useUpdateDeliverySettings = () => {
  const queryClient = useQueryClient();
  return useMutation<DeliverySettings, AxiosError, Partial<DeliverySettings>>({
    mutationFn: async (data) => {
      const { data: response } = await api.put('/empresa/taxa-entrega', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'delivery'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};

export const useUpdateWhiteLabel = () => {
  const queryClient = useQueryClient();
  return useMutation<CompanyData, AxiosError, Partial<WhiteLabelSettings>>({
    mutationFn: async (data) => {
      const { data: response } = await api.put('/empresa/white-label', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation<PaymentMethod, AxiosError, Partial<PaymentMethod>>({
    mutationFn: async (data) => {
      const { data: response } = await api.post(
        '/empresa/formas-pagamento',
        data,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company', 'paymentMethods'],
      });
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation<
    PaymentMethod,
    AxiosError,
    { id: number; data: Partial<PaymentMethod> }
  >({
    mutationFn: async ({ id, data }) => {
      const { data: response } = await api.put(
        `/empresa/formas-pagamento/${id}`,
        data,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company', 'paymentMethods'],
      });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: async (id) => {
      await api.delete(`/empresa/formas-pagamento/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company', 'paymentMethods'],
      });
    },
  });
};
