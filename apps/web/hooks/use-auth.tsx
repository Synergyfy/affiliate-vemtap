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
  role?: 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MANAGER';
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
      if (process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true') {
        const isAffiliate = email.toLowerCase().includes('affiliate') || email.toLowerCase().includes('dashboard') || email.toLowerCase() === 'test@vemtap.com';
        const isSupervisor = email.toLowerCase().includes('supervisor');
        const isManager = email.toLowerCase().includes('manager');
        
        const mockRole = isSupervisor ? 'SUPERVISOR' : isManager ? 'MANAGER' : isAffiliate ? 'AFFILIATE' : 'SUPER_ADMIN';
        const mockName = isSupervisor ? 'Supervisor User' : isManager ? 'Manager User' : isAffiliate ? 'Affiliate User' : 'Admin User';

        const mockAdminUser: User = {
          id: isAffiliate ? 'affiliate-mock-user-1' : isSupervisor ? 'supervisor-mock-user-1' : isManager ? 'manager-mock-user-1' : 'admin-mock-user-1',
          fullName: mockName,
          email: email || 'admin@vemtap.com',
          phone: '+2348012345678',
          referralCode: isAffiliate ? 'AFFILIATE1' : isSupervisor ? 'SUPERVISOR1' : isManager ? 'MANAGER1' : 'ADMINMOCK',
          role: mockRole,
          hasAcceptedTerms: true,
          hasSignedAgreement: true,
          isKycVerified: true,
          kycStatus: 'VERIFIED',
          totalEarnings: 1500000,
        };
        
        // Try real login first if backend is running, otherwise use mock user
        try {
          const response = await api.post('/auth/login', { email, password });
          if (response?.user) {
            setUser(response.user);
            setIsAuthenticated(true);
            localStorage.setItem('vemtap_user', JSON.stringify(response.user));
            return response.user;
          }
        } catch (apiErr) {
          console.warn('Backend API unavailable. Falling back to mock admin login mode.', apiErr);
        }

        const MOCK_TOKEN = isAffiliate 
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQUZGSUxJQVRFIiwiaWF0IjoxNjAwMDAwMDAwfQ.signature" 
          : isSupervisor
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJWSVNPUiIsImlhdCI6MTYwMDAwMDAwMH0.signature"
          : isManager
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiTUFOQUdFUiIsImlhdCI6MTYwMDAwMDAwMH0.signature"
          : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE2MDAwMDAwMDB9.signature";
        setUser(mockAdminUser);
        setIsAuthenticated(true);
        localStorage.setItem('vemtap_user', JSON.stringify(mockAdminUser));
        if (typeof window !== 'undefined') {
          document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = `vemtap-auth-token=${MOCK_TOKEN}; path=/; max-age=86400`;
        }
        return mockAdminUser;
      }

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
      if (process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true') {
        const mockNewUser: User = {
          id: 'user-mock-signup',
          fullName: userData.fullName || 'New User',
          email: userData.email || 'user@example.com',
          phone: userData.phone || '+2348000000000',
          referralCode: 'MOCKUSER1',
          role: 'SUPER_ADMIN',
          hasAcceptedTerms: true,
          hasSignedAgreement: true,
          isKycVerified: true,
          kycStatus: 'VERIFIED',
        };

        try {
          const response = await api.post('/auth/signup', userData);
          if (response?.user) {
            setUser(response.user);
            setIsAuthenticated(true);
            localStorage.setItem('vemtap_user', JSON.stringify(response.user));
            return response.user;
          }
        } catch (apiErr) {
          console.warn('Backend API unavailable. Falling back to mock signup.', apiErr);
        }

        const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE2MDAwMDAwMDB9.signature";
        setUser(mockNewUser);
        setIsAuthenticated(true);
        localStorage.setItem('vemtap_user', JSON.stringify(mockNewUser));
        if (typeof window !== 'undefined') {
          document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = `vemtap-auth-token=${MOCK_TOKEN}; path=/; max-age=86400`;
        }
        return mockNewUser;
      }

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
      if (process.env.NEXT_PUBLIC_ADMIN_MOCK !== 'true') {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('vemtap_user');
      if (typeof window !== 'undefined') {
        document.cookie = "vemtap_logged_out=true; path=/; max-age=31536000";
        document.cookie = "vemtap-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
