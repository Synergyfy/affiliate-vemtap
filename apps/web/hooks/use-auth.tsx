'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { isAdminMockEnabled } from '@/lib/admin-mock';

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
  role?: 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MANAGER' | 'SALES_EXECUTIVE';
  location?: string;
  address?: string;
  isKycVerified?: boolean;
  totalEarnings?: number;
  kycStatus?: string;
  avatar?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;

  isTourCompleted?: boolean;
  driversLicense?: string;
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
      // Mock mode is fully self-contained: restore the session from storage
      // instead of hitting /auth/me (there may be no backend to validate against).
      if (isAdminMockEnabled()) {
        const saved = localStorage.getItem('vemtap_user');
        if (saved) {
          try {
            const cached = JSON.parse(saved);
            setUser(cached);
            setIsAuthenticated(true);
          } catch {
            /* corrupted cache — leave unauthenticated */
          }
        }
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get<{ user: User }>('/auth/me');
        const currentUser = response.user;
        setUser(currentUser);
        setIsAuthenticated(true);
        localStorage.setItem('vemtap_user', JSON.stringify(currentUser));
      } catch {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('vemtap_user');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    api.setUnauthorizedCallback(() => {
      // Never destroy a mock session — there is no real backend to trust anyway.
      if (isAdminMockEnabled()) return;
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
      if (isAdminMockEnabled()) {
        const isAffiliate = email.toLowerCase().includes('affiliate') || email.toLowerCase().includes('dashboard') || email.toLowerCase() === 'test@vemtap.com';
        const isSupervisor = email.toLowerCase().includes('supervisor');
        const isManager = email.toLowerCase().includes('manager');
        const isSalesExecutive = email.toLowerCase().includes('sales') || email.toLowerCase().includes('se');
        
        const mockRole = isSalesExecutive ? 'SALES_EXECUTIVE' : isSupervisor ? 'SUPERVISOR' : isManager ? 'MANAGER' : isAffiliate ? 'AFFILIATE' : 'SUPER_ADMIN';
        const mockName = isSalesExecutive ? 'Sales Executive User' : isSupervisor ? 'Supervisor User' : isManager ? 'Manager User' : isAffiliate ? 'Affiliate User' : 'Admin User';

        const mockAdminUser: User = {
          id: isSalesExecutive ? 'se-mock-user-1' : isAffiliate ? 'affiliate-mock-user-1' : isSupervisor ? 'supervisor-mock-user-1' : isManager ? 'manager-mock-user-1' : 'admin-mock-user-1',
          fullName: mockName,
          email: email || 'admin@vemtap.com',
          phone: '+2348012345678',
          referralCode: isSalesExecutive ? 'SE1' : isAffiliate ? 'AFFILIATE1' : isSupervisor ? 'SUPERVISOR1' : isManager ? 'MANAGER1' : 'ADMINMOCK',
          role: mockRole,
          hasAcceptedTerms: true,
          hasSignedAgreement: true,
          isKycVerified: true,
          kycStatus: 'VERIFIED',
          totalEarnings: 1500000,
        };
        
        const MOCK_TOKEN = isSalesExecutive
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU0FMRVNfRVhFQ1VUSVZFIiwiaWF0IjoxNjAwMDAwMDAwfQ.signature"
          : isAffiliate 
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQUZGSUxJQVRFIiwiaWF0IjoxNjAwMDAwMDAwfQ.signature" 
          : isSupervisor
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJWSVNPUiIsImlhdCI6MTYwMDAwMDAwMH0.signature"
          : isManager
          ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiTUFOQUdFUiIsImlhdCI6MTYwMDAwMDAwMH0.signature"
          : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE2MDAwMDAwMDB9.signature";
        setUser(mockAdminUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        localStorage.setItem('vemtap_user', JSON.stringify(mockAdminUser));
        if (typeof window !== 'undefined') {
          document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = `vemtap-auth-token=${MOCK_TOKEN}; path=/; max-age=86400`;
        }
        return mockAdminUser;
      }

      const response = await api.post('/auth/login', { email, password });
      const user = response.user || response.data?.user || response.data || response;
      
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
      const user = response.user || response.data?.user || response.data || response;
      
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
      if (!isAdminMockEnabled()) {
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
