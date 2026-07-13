// ─── services/api.js ──────────────────────────────────────────────────────────
// Shared Axios HTTP client configured with request/response interceptors.
// Integrates with centralized config layer and handles authentication headers.

import axios from 'axios';
import { env } from '../config/env.js';

const api = axios.create({
  baseURL: env.API_URL,
});

// ─── Request Interceptor: Attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: Auth error handler ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401, auto-logout by deleting local credentials
    if (error.response?.status === 401) {
      localStorage.removeItem('tf_token');
      // Redirect to login only if not already there to prevent routing loops
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
