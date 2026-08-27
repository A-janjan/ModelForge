import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add API key from localStorage
apiClient.interceptors.request.use((config) => {
  const key = localStorage.getItem('apiKey');
  if (key) {
    config.headers['X-API-Key'] = key;
  }
  return config;
});