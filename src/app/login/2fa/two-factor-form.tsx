'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';

export default function TwoFactorForm() {
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (value: string) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (data.success) {
        // A full navigation, so every part of the app sees the new session
        window.location.assign(data.redirect);
        return;
      }
      setError(data.error || 'Kod noto‘g‘ri');
      setCode('');
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(code);
      }}
      className="w-full max-w-sm bg-zinc-900/90 rounded-2xl p-7 border border-zinc-800 shadow-xl space-y-5 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mx-auto">
        {useRecovery ? <KeyRound className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
      </div>
      <div>
        <h1 className="text-lg font-semibold text-white">Ikki bosqichli tasdiqlash</h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          {useRecovery
            ? 'Saqlab qo‘ygan tiklash kodlaringizdan birini kiriting. Har bir kod bir marta ishlaydi.'
            : 'Google Authenticator (yoki boshqa autentifikator ilova)dagi 6 xonali kodni kiriting.'}
        </p>
      </div>

      {useRecovery ? (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="xxxxx-xxxxx"
          aria-label="Tiklash kodi"
          autoFocus
          autoComplete="one-time-code"
          className="w-full text-center tracking-widest text-lg font-mono py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none"
        />
      ) : (
        <input
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(next);
            if (next.length === 6) void submit(next);
          }}
          placeholder="• • • • • •"
          aria-label="Tasdiqlash kodi"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none"
        />
      )}

      {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</p>}

      <button
        type="submit"
        disabled={loading || code.length < 6}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Tasdiqlash va kirish
      </button>

      <div className="flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={() => {
            setUseRecovery(!useRecovery);
            setCode('');
            setError('');
          }}
          className="text-indigo-400 hover:text-indigo-300"
        >
          {useRecovery ? 'Ilovadagi koddan foydalanish' : 'Telefonim yo‘q — tiklash kodi'}
        </button>
        <Link href="/" className="text-zinc-500 hover:text-zinc-300">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
