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
  referralCode: string;
  hasAcceptedTerms?: boolean;
  hasSignedAgreement?: boolean;
  createdAt?: string;
  role?: 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN';
  location?: string;
  address?: string;
  isKycVerified?: boolean;
  totalEarnings?: number;
  kycStatus?: string;
  avatar?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  isManagerMode?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<User>;
  signup: (userData: any) => Promise<User>;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vemtap_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('vemtap_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setIsAuthenticated(true);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    api.setUnauthorizedCallback(() => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('vemtap_user');
      if (typeof window !== 'undefined') {
        document.cookie = "vemtap_logged_out=true; path=/; max-age=31536000";
      }
    });
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response;
      
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('vemtap_user', JSON.stringify(user));
      if (typeof window !== 'undefined') {
        document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      return user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/signup', userData);
      const { user } = response;
      
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('vemtap_user', JSON.stringify(user));
      if (typeof window !== 'undefined') {
        document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      return user;
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('vemtap_user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('vemtap_user');
      if (typeof window !== 'undefined') {
        document.cookie = "vemtap_logged_out=true; path=/; max-age=31536000";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateUser, logout, isAuthenticated, isLoading, error }}>
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
