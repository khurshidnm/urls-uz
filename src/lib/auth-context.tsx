'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  provider?: 'telegram' | 'google' | 'phone';
  plan: 'free' | 'pro' | 'enterprise';
  role?: 'superadmin' | 'user';
  avatar?: string;
}

export interface TelegramWidgetData {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
}

interface AuthContextType {
  user: User | null;
  /** True until the first /api/auth/me response arrives. */
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  demoEditMode: boolean;
  setDemoEditMode: (active: boolean) => Promise<void>;
  resetDemoData: () => Promise<boolean>;
  loginWithTelegram: (phone: string, code: string, name?: string) => Promise<boolean>;
  loginWithTelegramWidget: (widgetData: TelegramWidgetData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  /**
   * Opens the login modal. `afterLogin` runs once the user logs in inside the
   * modal (Telegram phone code); redirect logins (Google, Telegram widget)
   * reload the page and create the pending link on the server instead.
   */
  openAuthModal: (pendingUrlToShorten?: string, afterLogin?: () => void) => void;
  closeAuthModal: () => void;
  pendingUrl: string;
  setPendingUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Leftovers from the old client-side "session" (localStorage user + readable cookies). */
function clearLegacyClientSession() {
  for (const key of ['urls_user', 'urls_token', 'urls_is_superadmin', 'urls_demo_edit_mode']) {
    localStorage.removeItem(key);
  }
  for (const name of ['urls_session', 'urls_user_id', 'urls_role']) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [demoEditMode, setDemoEditModeState] = useState(false);
  const afterLoginRef = useRef<(() => void) | null>(null);

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    clearLegacyClientSession();

    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setUser(data.user ?? null);
        setDemoEditModeState(Boolean(data.demoEditMode));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Server components read the session cookie, so re-render them after it changes. */
  const onLoggedIn = (loggedInUser: User) => {
    // The link was created client-side, so the redirect-login fallback isn't needed
    document.cookie = 'urls_pending_url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    setPendingUrl('');
    router.refresh();
    const afterLogin = afterLoginRef.current;
    afterLoginRef.current = null;
    afterLogin?.();
  };

  const openAuthModal = (pendingUrlToShorten?: string, afterLogin?: () => void) => {
    if (pendingUrlToShorten) {
      setPendingUrl(pendingUrlToShorten);
    }
    afterLoginRef.current = afterLogin ?? null;
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingUrl('');
    afterLoginRef.current = null;
  };

  const postLogin = async (payload: Record<string, unknown>): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      // Two-step login: the authenticator code is asked on its own page
      if (data.success && data.twoFactorRequired) {
        window.location.assign(data.redirect);
        return true;
      }
      if (data.success && data.user) {
        onLoggedIn(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginWithTelegram = (phone: string, code: string, name?: string) =>
    postLogin({ action: 'verify-otp', phone, code, name });

  const loginWithTelegramWidget = (widgetData: TelegramWidgetData) =>
    postLogin({ action: 'verify-widget', widgetData });

  const setDemoEditMode = async (active: boolean) => {
    const res = await fetch('/api/auth/demo-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setDemoEditModeState(active);
      router.refresh();
    }
  };

  const resetDemoData = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setDemoEditModeState(false);
    // To the landing page with a full load: refreshing a dashboard page would
    // show the read-only demo that anonymous visitors see there. A full load also
    // drops cached dashboard pages, so Back can't show the signed-in data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSuperAdmin,
        demoEditMode,
        setDemoEditMode,
        resetDemoData,
        loginWithTelegram,
        loginWithTelegramWidget,
        logout,
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
