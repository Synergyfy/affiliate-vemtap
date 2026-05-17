/**
 * API Client adapter for the Affiliate Platform.
 * delegates to the unified Axios instance under the hood for consistency.
 */

import api, { setUnauthorizedCallback } from '@/services/api';

export const apiFetch = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const response = await api.get<T>(endpoint);
    return response.data;
  },
  post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const response = await api.post<T>(endpoint, body);
    return response.data;
  },
  patch: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const response = await api.patch<T>(endpoint, body);
    return response.data;
  },
  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await api.delete<T>(endpoint);
    return response.data;
  },
  setUnauthorizedCallback,
};

export { apiFetch as api };

