import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
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
        const headers = config.headers as { delete?: (name: string) => void } & Record<string, string | undefined>;

        if (typeof headers.delete === 'function') {
          headers.delete('Content-Type');
          headers.delete('content-type');
        } else {
          delete headers['Content-Type'];
          delete headers['content-type'];
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
