'use client';

import React, { useState } from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';

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
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Parol
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolni kiriting..."
            required
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>
        {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-btn text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
      >
        <span>{loading ? 'Tekshirilmoqda...' : 'Ochish va o‘tish'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
