import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { auth } from '../services/auth';
import type { AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User, // Antes: Usuario
  ApiError,
  UserRole, // Antes: Cargo
} from '../types';

// ==========================================
// 1. AUTHENTICATION (/auth)
// ==========================================

export const useLogin = () => {
  const setAuth = auth((state) => state.setAuth);

  return useMutation<AuthResponse, AxiosError<ApiError>, LoginCredentials>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      // Ajustado para data.usuario (conforme sua API retorna) e a tipagem User
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

// ==========================================
// 2. USERS (/usuarios)
// ==========================================

// List users with optional role filter
export const useGetUsers = (role?: UserRole) => {
  return useQuery<User[], AxiosError<ApiError>>({
    queryKey: ['users', role],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/usuarios/', {
        params: { cargo: role }, // A API espera 'cargo' no query param
      });
      return data;
    },
  });
};

// Get specific user detail by ID
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

// Create new employee/user
export const useCreateUser = () => {
  return useMutation<
    User,
    AxiosError<ApiError>,
    Partial<User> & { senha?: string }
  >({
    mutationFn: async (newUser) => {
      const { data } = await api.post<User>('/usuarios/', newUser);
      return data;
    },
  });
};

// Update existing user
export const useUpdateUser = () => {
  return useMutation<
    User,
    AxiosError<ApiError>,
    { id: number; data: Partial<User> & { senha?: string } }
  >({
    mutationFn: async ({ id, data: userData }) => {
      const { data } = await api.put<User>(`/usuarios/${id}`, userData);
      return data;
    },
  });
};

// Toggle active status
export const useToggleUserStatus = () => {
  return useMutation<
    { mensagem: string; ativo: boolean },
    AxiosError<ApiError>,
    number
  >({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/usuarios/${id}/toggle-ativo`);
      return data;
    },
  });
};

// ==========================================
// 3. LOGGED USER PROFILE
// ==========================================

// Get own profile
export const useGetProfile = () => {
  return useQuery<User, AxiosError<ApiError>>({
    queryKey: ['users', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<User>('/usuarios/perfil');
      return data;
    },
  });
};

// Update own profile
export const useUpdateProfile = () => {
  return useMutation<
    User,
    AxiosError<ApiError>,
    Partial<User> & { senha?: string }
  >({
    mutationFn: async (profileData) => {
      const { data } = await api.put<User>('/usuarios/perfil', profileData);
      return data;
    },
  });
};
