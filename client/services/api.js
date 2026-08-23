import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api' });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('agentflow-auth');
    const session = stored ? JSON.parse(stored).state : null;
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const createWorkflow = (payload) => api.post('/workflows', payload);
export const generateWorkflow = (payload) => api.post('/workflows/generate', payload);
export default api;
