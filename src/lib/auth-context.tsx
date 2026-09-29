'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  updatePlan: (plan: 'free' | 'pro' | 'enterprise') => void;
}

const defaultUser: User = {
  id: 'demo_user',
  name: 'Khurshid Nurmukhamedov',
  email: 'admin@urls.uz',
  plan: 'pro',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(defaultUser);

  useEffect(() => {
    const saved = localStorage.getItem('urls_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(defaultUser);
      }
    }
  }, []);

  const login = (email: string, name = 'User') => {
    const u: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      plan: 'pro',
    };
    setUser(u);
    localStorage.setItem('urls_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('urls_user');
  };

  const updatePlan = (plan: 'free' | 'pro' | 'enterprise') => {
    if (user) {
      const updated = { ...user, plan };
      setUser(updated);
      localStorage.setItem('urls_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updatePlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
