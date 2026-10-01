'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Mode = 'signin' | 'signup' | 'signup-code' | 'reset' | 'reset-code';

const input =
  'w-full px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500';
const label = 'block text-xs font-semibold text-slate-300 mb-1.5';
const primary =
  'w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl transition-all disabled:opacity-50';

async function postEmail(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

/**
 * The login window's Email tab: sign in with email (or login) and password,
 * sign up with an emailed code, reset a forgotten password.
 * `emailAvailable`: codes can be sent (ZeptoMail configured, or development).
 */
export default function EmailPanel({ emailAvailable }: { emailAvailable: boolean }) {
  const { loginWithEmail, loginWithPassword, confirmEmailSignup } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = identifier.trim().toLowerCase();
  const mismatch = repeat.length > 0 && repeat !== password;

  const go = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setCode('');
    setDevCode('');
    if (next === 'signup' || next === 'reset' || next === 'signin') {
      setPassword('');
      setRepeat('');
    }
  };

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    setError('');
    try {
      await task();
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === 'signin') {
        // An address with "@" is an email account; anything else is a login
        const result = identifier.includes('@') ? await loginWithEmail(email, password) : await loginWithPassword(identifier.trim(), password);
        if (!result.ok) setError(result.error || 'Email yoki parol noto‘g‘ri');
      } else if (mode === 'signup') {
        const data = await postEmail({ action: 'signup', email, password, name });
        if (!data.success) return setError(data.error || 'Bajarilmadi');
        setDevCode(data.devCode || '');
        setMode('signup-code');
      } else if (mode === 'signup-code') {
        const result = await confirmEmailSignup(email, code);
        if (!result.ok) setError(result.error || 'Kod noto‘g‘ri');
      } else if (mode === 'reset') {
        const data = await postEmail({ action: 'reset-request', email });
        if (!data.success) return setError(data.error || 'Bajarilmadi');
        setDevCode(data.devCode || '');
        setMode('reset-code');
      } else {
        const data = await postEmail({ action: 'reset', email, code, password });
        if (!data.success) return setError(data.error || 'Kod noto‘g‘ri');
        go('signin');
        setNotice('Parol yangilandi. Endi yangi parol bilan kiring.');
      }
    });
  };

  const back = (
    <button type="button" onClick={() => go('signin')} className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white">
      <ArrowLeft className="w-3 h-3" /> Kirishga qaytish
    </button>
  );

  return (
    <form onSubmit={submit} className="space-y-3.5">
      {(mode === 'signup-code' || mode === 'reset-code') && (
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">{email}</strong> manziliga 6 xonali kod yuborildi. Xat kelmasa, «Spam» papkasini tekshiring.
        </p>
      )}

      {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
        <div>
          <label htmlFor="auth-email" className={label}>{mode === 'signin' ? 'Email yoki login' : 'Email'}</label>
          <input
            id="auth-email"
            type={mode === 'signin' ? 'text' : 'email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete={mode === 'signin' ? 'username' : 'email'}
            autoCapitalize="none"
            required
            className={input}
          />
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label htmlFor="auth-name" className={label}>Ismingiz</label>
          <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} className={input} />
        </div>
      )}

      {(mode === 'signup-code' || mode === 'reset-code') && (
        <div>
          <label htmlFor="auth-code" className={label}>Tasdiqlash kodi</label>
          <input
            id="auth-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="• • • • • •"
            className={`${input} text-center tracking-[0.5em] font-mono text-lg`}
          />
        </div>
      )}

      {(mode === 'signin' || mode === 'signup' || mode === 'reset-code') && (
        <div>
          <label htmlFor="auth-password" className={label}>{mode === 'reset-code' ? 'Yangi parol' : 'Parol'}</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'signin' ? 1 : 8}
            className={input}
          />
        </div>
      )}

      {(mode === 'signup' || mode === 'reset-code') && (
        <div>
          <label htmlFor="auth-password-repeat" className={label}>Parolni takrorlang</label>
          <input id="auth-password-repeat" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required className={input} />
          <p className={`mt-1 text-[11px] ${mismatch ? 'text-rose-400' : 'text-slate-500'}`}>{mismatch ? 'Parollar mos emas' : 'Kamida 8 ta belgi'}</p>
        </div>
      )}

      {devCode && <p className="text-[11px] text-amber-300/90">Dev rejimi (ZeptoMail sozlanmagan), kod: {devCode}</p>}
      {notice && <p className="text-xs text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{notice}</p>}
      {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</p>}

      <button
        type="submit"
        disabled={
          loading ||
          ((mode === 'signup' || mode === 'reset-code') && (mismatch || password.length < 8)) ||
          ((mode === 'signup-code' || mode === 'reset-code') && code.length !== 6)
        }
        className={primary}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        <span>
          {mode === 'signin' ? 'Kirish' : mode === 'signup' ? 'Kod yuborish' : mode === 'reset' ? 'Tiklash kodini yuborish' : mode === 'signup-code' ? 'Tasdiqlash va ro‘yxatdan o‘tish' : 'Parolni yangilash'}
        </span>
      </button>

      <div className="flex items-center justify-between text-[11px]">
        {mode === 'signin' ? (
          emailAvailable ? (
            <>
              <button type="button" onClick={() => go('signup')} className="text-indigo-400 hover:text-indigo-300 font-medium">
                Email bilan ro‘yxatdan o‘tish
              </button>
              <button type="button" onClick={() => go('reset')} className="text-slate-400 hover:text-white">
                Parolni unutdingizmi?
              </button>
            </>
          ) : (
            <span className="text-slate-500">Login va parol Sozlamalar → «Kirish usullari»da o‘rnatiladi.</span>
          )
        ) : (
          back
        )}
      </div>
    </form>
  );
}
