// src/api/client.ts
import axios from 'axios';
import { getBaseURL, getToken } from '../state/auth';

const baseURL = getBaseURL();

export const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,           // ← 10 segundos máximo
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para añadir token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para debug
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);