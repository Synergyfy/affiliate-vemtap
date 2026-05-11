import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://affiliateapi.vemtap.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // You can trigger a redirect to login here if needed
      // window.location.href = '/login';
    }

    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
