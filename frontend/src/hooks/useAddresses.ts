import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Address {
  id: number;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
  principal: boolean;
}

export function useAddresses() {
  const queryClient = useQueryClient();

  const {
    data: addresses,
    isLoading,
    error,
  } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/enderecos/');
      return response.data;
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (newAddress: Omit<Address, 'id'>) => {
      const response = await api.post('/enderecos/', newAddress);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Address>;
    }) => {
      const response = await api.put(`/enderecos/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/enderecos/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.erro || 'Erro ao excluir endereço';
      alert(message);
    },
  });

  const setPrincipalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch(`/enderecos/${id}/principal`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  return {
    addresses,
    isLoading,
    error,
    createAddress: createAddressMutation.mutateAsync,
    isCreating: createAddressMutation.isPending,
    updateAddress: updateAddressMutation.mutateAsync,
    isUpdating: updateAddressMutation.isPending,
    deleteAddress: deleteAddressMutation.mutateAsync,
    isDeleting: deleteAddressMutation.isPending,
    setPrincipal: setPrincipalMutation.mutateAsync,
    isSettingPrincipal: setPrincipalMutation.isPending,
  };
}
