'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, KeyRound, Loader2, Smartphone, Unlink } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { connectMessage } from './connect-message';

export interface LoginMethod {
  provider: 'google' | 'telegram' | 'phone' | 'password';
  providerId: string;
  label: string | null;
}

interface Props {
  methods: LoginMethod[];
  /** Result of connecting Google, which returns here from a redirect. */
  notice: { kind: 'success' | 'error'; text: string } | null;
  phoneLoginAvailable: boolean;
}

const PROVIDERS = [
  { id: 'google' as const, name: 'Google', hint: 'Google hisobingiz orqali kirish' },
  { id: 'telegram' as const, name: 'Telegram', hint: 'Telegram akkauntingiz orqali bir bosishda kirish' },
  { id: 'phone' as const, name: 'Telefon raqam', hint: 'Telegram’ga keladigan tasdiqlash kodi orqali kirish' },
  { id: 'password' as const, name: 'Login va parol', hint: 'Har safar Telegram yoki Google so‘ramasdan, login va parol bilan kirish' },
];

/**
 * The account's login methods. Connecting another one means Google,
 * Telegram and the phone number all open this same account.
 */
export default function LoginMethods({ methods, notice, phoneLoginAvailable }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [connecting, setConnecting] = useState<LoginMethod['provider'] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const done = (message: string) => {
    showToast('success', message);
    setConnecting(null);
    router.refresh();
  };

  const disconnect = async (method: LoginMethod) => {
    setBusy(method.provider + method.providerId);
    try {
      const res = await fetch('/api/auth/identities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: method.provider, providerId: method.providerId }),
      });
      const data = await res.json();
      if (!data.success) showToast('error', data.error || 'Uzib bo‘lmadi');
      else done('Kirish usuli uzildi');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div id="login-methods" className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <KeyRound className="w-4 h-4 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-white">Kirish usullari</h3>
          <p className="text-[11px] text-slate-400">Ulangan usullarning istalgani bilan shu bitta akkauntga kirasiz.</p>
        </div>
      </div>

      {notice && (
        <p
          className={`text-xs p-3 rounded-xl border flex gap-2 ${
            notice.kind === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}
        >
          {notice.kind === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notice.text}</span>
        </p>
      )}

      <ul className="divide-y divide-slate-800/80">
        {PROVIDERS.map((provider) => {
          const connected = methods.filter((m) => m.provider === provider.id);
          const unavailable = provider.id === 'phone' && !phoneLoginAvailable && connected.length === 0;
          return (
            <li key={provider.id} className="py-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">{provider.name}</div>
                  {connected.length > 0 ? (
                    connected.map((m) => (
                      <div key={m.providerId} className="flex items-center gap-2 mt-1 text-[11px] text-emerald-300/90">
                        <Check className="w-3 h-3 shrink-0" />
                        <span className="truncate">{m.label || 'Ulangan'}</span>
                        {m.provider === 'password' && connecting !== 'password' && (
                          <button
                            type="button"
                            onClick={() => setConnecting('password')}
                            className="ml-1 text-indigo-400 hover:text-indigo-300"
                          >
                            Parolni o‘zgartirish
                          </button>
                        )}
                        {methods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => disconnect(m)}
                            disabled={busy !== null}
                            className="ml-1 inline-flex items-center gap-1 text-slate-500 hover:text-rose-400 disabled:opacity-50"
                            aria-label={`${provider.name}ni uzish`}
                          >
                            <Unlink className="w-3 h-3" /> Uzish
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 mt-0.5">{unavailable ? 'Hozircha mavjud emas' : provider.hint}</div>
                  )}
                </div>
                {connected.length === 0 && !unavailable && connecting !== provider.id && (
                  provider.id === 'google' ? (
                    <button
                      type="button"
                      // Full-page redirect to Google; it comes back to this page
                      onClick={() => (window.location.href = '/api/auth/google?connect=1')}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold text-center"
                    >
                      Google’ni ulash
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConnecting(provider.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
                    >
                      {provider.id === 'password' ? 'Login va parol o‘rnatish' : `${provider.name}ni ulash`}
                    </button>
                  )
                )}
              </div>
              {connecting === 'telegram' && provider.id === 'telegram' && (
                <ConnectTelegram onDone={done} onCancel={() => setConnecting(null)} />
              )}
              {connecting === 'phone' && provider.id === 'phone' && <ConnectPhone onDone={done} onCancel={() => setConnecting(null)} />}
              {connecting === 'password' && provider.id === 'password' && (
                <PasswordForm currentLogin={connected[0]?.providerId ?? null} onDone={done} onCancel={() => setConnecting(null)} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

async function postTelegramAuth(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, connect: true }),
  });
  return res.json();
}

/**
 * Telegram Login Widget in callback mode: the signed data comes back to this
 * page and is posted together with the session, instead of a redirect.
 */
function ConnectTelegram({ onDone, onCancel }: { onDone: (message: string) => void; onCancel: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'urlsuzbot';
  // The widget is set up once; the latest callbacks are read through refs
  const onDoneRef = useRef(onDone);
  const showToastRef = useRef(showToast);
  useEffect(() => {
    onDoneRef.current = onDone;
    showToastRef.current = showToast;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = window as unknown as { onTelegramConnect?: (user: Record<string, unknown>) => void };
    w.onTelegramConnect = async (user) => {
      const data = await postTelegramAuth({ action: 'verify-widget', widgetData: user });
      if (data.success) onDoneRef.current(connectMessage('Telegram', data.outcome));
      else showToastRef.current('error', data.error || 'Telegram’ni ulab bo‘lmadi');
    };
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'medium');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-onauth', 'onTelegramConnect(user)');
    container.appendChild(script);
    return () => {
      container.innerHTML = '';
      delete w.onTelegramConnect;
    };
  }, [botUsername]);

  return (
    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
      <div ref={containerRef} className="min-h-[32px]" />
      <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white">
        Bekor qilish
      </button>
    </div>
  );
}

/** Phone number + Telegram verification code, added to this account. */
function ConnectPhone({ onDone, onCancel }: { onDone: (message: string) => void; onCancel: () => void }) {
  const { showToast } = useToast();
  const [phone, setPhone] = useState('+998 ');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postTelegramAuth({ action: 'send-otp', phone });
      if (!data.success) return showToast('error', data.error || 'Kod yuborib bo‘lmadi');
      setSent(true);
      setDevCode(data.demoCode || '');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postTelegramAuth({ action: 'verify-otp', phone, code });
      if (data.success) onDone(connectMessage('Telefon raqam', data.outcome));
      else showToast('error', data.error || 'Kod noto‘g‘ri');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const input = 'flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-indigo-500';
  return (
    <form onSubmit={sent ? verify : send} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
      <div className="flex gap-2">
        <Smartphone className="w-4 h-4 text-slate-500 mt-2 shrink-0" />
        {sent ? (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Tasdiqlash kodi"
            aria-label="Tasdiqlash kodi"
            inputMode="numeric"
            autoFocus
            className={input}
          />
        ) : (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" aria-label="Telefon raqam" autoFocus className={input} />
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {sent ? 'Tasdiqlash' : 'Kod yuborish'}
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white px-1">
          Bekor
        </button>
      </div>
      {devCode && <p className="text-[11px] text-amber-300/90">Dev rejimi (Telegram Gateway sozlanmagan): kod {devCode}</p>}
    </form>
  );
}

/**
 * Sets the login and password, or changes them (the current password is
 * asked for then). The password is typed twice to catch typos.
 */
function PasswordForm({ currentLogin, onDone, onCancel }: { currentLogin: string | null; onDone: (message: string) => void; onCancel: () => void }) {
  const { showToast } = useToast();
  const [login, setLogin] = useState(currentLogin ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const mismatch = repeat.length > 0 && repeat !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeat) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, ...(currentLogin && { currentPassword }) }),
      });
      const data = await res.json();
      if (data.success) onDone(currentLogin ? 'Login va parol yangilandi' : `Endi «${data.login}» login va parolingiz bilan kira olasiz`);
      else showToast('error', data.error || 'Saqlab bo‘lmadi');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500';
  return (
    <form onSubmit={submit} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>Login</span>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
            autoComplete="username"
            placeholder="masalan: hikmat_99"
            required
            minLength={3}
            className={`${input} font-mono`}
          />
        </label>
        {currentLogin && (
          <label className="text-[11px] text-slate-400 space-y-1">
            <span>Joriy parol</span>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required className={input} />
          </label>
        )}
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>{currentLogin ? 'Yangi parol' : 'Parol'}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className={input} />
        </label>
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>Parolni takrorlang</span>
          <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required className={input} />
        </label>
      </div>
      <p className={`text-[11px] ${mismatch ? 'text-rose-400' : 'text-slate-500'}`}>
        {mismatch ? 'Parollar mos emas' : 'Kamida 8 ta belgi. Login: 3–30 ta lotin harfi, raqam yoki _'}
      </p>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading || mismatch || password.length < 8 || login.length < 3} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Saqlash
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white px-1">
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
