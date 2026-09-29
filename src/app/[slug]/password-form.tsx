'use client';

import React, { useState } from 'react';
import { ArrowRight, KeyRound, Loader2 } from 'lucide-react';

export default function PasswordUnlockForm({
  slug,
  destinationUrl,
}: {
  slug: string;
  destinationUrl: string;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/links/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password }),
      });
      const data = await res.json();
      if (data.success && data.targetUrl) {
        window.location.href = data.targetUrl;
      } else {
        setError(data.error || 'Parol noto‘g‘ri. Qayta urinib ko‘ring.');
      }
    } catch {
      setError('Xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
          Parol
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolni kiriting..."
            required
            autoFocus
            className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
        {error && <p className="text-rose-400 text-xs mt-1.5 font-mono">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Tekshirilmoqda...</span>
          </>
        ) : (
          <>
            <span>Ochish va o‘tish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}
