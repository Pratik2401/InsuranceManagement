import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('insureflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Content-Type');
          (config.headers as any).delete('content-type');
        } else {
          delete (config.headers as any)['Content-Type'];
          delete (config.headers as any)['content-type'];
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to /login on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('insureflow_token');
      localStorage.removeItem('insureflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
