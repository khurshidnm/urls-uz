'use client';

import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth, type AuthView } from '@/lib/auth-context';

/** Steps inside a view: the form, then (sign-up) the emailed code, or (sign-in) the password reset. */
type Step = 'form' | 'code' | 'reset' | 'reset-code';

const input =
  'w-full px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500';
const label = 'block text-xs font-semibold text-slate-300 mb-1.5';
const primary =
  'w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-xl transition-all disabled:opacity-50';

async function postEmail(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

/**
 * The email part of the login window. Sign in: email (or login) + password,
 * with "forgot password". Sign up: name, email, password, then the emailed code.
 */
export default function EmailPanel({ view, emailAvailable }: { view: AuthView; emailAvailable: boolean }) {
  const { loginWithEmail, loginWithPassword, confirmEmailSignup } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [shownView, setShownView] = useState(view);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Switching between sign-in and sign-up starts that view from its first step
  if (shownView !== view) {
    setShownView(view);
    setStep('form');
    setError('');
    setNotice('');
    setCode('');
    setDevCode('');
    setPassword('');
    setRepeat('');
  }

  const email = identifier.trim().toLowerCase();
  const mismatch = repeat.length > 0 && repeat !== password;

  const goTo = (next: Step) => {
    setStep(next);
    setError('');
    setNotice('');
    setCode('');
    setDevCode('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (view === 'signin' && step === 'form') {
        // An address with "@" is an email account; anything else is a login
        const result = identifier.includes('@') ? await loginWithEmail(email, password) : await loginWithPassword(identifier.trim(), password);
        if (!result.ok) setError(result.error || 'Email yoki parol noto‘g‘ri');
      } else if (view === 'signup' && step === 'form') {
        const data = await postEmail({ action: 'signup', email, password, name });
        if (!data.success) return setError(data.error || 'Bajarilmadi');
        setDevCode(data.devCode || '');
        setStep('code');
      } else if (step === 'code') {
        const result = await confirmEmailSignup(email, code);
        if (!result.ok) setError(result.error || 'Kod noto‘g‘ri');
      } else if (step === 'reset') {
        const data = await postEmail({ action: 'reset-request', email });
        if (!data.success) return setError(data.error || 'Bajarilmadi');
        setDevCode(data.devCode || '');
        setStep('reset-code');
      } else {
        const data = await postEmail({ action: 'reset', email, code, password });
        if (!data.success) return setError(data.error || 'Kod noto‘g‘ri');
        goTo('form');
        setPassword('');
        setRepeat('');
        setNotice('Parol yangilandi. Endi yangi parol bilan kiring.');
      }
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Sign-up needs email delivery; without it, the window offers Google and Telegram only
  if (view === 'signup' && !emailAvailable) return null;

  const codeStep = step === 'code' || step === 'reset-code';
  const newPassword = (view === 'signup' && step === 'form') || step === 'reset-code';
  const buttonText =
    view === 'signin' && step === 'form' ? 'Kirish' : step === 'form' ? 'Ro‘yxatdan o‘tish' : step === 'code' ? 'Tasdiqlash' : step === 'reset' ? 'Tiklash kodini yuborish' : 'Parolni yangilash';

  return (
    <form onSubmit={submit} className="space-y-3.5">
      {step !== 'form' && (
        <button type="button" onClick={() => goTo('form')} className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white">
          <ArrowLeft className="w-3 h-3" /> Orqaga
        </button>
      )}

      {step === 'code' && (
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">{email}</strong> manziliga 6 xonali kod yuborildi. Xat kelmasa, «Spam» papkasini tekshiring.
        </p>
      )}
      {step === 'reset-code' && (
        <p className="text-xs text-slate-300 leading-relaxed">
          Agar <strong className="text-white">{email}</strong> bilan akkaunt bo‘lsa, unga 6 xonali kod yuborildi. Akkaunt Google orqali ochilgan bo‘lsa, xatda
          nima qilish kerakligi yozilgan. Xat kelmasa, «Spam» papkasini tekshiring.
        </p>
      )}
      {step === 'reset' && <p className="text-xs text-slate-400">Emailingizni kiriting: parolni tiklash kodi yuboriladi.</p>}

      {view === 'signup' && step === 'form' && (
        <div>
          <label htmlFor="auth-name" className={label}>Ismingiz</label>
          <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} className={input} />
        </div>
      )}

      {(step === 'form' || step === 'reset') && (
        <div>
          <label htmlFor="auth-email" className={label}>{view === 'signin' && step === 'form' ? 'Email yoki login' : 'Email'}</label>
          <input
            id="auth-email"
            type={view === 'signin' && step === 'form' ? 'text' : 'email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete={view === 'signin' ? 'username' : 'email'}
            autoCapitalize="none"
            required
            className={input}
          />
        </div>
      )}

      {codeStep && (
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

      {(step === 'form' || step === 'reset-code') && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="auth-password" className="text-xs font-semibold text-slate-300">{step === 'reset-code' ? 'Yangi parol' : 'Parol'}</label>
            {view === 'signin' && step === 'form' && emailAvailable && (
              <button type="button" onClick={() => goTo('reset')} className="text-[11px] text-indigo-400 hover:text-indigo-300">
                Parolni unutdingizmi?
              </button>
            )}
          </div>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={newPassword ? 'new-password' : 'current-password'}
            required
            minLength={newPassword ? 8 : 1}
            className={input}
          />
        </div>
      )}

      {newPassword && (
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
        disabled={loading || (newPassword && (mismatch || password.length < 8)) || (codeStep && code.length !== 6)}
        className={primary}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {buttonText}
      </button>
    </form>
  );
}
