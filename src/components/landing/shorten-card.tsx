'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Link2, ArrowRight, Copy, Check, QrCode, Smartphone, Sparkles, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { QrCanvas } from '@/components/ui/qr-canvas';

export default function ShortenCard() {
  const { t, locale } = useLanguage();
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [openInApp, setOpenInApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortenedResult, setShortenedResult] = useState<{
    slug: string;
    shortUrl: string;
    originalUrl: string;
    qrUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: url,
          slug: customSlug || undefined,
          open_in_app: openInApp,
          title: customSlug || 'Guest Short Link',
        }),
      });

      const data = await res.json();
      if (data.success && data.link) {
        const fullShortUrl = `${window.location.origin}/${data.link.slug}`;
        setShortenedResult({
          slug: data.link.slug,
          shortUrl: fullShortUrl,
          originalUrl: data.link.destination_url,
          qrUrl: fullShortUrl,
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#6366f1', '#06b6d4', '#10b981'],
        });
      } else {
        setError(data.error || 'Xatolik yuz berdi. Qayta urinib ko‘ring.');
      }
    } catch {
      setError('Tarmoq xatosi. Iltimos qaytadan urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shortenedResult) return;
    await navigator.clipboard.writeText(shortenedResult.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative p-1 rounded-3xl bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-cyan-500/30 shadow-2xl backdrop-blur-xl">
        <div className="bg-slate-900/95 border border-white/10 rounded-[22px] p-5 sm:p-7 shadow-inner">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Input Row */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-5 h-5 text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.shortenPlaceholder}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-btn text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span>{loading ? '...' : t.shortenButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Options Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              {/* Custom Slug input */}
              <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">urls.uz/</span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder={locale === 'uz' ? 'maxsus-nom' : locale === 'ru' ? 'svoy-alias' : 'custom-alias'}
                  className="w-28 sm:w-36 bg-transparent text-white focus:outline-none placeholder:text-slate-600 font-medium"
                />
              </div>

              {/* Smart Deep Link Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={openInApp}
                  onChange={(e) => setOpenInApp(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.openInApp}</span>
                </span>
              </label>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}
          </form>

          {/* Success Shortened Result Card */}
          {shortenedResult && (
            <div className="mt-5 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-indigo-300/80 font-medium">{t.shortenedSuccess}</p>
                    <a
                      href={shortenedResult.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-white hover:text-indigo-300 flex items-center gap-1 truncate"
                    >
                      <span>{shortenedResult.shortUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t.copied : t.copy}</span>
                  </button>

                  <button
                    onClick={() => setShowQrModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Preview Modal */}
      {showQrModal && shortenedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowQrModal(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 z-10 text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Havola QR Kodi</h3>
            <p className="text-xs text-slate-400 mb-4">{shortenedResult.shortUrl}</p>
            <QrCanvas
              url={shortenedResult.shortUrl}
              size={240}
              fgColor="#0f172a"
              bgColor="#ffffff"
              centerLogo="telegram"
              frameText="SCAN ME"
              frameStyle="bottom"
            />
            <button
              onClick={() => setShowQrModal(false)}
              className="mt-4 px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
