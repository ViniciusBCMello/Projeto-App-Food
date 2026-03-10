import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { auth } from '../services/auth';
import type { AxiosError } from 'axios';
import type { AuthResponse, LoginCredentials } from '../types';

export const useLogin = () => {
  const setAuth = auth((state) => state.setAuth);

  return useMutation<AuthResponse, AxiosError, LoginCredentials>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.usuario, data.token);
    },
  });
};
