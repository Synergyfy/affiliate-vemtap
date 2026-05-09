'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  role?: 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN' | 'affiliate' | 'manager';
  location?: string;
  address?: string;
  isKycVerified?: boolean;
  totalEarnings?: number;
  kycStatus?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set up unauthorized callback once
  useEffect(() => {
    api.setUnauthorizedCallback(() => {
      logout();
      router.push('/login');
    });
  }, [router]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to fetch current user profile to verify session
        const response = await api.get('/auth/me');
        if (response?.user) {
          setUser(response.user);
          setIsAuthenticated(true);
          localStorage.setItem('vemtap_user', JSON.stringify(response.user));
        } else {
          // If no user profile returned, clear state
          localStorage.removeItem('vemtap_user');
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Silent fail on init - might just be unauthenticated
        console.log('Session verification failed or no active session');
        localStorage.removeItem('vemtap_user');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response;
      
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('vemtap_user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/signup', userData);
      const { user } = response;
      
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('vemtap_user', JSON.stringify(user));
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
      console.error('Logout request failed', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('vemtap_user');
      router.push('/login');
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
