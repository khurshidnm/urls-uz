'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Link2,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Loader2,
  ClipboardPaste,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Lock,
  Calendar,
  Tag,
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';
import { shortUrl as toShortUrl } from '@/lib/utils';
import { createPayload, EMPTY_LINK_FORM } from '@/components/links/link-form-model';
import { QrCanvas } from '@/components/ui/qr-canvas';

export default function ShortenCard() {
  const { t, locale } = useLanguage();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  // Advanced Options State
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [shortenedResult, setShortenedResult] = useState<{
    id: string;
    slug: string;
    shortUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Back from a redirect login (Google, Telegram): the server created the link; show it here
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('shortened');
    if (!id) return;
    // Clean address, so a reload doesn't show the result again
    window.history.replaceState(null, '', window.location.pathname);
    // Only the owner gets the link back, so the parameter can't show someone else's
    fetch(`/api/links/${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.link) return;
        setShortenedResult({ id: data.link.id, slug: data.link.slug, shortUrl: toShortUrl(data.link.slug) });
        document.getElementById('shorten')?.scrollIntoView({ block: 'center' });
      })
      .catch(() => {});
  }, []);
  const [showQrModal, setShowQrModal] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        showToast('info', 'URL xotiradan joylashtirildi');
      }
    } catch {
      showToast('error', 'Clipboard ruxsati berilmagan');
    }
  };

  const performShorten = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Same payload builder as the dashboard; UTM stays in its own fields so it can be edited later
      const payload = createPayload(
        {
          ...EMPTY_LINK_FORM,
          destination_url: targetUrl,
          password,
          expires_at: expiresAt,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        },
        'landing'
      );
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.link) {
        const fullShortUrl = toShortUrl(data.link.slug);
        setShortenedResult({ id: data.link.id, slug: data.link.slug, shortUrl: fullShortUrl });

        try {
          await navigator.clipboard.writeText(fullShortUrl);
          setCopied(true);
          showToast('copied', `${fullShortUrl} nusxalandi!`);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          showToast('success', 'Havola muvaffaqiyatli yaratildi!');
        }

      } else if (data.code === 'AUTH_REQUIRED') {
        openAuthModal(targetUrl.trim(), () => performShorten(targetUrl.trim()));
      } else {
        setError(data.error || "Xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    } catch {
      setError("Tarmoq xatosi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!user) {
      openAuthModal(url.trim(), () => performShorten(url.trim()));
      return;
    }

    await performShorten(url.trim());
  };

  const handleCopyLink = async (shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shortUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    showToast('copied', `${shortUrl} nusxalandi!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="shorten" className="w-full max-w-2xl mx-auto space-y-3 scroll-mt-24">
      {/* Omni-Shortener Command Bar (Linear/Vercel standard) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.5)] p-1.5 transition-all duration-150 focus-within:border-zinc-700">
        <form onSubmit={handleSubmit} className="space-y-1.5">
          {/* Main Input Row */}
          <div className="flex items-center gap-2 pl-3 pr-1 py-1">
            <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/url-slug-123..."
              required
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono"
            />

            {/* Paste Button Helper */}
            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded border border-zinc-700/60 transition-colors shrink-0"
                title="Vaqtinchalik xotiradan qo‘yish (Cmd+V)"
              >
                <ClipboardPaste className="w-3 h-3 text-zinc-500" />
                <span>Paste</span>
              </button>
            )}

            {/* Solid High-Contrast CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>{t.shortenButton}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-900" />
                </>
              )}
            </button>
          </div>

          {/* Quick Expandable Options Tray Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
              <span>{showOptions ? 'Yopish: Qo‘shimcha parametrlar' : '+ Qo‘shimcha parametrlar (UTM, Parol, Muddat)'}</span>
              {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <span className="text-zinc-500 hidden sm:inline">
              Avtomatik 5-belgili ID
            </span>
          </div>

          {/* Expandable Options Panel */}
          {showOptions && (
            <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 space-y-3 animate-fade-in text-xs">
              {/* UTM Tags Row */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1 mb-1.5">
                  <Tag className="w-3 h-3 text-zinc-500" />
                  <span>UTM Parametrlari (Marketing analitikasi)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="utm_source (telegram)"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 font-mono text-[11px] focus:outline-none focus:border-zinc-700"
                  />
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="utm_medium (cpc / bio)"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 font-mono text-[11px] focus:outline-none focus:border-zinc-700"
                  />
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="utm_campaign (spring_promo)"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 font-mono text-[11px] focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Password & Expiry Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1 mb-1">
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span>Himoya paroli (Ixtiyoriy)</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parol o‘rnating..."
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 font-mono text-[11px] focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>Amal qilish muddati (Ixtiyoriy)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded font-mono">
              {error}
            </p>
          )}
        </form>

        {/* Success Confirmation Bar */}
        {shortenedResult && (
          <div className="mt-2 p-3 rounded-lg bg-zinc-950 border border-emerald-500/30 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-zinc-400 text-[11px]">Yaratildi:</span>
                <a
                  href={shortenedResult.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-medium text-emerald-400 hover:underline truncate"
                >
                  {shortenedResult.shortUrl}
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyLink(shortenedResult.shortUrl)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-1 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700 rounded"
                  title="QR Kod"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={`/dashboard/links/${shortenedResult.id}`}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
                >
                  Boshqarish <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Meta Footer Note */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
        {user ? (
          <span className="flex items-center gap-1.5 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Foydalanuvchi: <strong className="text-zinc-200">{user.name}</strong></span>
          </span>
        ) : (
          <span>Qisqartirilgan havolalar avtomatik hisobingizga biriktiriladi</span>
        )}
        <span>HTTPS · Fishingdan himoya</span>
      </div>

      {/* Quick QR Code Modal */}
      {showQrModal && shortenedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Dinamik QR Kod</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QrCanvas value={shortenedResult.shortUrl} size={180} />
            </div>
            <div className="text-center">
              <p className="text-xs font-mono text-zinc-400 truncate">{shortenedResult.shortUrl}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
