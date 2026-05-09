/**
 * API Client for the Affiliate Platform.
 * Uses cookie-based authentication (httpOnly cookies set by the backend).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005/api';

let onUnauthorized: (() => void) | null = null;
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const executeRequest = () => fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies with every request
  });

  let response = await executeRequest();

  // Handle 401 Unauthorized - Attempt silent refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        isRefreshing = false;
        if (res.ok) return res.json();
        throw new Error('Refresh failed');
      }).catch((err) => {
        isRefreshing = false;
        if (onUnauthorized) onUnauthorized();
        throw err;
      });
    }

    try {
      await refreshPromise;
      // Retry the original request after successful refresh
      response = await executeRequest();
    } catch (refreshError) {
      // If refresh fails, we've already called onUnauthorized
      throw refreshError;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'API request failed');
    (error as any).status = response.status;
    throw error;
  }

  // Handle 204 No Content or empty responses
  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType?.includes('application/json')) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => fetchWithAuth(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
  setUnauthorizedCallback: (callback: () => void) => {
    onUnauthorized = callback;
  },
};
