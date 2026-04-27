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
  role?: 'affiliate' | 'manager';
  location?: string;
  address?: string;
  isKycVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  signup: (userData: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('vemtap_user');
    }
    return false;
  });

  const login = (email: string) => {
    const savedUser = localStorage.getItem('vemtap_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.email === email) {
        setIsAuthenticated(true);
        return;
      }
    }
    const mockUser: User = { 
      id: 'USER-123',
      fullName: 'John Doe', 
      email, 
      phone: '+234 800 000 0000', 
      referralCode: 'REF12345',
      hasAcceptedTerms: true,
      hasSignedAgreement: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      role: 'affiliate',
      isKycVerified: true
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('vemtap_user', JSON.stringify(mockUser));
  };

  const signup = (userData: User) => {
    const newUser: User = { 
      ...userData, 
      hasAcceptedTerms: false, 
      hasSignedAgreement: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      role: 'affiliate'
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('vemtap_user', JSON.stringify(newUser));
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('vemtap_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('vemtap_user');
  };

  const isLoading = false;

  return (
    <AuthContext.Provider value={{ user, login, signup, updateUser, logout, isAuthenticated, isLoading }}>
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
