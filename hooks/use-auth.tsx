'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface User {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  isKycVerified?: boolean;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Register global unauthorized handler
    api.setUnauthorizedCallback(() => {
      logout();
    });

    const initAuth = async () => {
      const savedUser = localStorage.getItem('vemtap_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Verify token/profile with backend
          const profile = await api.get('/auth/profile');
          const fullUser = { ...profile, token: parsed.token };
          setUser(fullUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          logout(); // Use centralized logout instead of just removing item
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);


  const login = async (email: string, password?: string) => {
    try {
      if (!password) {
        throw new Error('Password is required for login');
      }
      const response = await api.post('/auth/login', { email, password });
      const userData = { ...response.user, token: response.accessToken };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('vemtap_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      const authenticatedUser = { ...response.user, token: response.accessToken };
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('vemtap_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const sendOtp = async (email: string) => {
    try {
      await api.post('/auth/otp/send', { email });
    } catch (error) {
      console.error('Failed to send OTP:', error);
      throw error;
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    try {
      await api.post('/auth/otp/verify', { email, code });
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('vemtap_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, sendOtp, verifyOtp, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
