import axios from 'axios';

// Use relative URL for Vite proxy in development, fallback to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối đến máy chủ';
    return Promise.reject(new Error(message));
  }
);

export const checkHealth = async () => {
  return await apiClient.get('/health');
};

export const getInventoryOverview = async () => {
  return await apiClient.get('/inventory/overview');
};

export const getAiStatus = async () => {
  return await apiClient.get('/ai/status');
};
