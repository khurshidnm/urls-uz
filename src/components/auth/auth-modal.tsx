'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import LogoMark from '@/components/brand/logo-mark';
import EmailPanel from './email-panel';
import PhoneLogin from './phone-login';

const TEXT = {
  signin: {
    uz: { title: 'Kirish', subtitle: 'Akkauntingizga kiring', google: 'Google orqali kirish', telegram: 'Telegram orqali kirish', switchQ: 'Akkauntingiz yo‘qmi?', switchA: 'Ro‘yxatdan o‘ting' },
    ru: { title: 'Вход', subtitle: 'Войдите в свой аккаунт', google: 'Войти через Google', telegram: 'Войти через Telegram', switchQ: 'Нет аккаунта?', switchA: 'Зарегистрируйтесь' },
    en: { title: 'Sign in', subtitle: 'Sign in to your account', google: 'Continue with Google', telegram: 'Continue with Telegram', switchQ: 'No account yet?', switchA: 'Sign up' },
  },
  signup: {
    uz: { title: 'Ro‘yxatdan o‘tish', subtitle: 'Bepul akkaunt: havolalar, QR kodlar va analitika', google: 'Google orqali ro‘yxatdan o‘tish', telegram: 'Telegram orqali ro‘yxatdan o‘tish', switchQ: 'Akkauntingiz bormi?', switchA: 'Kiring' },
    ru: { title: 'Регистрация', subtitle: 'Бесплатный аккаунт: ссылки, QR-коды и аналитика', google: 'Зарегистрироваться через Google', telegram: 'Зарегистрироваться через Telegram', switchQ: 'Уже есть аккаунт?', switchA: 'Войдите' },
    en: { title: 'Create an account', subtitle: 'Free: short links, QR codes and analytics', google: 'Sign up with Google', telegram: 'Sign up with Telegram', switchQ: 'Already have an account?', switchA: 'Sign in' },
  },
} as const;

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="12" fill="#229ED9" />
    <path fill="#fff" d="M5.4 11.8l11.6-4.5c.5-.2 1 .1.8.9l-2 9.3c-.1.6-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5c.2-.2 0-.3-.4-.1l-6.9 4.3-3-.9c-.6-.2-.7-.6.2-.9z" />
  </svg>
);

/**
 * The login window, in the usual layout: email (or login) + password first,
 * then "or" Google and Telegram (a code sent to the user's Telegram by phone
 * number), and a link between signing in and signing up.
 */
export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, pendingUrl, loginMethods, authView, setAuthView } = useAuth();
  const { locale } = useLanguage();
  const [phoneMode, setPhoneMode] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const t = TEXT[authView][locale] ?? TEXT[authView].uz;
  const emailForm = authView === 'signin' || loginMethods.email;

  // Google and the Telegram widget log in through a full-page redirect, so the
  // URL the visitor wanted to shorten travels in a cookie and is created server-side.
  useEffect(() => {
    if (isAuthModalOpen && pendingUrl) {
      document.cookie = `urls_pending_url=${encodeURIComponent(pendingUrl)}; path=/; max-age=600; SameSite=Lax`;
    }
  }, [isAuthModalOpen, pendingUrl]);

  const close = () => {
    setPhoneMode(false);
    setGoogleLoading(false);
    closeAuthModal();
  };

  return (
    <Modal isOpen={isAuthModalOpen} onClose={close} hideHeader maxWidth="md">
      <div className="space-y-5 pt-1">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <LogoMark size={40} />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{t.title}</h3>
          <p className="text-xs text-slate-400">{t.subtitle}</p>
        </div>

        {phoneMode ? (
          <PhoneLogin onBack={() => setPhoneMode(false)} />
        ) : (
          <>
            {emailForm && <EmailPanel view={authView} emailAvailable={loginMethods.email} />}

            {emailForm && (
              <div className="flex items-center gap-3" aria-hidden>
                <div className="flex-grow border-t border-[var(--border-subtle)]" />
                <span className="text-[11px] text-slate-500 font-medium">yoki</span>
                <div className="flex-grow border-t border-[var(--border-subtle)]" />
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setGoogleLoading(true);
                  // Full-page redirect to Google; it comes back logged in
                  window.location.href = '/api/auth/google';
                }}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-default)] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                {t.google}
              </button>

              {loginMethods.phone && (
                <button
                  type="button"
                  onClick={() => setPhoneMode(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-default)] text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <TelegramIcon />
                  {t.telegram}
                </button>
              )}
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400">
          {t.switchQ}{' '}
          <button
            type="button"
            onClick={() => {
              setPhoneMode(false);
              setAuthView(authView === 'signin' ? 'signup' : 'signin');
            }}
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            {t.switchA}
          </button>
        </p>

        <div className="pt-3 border-t border-[var(--border-subtle)] text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Havolalarni faqat tasdiqlangan foydalanuvchilar yaratadi: fishingdan himoya</span>
        </div>
      </div>
    </Modal>
  );
}
