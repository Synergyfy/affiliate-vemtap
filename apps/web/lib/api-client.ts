/**
 * API Client adapter for the Affiliate Platform.
 * delegates to the unified Axios instance under the hood for consistency.
 */

import api, { setUnauthorizedCallback } from '@/services/api';
import type { AxiosRequestConfig } from 'axios';

export const apiFetch = {
  get: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<T>(endpoint, config);
    return response.data;
  },
  post: async <T = any>(endpoint: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post<T>(endpoint, body, config);
    return response.data;
  },
  patch: async <T = any>(endpoint: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch<T>(endpoint, body, config);
    return response.data;
  },
  delete: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<T>(endpoint, config);
    return response.data;
  },
  setUnauthorizedCallback,
};

export { apiFetch as api };

