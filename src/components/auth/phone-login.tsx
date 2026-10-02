'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Edit2, Loader2, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';

function formatUzbekPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = (digits.startsWith('998') ? digits.slice(3) : digits).slice(0, 9);
  let formatted = '+998';
  if (local.length > 0) formatted += ` (${local.slice(0, 2)}`;
  if (local.length >= 2) formatted += `) ${local.slice(2, 5)}`;
  if (local.length >= 5) formatted += `-${local.slice(5, 7)}`;
  if (local.length >= 7) formatted += `-${local.slice(7, 9)}`;
  return formatted;
}

/** Phone number + a code sent to the user's Telegram (Telegram Gateway). */
export default function PhoneLogin({ onBack }: { onBack: () => void }) {
  const { loginWithTelegram } = useAuth();
  const { tr, tm } = useLanguage();
  const [phone, setPhone] = useState('+998 ');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');

  // Countdown until the code can be resent
  useEffect(() => {
    if (!otpSent || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.replace(/\D/g, '').length < 12) {
      setError(tr('Iltimos, to‘liq 9 xonali telefon raqamingizni kiriting (+998 XX XXX XX XX)', 'Введите полный 9-значный номер (+998 XX XXX XX XX)', 'Enter your full 9-digit phone number (+998 XX XXX XX XX)'));
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
        setError(data.error || tr('Kod yuborishda xatolik yuz berdi', 'Не удалось отправить код', 'Couldn’t send the code'));
      }
    } catch {
      setError(tr('Tarmoq xatosi yuz berdi. Qayta urinib ko‘ring.', 'Ошибка сети. Попробуйте ещё раз.', 'Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    if (code.length < 5 || loading) return;
    setLoading(true);
    setError('');
    if (await loginWithTelegram(phone, code)) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else {
      setError(tr('Kiritilgan tasdiqlash kodi noto‘g‘ri. Qayta tekshirib ko‘ring.', 'Неверный код подтверждения. Проверьте ещё раз.', 'Wrong verification code. Please check it.'));
    }
    setLoading(false);
  };

  const errorBox = error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{tm(error)}</p>;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white">
        <ArrowLeft className="w-3 h-3" /> {tr('Boshqa usul bilan kirish', 'Другой способ входа', 'Use another method')}
      </button>

      {!otpSent ? (
        <form onSubmit={sendCode} className="space-y-3.5">
          <div>
            <label htmlFor="auth-phone" className="block text-xs font-semibold text-slate-300 mb-1.5">{tr('Telefon raqamingiz', 'Ваш номер телефона', 'Your phone number')}</label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.length < 4 ? '+998 ' : formatUzbekPhone(e.target.value));
                  setError('');
                }}
                placeholder="+998 (90) 123-45-67"
                required
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 font-mono tracking-wider"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{tr('Telegram akkauntingizga bog‘langan raqam: kod Telegram’ga keladi.', 'Номер, привязанный к Telegram: код придёт в Telegram.', 'The number linked to your Telegram: the code arrives in Telegram.')}</p>
          </div>
          {errorBox}
          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, '').length < 12}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {tr('Tasdiqlash kodini yuborish', 'Отправить код', 'Send code')}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify(otpCode);
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">{tr('Raqam', 'Номер', 'Number')}: </span>
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
              <Edit2 className="w-3 h-3" /> {tr('O‘zgartirish', 'Изменить', 'Change')}
            </button>
          </div>

          {demoCodeHint && (
            <button
              type="button"
              onClick={() => {
                setOtpCode(demoCodeHint);
                void verify(demoCodeHint);
              }}
              className="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {tr('Dev rejimi (Telegram Gateway sozlanmagan), kod', 'Режим разработки (Telegram Gateway не настроен), код', 'Dev mode (Telegram Gateway not set up), code')}: <strong className="font-mono">{demoCodeHint}</strong>
              </span>
            </button>
          )}

          <div>
            <label htmlFor="auth-phone-code" className="block text-xs font-semibold text-slate-300 mb-2 text-center">{tr('5 xonali tasdiqlash kodi', '5-значный код подтверждения', '5-digit verification code')}</label>
            <input
              id="auth-phone-code"
              type="text"
              maxLength={5}
              value={otpCode}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 5);
                setOtpCode(next);
                setError('');
                if (next.length === 5) void verify(next);
              }}
              placeholder="• • • • •"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 bg-[var(--surface-1)] border border-[var(--border-default)] focus:border-sky-500 rounded-xl text-white focus:outline-none"
            />
          </div>
          {errorBox}
          <button
            type="submit"
            disabled={loading || otpCode.length < 5}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {tr('Tasdiqlash va kirish', 'Подтвердить и войти', 'Confirm and sign in')}
          </button>
          <div className="text-center">
            {countdown > 0 ? (
              <span className="text-[11px] text-slate-500">
                {tr('Kodni qayta yuborish', 'Повторная отправка', 'Resend code in')}: <strong className="text-slate-400 font-mono">{countdown}s</strong>
              </span>
            ) : (
              <button type="button" onClick={() => sendCode()} className="text-[11px] text-sky-400 hover:text-sky-300 inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> {tr('Kodni qayta yuborish', 'Отправить код повторно', 'Resend code')}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
