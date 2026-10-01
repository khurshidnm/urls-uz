'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { TelegramIcon } from '@/components/ui/icons';
import EmailPanel from './email-panel';
import {
  ShieldCheck,
  Mail,
  Smartphone,
  ArrowRight,
  Lock,
  Sparkles,
  Loader2,
  RefreshCw,
  ExternalLink,
  Edit2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function formatUzbekPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let local = digits.startsWith('998') ? digits.slice(3) : digits;
  local = local.slice(0, 9);

  let formatted = '+998';
  if (local.length > 0) {
    formatted += ` (${local.slice(0, 2)}`;
  }
  if (local.length >= 2) {
    formatted += `) ${local.slice(2, 5)}`;
  }
  if (local.length >= 5) {
    formatted += `-${local.slice(5, 7)}`;
  }
  if (local.length >= 7) {
    formatted += `-${local.slice(7, 9)}`;
  }
  return formatted;
}

/** Login window: Telegram, Google, and email (or login) + password. */
export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithTelegram,
    pendingUrl,
    loginMethods,
  } = useAuth();
  const phoneLoginAvailable = loginMethods.phone;
  const emailLoginAvailable = loginMethods.email;
  const { locale } = useLanguage();

  const [authMethod, setAuthMethod] = useState<'telegram' | 'google' | 'password'>('telegram');

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'urlsuzbot';

  // Telegram OTP states
  const [phone, setPhone] = useState('+998 ');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length < 4) {
      setPhone('+998 ');
      return;
    }
    setPhone(formatUzbekPhone(val));
    if (error) setError('');
  };

  const handleSendTelegramOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 12) {
      setError('Iltimos, to‘liq 9 xonali telefon raqamingizni kiriting (+998 XX XXX XX XX)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(60);
        setDemoCodeHint(data.demoCode || '');
      } else {
        setError(data.error || 'Kod yuborishda xatolik yuz berdi');
      }
    } catch {
      setError('Tarmoq xatosi yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  const executeVerifyOtp = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length < 5 || loading) return;

    setLoading(true);
    setError('');

    const success = await loginWithTelegram(phone, codeToVerify);
    if (success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      resetForm();
    } else {
      setError('Kiritilgan tasdiqlash kodi noto‘g‘ri. Qayta tekshirib ko‘ring.');
    }
    setLoading(false);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerifyOtp(otpCode);
  };

  const handleFillDemoCode = (code: string) => {
    setOtpCode(code);
    executeVerifyOtp(code);
  };

  // Google and the Telegram widget log in through a full-page redirect, so the
  // URL the visitor wanted to shorten travels in a cookie and is created server-side.
  useEffect(() => {
    if (isAuthModalOpen && pendingUrl) {
      document.cookie = `urls_pending_url=${encodeURIComponent(pendingUrl)}; path=/; max-age=600; SameSite=Lax`;
    }
  }, [isAuthModalOpen, pendingUrl]);

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    window.location.href = '/api/auth/google';
  };

  const resetForm = () => {
    setPhone('+998 ');
    setOtpSent(false);
    setOtpCode('');
    setError('');
    setDemoCodeHint('');
    setCountdown(60);
  };

  const handleModalClose = () => {
    resetForm();
    closeAuthModal();
  };

  return (
    <Modal isOpen={isAuthModalOpen} onClose={handleModalClose} hideHeader maxWidth="md">
      <div className="space-y-5 pt-1">
        {/* Security Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {locale === 'uz' ? 'Xavfsiz Tizimga Kirish' : locale === 'ru' ? 'Безопасный Вход' : 'Secure Authorization'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Fishing va firibgarlikning oldini olish uchun havolalar faqat tasdiqlangan foydalanuvchilar tomonidan yaratiladi.
          </p>
        </div>

        {/* Auth Method Switcher Tabs */}
        <div className="grid grid-cols-3 p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('telegram');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'telegram'
                ? 'bg-[#229ED9] text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TelegramIcon className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'google'
                ? 'bg-white text-slate-900 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'password' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>

        {/* Telegram Auth Tab */}
        {authMethod === 'telegram' && (
          <div className="space-y-4">
            {/* 1-Click Telegram Action */}
            <div className="p-3.5 bg-gradient-to-b from-sky-500/10 to-transparent border border-sky-500/20 rounded-2xl text-center space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Tezkor avtorizatsiya:
                </span>
                <a
                  href={`https://t.me/${botUsername}?start=auth`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                >
                  <span>@{botUsername}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <TelegramLoginWidget botUsername={botUsername} />
            </div>

            {phoneLoginAvailable && (
            <>
            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium">
                yoki Telegram tasdiqlash kodi orqali
              </span>
              <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
            </div>

            {/* Phone Step 1: Input Phone */}
            {!otpSent ? (
              <form onSubmit={handleSendTelegramOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telefon raqamingiz
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="+998 (90) 123-45-67"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 font-mono tracking-wider transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Telegram akkauntingizga bog‘langan raqamni kiriting
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 animate-fade-in">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length < 12}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-white text-xs font-semibold rounded-xl border border-[var(--border-subtle)] hover:border-sky-500/30 transition-all disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Kod yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Tasdiqlash kodini yuborish</span>
                      <ArrowRight className="w-4 h-4 text-sky-400" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Phone Step 2: Input OTP */
              <form onSubmit={handleVerifySubmit} className="space-y-4 animate-fade-in">
                {/* Phone summary & change */}
                <div className="p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400">Raqam: </span>
                    <strong className="text-white font-mono">{phone}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setError('');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>O‘zgartirish</span>
                  </button>
                </div>

                {/* Demo OTP hint badge */}
                {demoCodeHint && (
                  <button
                    type="button"
                    onClick={() => handleFillDemoCode(demoCodeHint)}
                    className="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15 text-xs text-center transition-all flex items-center justify-center gap-2 group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Dev rejimi (Telegram Gateway sozlanmagan), kod: <strong className="font-mono font-bold tracking-wider">{demoCodeHint}</strong></span>
                    <span className="text-[10px] text-emerald-300/70 underline group-hover:text-emerald-300">
                      (1-bosishda kiritish)
                    </span>
                  </button>
                )}

                {/* OTP Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                    5 xonali tasdiqlash kodini kiriting
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={otpCode}
                    onChange={(e) => {
                      const nextCode = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setOtpCode(nextCode);
                      if (error) setError('');
                      if (nextCode.length === 5) {
                        executeVerifyOtp(nextCode);
                      }
                    }}
                    placeholder="• • • • •"
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 bg-[var(--surface-1)] border border-[var(--border-default)] focus:border-sky-500 rounded-xl text-white focus:outline-none transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center animate-fade-in">
                    {error}
                  </p>
                )}

                {/* Resend & Submit */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 5}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Tekshirilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tasdiqlash & Kirish</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    {countdown > 0 ? (
                      <span className="text-[11px] text-slate-500">
                        Kodni qayta yuborish: <strong className="text-slate-400 font-mono">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendTelegramOtp()}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Kodni qayta yuborish</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
            </>
            )}
          </div>
        )}

        {/* Google Auth Tab */}
        {authMethod === 'google' && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-400 text-center">
              Google profilingiz orqali bir bosishda xavfsiz autentifikatsiyadan o‘ting:
            </p>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center animate-fade-in">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-lg shadow-black/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Bog‘lanmoqda...' : 'Google hisobi bilan davom etish'}</span>
            </button>

          </div>
        )}

        {/* Email tab: email or login + password, email sign-up, forgotten password */}
        {authMethod === 'password' && <EmailPanel emailAvailable={emailLoginAvailable} />}

        {/* Security Trust Footnote */}
        <div className="pt-3 border-t border-[var(--border-subtle)] text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>256-bit shifrlangan xavfsiz ulanish · Shaxsiy ma’lumotlar himoyalangan</span>
        </div>

      </div>
    </Modal>
  );
}

/**
 * Official Telegram Login Widget. Telegram redirects to data-auth-url with
 * signed user data, which the server verifies before creating a session.
 * The bot's domain must be registered with @BotFather (/setdomain).
 */
function TelegramLoginWidget({ botUsername }: { botUsername: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram/callback`);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [botUsername]);

  return <div ref={containerRef} className="flex justify-center min-h-[40px]" />;
}
