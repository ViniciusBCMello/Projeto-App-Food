import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // 👈 Adicionado useQueryClient
import { api } from '../services/api';
import { auth } from '../services/auth';
import type { AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  ApiError,
  UserRole,
} from '../types';

export const useLogin = () => {
  const setAuth = auth((state) => state.setAuth);

  return useMutation<AuthResponse, AxiosError<ApiError>, LoginCredentials>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.usuario, data.token);
    },
  });
};

export const useAuthMe = () => {
  return useQuery<User, AxiosError<ApiError>>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      return data;
    },
  });
};

export const useGetUsers = (role?: UserRole) => {
  return useQuery<User[], AxiosError<ApiError>>({
    queryKey: ['users', role],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/usuarios/', {
        params: { cargo: role },
      });
      return data;
    },
  });
};

export const useGetUserById = (id?: number) => {
  return useQuery<User, AxiosError<ApiError>>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get<User>(`/usuarios/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    AxiosError<ApiError>,
    Partial<User> & { senha?: string }
  >({
    mutationFn: async (newUser) => {
      const { data } = await api.post<User>('/usuarios/', newUser);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    AxiosError<ApiError>,
    { id: number; data: Partial<User> & { senha?: string } }
  >({
    mutationFn: async ({ id, data: userData }) => {
      const { data } = await api.put<User>(`/usuarios/${id}`, userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { mensagem: string; ativo: boolean },
    AxiosError<ApiError>,
    number
  >({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/usuarios/${id}/toggle-ativo`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useGetProfile = () => {
  return useQuery<User, AxiosError<ApiError>>({
    queryKey: ['users', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<User>('/usuarios/perfil');
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    AxiosError<ApiError>,
    Partial<User> & { senha?: string }
  >({
    mutationFn: async (profileData) => {
      const { data } = await api.put<User>('/usuarios/perfil', profileData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};
