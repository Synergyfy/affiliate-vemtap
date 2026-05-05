/**
 * API Client for the Affiliate Platform.
 * Uses cookie-based authentication (httpOnly cookies set by the backend).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://affiliateapi.vemtap.com/api/v1';

let onUnauthorized: (() => void) | null = null;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies with every request
  });

  if (response.status === 401) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
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
