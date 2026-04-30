'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  fullName: string;
  email: string;
  phone: string;
  referralCode: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  signup: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
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

  useEffect(() => {
    // This effect is now empty or can be removed if not needed for other syncs
  }, []);

  const login = (email: string) => {
    // Mock login - if user exists in localStorage, log them in
    const savedUser = localStorage.getItem('vemtap_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.email === email) {
        setIsAuthenticated(true);
        return;
      }
    }
    // Fallback mock user if none exists
    const mockUser = { fullName: 'John Doe', email, phone: '+234 800 000 0000', referralCode: 'REF12345' };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('vemtap_user', JSON.stringify(mockUser));
  };

  const signup = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('vemtap_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('vemtap_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated }}>
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
