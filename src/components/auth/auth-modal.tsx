'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { TelegramIcon } from '@/components/ui/icons';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithTelegram, loginWithGoogle, pendingUrl } = useAuth();
  const { locale } = useLanguage();

  const [authMethod, setAuthMethod] = useState<'telegram' | 'google'>('telegram');

  // Telegram OTP states
  const [phone, setPhone] = useState('+998 ');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');

  const handleSendTelegramOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      setError('Iltimos, to‘liq telefon raqamingizni kiriting');
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
        setDemoCodeHint(data.demoCode || '77701');
      } else {
        setError(data.error || 'Kod yuborishda xatolik yuz berdi');
      }
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTelegramOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('Iltimos, 5 xonali tasdiqlash kodini kiriting');
      return;
    }

    setLoading(true);
    setError('');

    const success = await loginWithTelegram(phone, otpCode);
    if (success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      resetForm();
    } else {
      setError('Kiritilgan kod noto‘g‘ri. Qayta urinib ko‘ring.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    // Initiate real Google OAuth 2.0 consent flow
    window.location.href = '/api/auth/google';
  };

  const handleDemoGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const success = await loginWithGoogle('khurshid.dev@gmail.com', 'Khurshid Nurmukhamedov');
    if (success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      resetForm();
    } else {
      setError('Google orqali kirishda xatolik yuz berdi');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setPhone('+998 ');
    setOtpSent(false);
    setOtpCode('');
    setError('');
    setDemoCodeHint('');
  };

  return (
    <Modal isOpen={isAuthModalOpen} onClose={closeAuthModal} title="" maxWidth="md">
      <div className="space-y-5 -mt-3">
        {/* Anti-Phishing Security Badge Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {locale === 'uz' ? 'Xavfsiz Tizimga Kirish' : locale === 'ru' ? 'Безопасный Вход' : 'Secure Authorization'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Fishing va soxta saytlar tarqalishining oldini olish uchun urls.uz orqali havola yaratish faqat tasdiqlangan foydalanuvchilar uchun ruxsat etiladi.
          </p>
        </div>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('telegram');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              authMethod === 'telegram'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TelegramIcon className="w-3.5 h-3.5 text-[#229ED9]" />
            <span>Telegram OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              authMethod === 'google'
                ? 'bg-indigo-600 text-white shadow-md'
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
        </div>

        {/* Telegram OTP Flow */}
        {authMethod === 'telegram' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendTelegramOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telefon raqamingiz
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ushbu raqamga Telegram orqali 5 xonali tasdiqlash kodi yuboriladi
                  </p>
                </div>

                {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#229ED9] hover:bg-[#1e8bc0] text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  <TelegramIcon className="w-4 h-4" />
                  <span>{loading ? 'Yuborilmoqda...' : 'Telegram orqali kod yuborish'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyTelegramOtp} className="space-y-4">
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-center">
                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-white">{phone}</span> raqamiga Telegram orqali kod yuborildi.
                  </p>
                  {demoCodeHint && (
                    <p className="text-[11px] text-emerald-400 font-mono font-bold mt-1">
                      Sinov kodi (Demo OTP): {demoCodeHint}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                    5 xonali tasdiqlash kodini kiriting:
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="77701"
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Raqamni o‘zgartirish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 flex items-center justify-center gap-2 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                  >
                    <span>{loading ? 'Tekshirilmoqda...' : 'Tasdiqlash & Kirish'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Google OAuth Flow */}
        {authMethod === 'google' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-slate-400">
              Google profilingiz orqali bir bosishda xavfsiz autentifikatsiyadan o‘ting:
            </p>

            {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</p>}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Kirilmoqda...' : 'Google hisobi bilan davom etish'}</span>
            </button>

            <button
              type="button"
              onClick={handleDemoGoogleLogin}
              className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2"
            >
              (Lokal sinov uchun: Tezkor demo profil bilan kirish)
            </button>
          </div>
        )}

        {/* Security footnote */}
        <div className="pt-3 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            ✉️ Email orqali kirish imkoniyati keyingi yangilanishda taqdim etiladi.
          </p>
        </div>
      </div>
    </Modal>
  );
}
