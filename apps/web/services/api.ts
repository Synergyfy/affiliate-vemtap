import axios from 'axios';
import { isAdminMockEnabled } from '@/lib/admin-mock';

const API_BASE_URL = typeof window !== 'undefined' 
  ? '/api' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove default Content-Type header when data is FormData so browser sets multipart/form-data with proper boundary
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    if (typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
    }
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Response interceptor for error handling and silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Attempt silent refresh (skip in mock mode)
    if (
      !isAdminMockEnabled() &&
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/auth/login') && 
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then((res) => {
            isRefreshing = false;
            return res.data;
          })
          .catch((err) => {
            isRefreshing = false;
            if (onUnauthorized) onUnauthorized();
            return Promise.reject(err);
          });
      }

      try {
        await refreshPromise;
        // Retry the original request with the new tokens
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // Call callback if we got a 401 and refresh was not possible or failed
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
};

export default api;

