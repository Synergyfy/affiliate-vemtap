/**
 * API Client for the Affiliate Platform.
 * Isolated from the main VemTap logic.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005/api';

let onUnauthorized: (() => void) | null = null;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const user = localStorage.getItem('vemtap_user');
  const token = user ? JSON.parse(user).token : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
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

  return response.json();
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
  setUnauthorizedCallback: (callback: () => void) => {
    onUnauthorized = callback;
  },
};

