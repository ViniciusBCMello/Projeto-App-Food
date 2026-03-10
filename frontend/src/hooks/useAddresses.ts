import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AxiosError } from 'axios';
import type { Address } from '../types';

export const useAddresses = () => {
  const queryClient = useQueryClient();

  const query = useQuery<Address[], AxiosError>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await api.get('/enderecos/');
      return data;
    },
  });

  const setPrincipal = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/enderecos/${id}/principal`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/enderecos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  return { ...query, setPrincipal, deleteAddress };
};
