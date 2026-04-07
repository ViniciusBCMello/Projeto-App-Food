import axios from 'axios';
import { auth } from './auth';

const baseURL =
  import.meta.env.VITE_BACKEND ||
  'http://localhost:5000';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = auth.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
