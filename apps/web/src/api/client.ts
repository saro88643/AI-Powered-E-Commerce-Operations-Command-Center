import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopsphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Auto-fallback or redirect if token expired
      console.warn('Authentication token expired or missing.');
    }
    return Promise.reject(error);
  }
);

export default api;
