'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  provider?: 'telegram' | 'google' | 'email';
  plan: 'free' | 'pro' | 'enterprise';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginWithTelegram: (phone: string, code: string, name?: string) => Promise<boolean>;
  loginWithTelegramWidget: (widgetData: any) => Promise<boolean>;
  loginWithGoogle: (email?: string, name?: string, avatar?: string) => Promise<boolean>;
  logout: () => void;
  updatePlan: (plan: 'free' | 'pro' | 'enterprise') => void;
  isAuthModalOpen: boolean;
  openAuthModal: (pendingUrlToShorten?: string) => void;
  closeAuthModal: () => void;
  pendingUrl: string;
  setPendingUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('urls_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const openAuthModal = (pendingUrlToShorten?: string) => {
    if (pendingUrlToShorten) {
      setPendingUrl(pendingUrlToShorten);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const loginWithTelegram = async (phone: string, code: string, name?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', phone, code, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('urls_user', JSON.stringify(data.user));
        localStorage.setItem('urls_token', data.token);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginWithTelegramWidget = async (widgetData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-widget', widgetData }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('urls_user', JSON.stringify(data.user));
        localStorage.setItem('urls_token', data.token);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginWithGoogle = async (email?: string, name?: string, avatar?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('urls_user', JSON.stringify(data.user));
        localStorage.setItem('urls_token', data.token);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('urls_user');
    localStorage.removeItem('urls_token');
  };

  const updatePlan = (plan: 'free' | 'pro' | 'enterprise') => {
    if (user) {
      const updated = { ...user, plan };
      setUser(updated);
      localStorage.setItem('urls_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginWithTelegram,
        loginWithTelegramWidget,
        loginWithGoogle,
        logout,
        updatePlan,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingUrl,
        setPendingUrl,
      }}
    >
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
