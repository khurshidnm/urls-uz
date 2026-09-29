'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/lib/language-context';
import {
  Link2,
  Sparkles,
  Smartphone,
  Shield,
  Clock,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateLinkModal({ isOpen, onClose, onCreated }: CreateLinkModalProps) {
  const { t, locale } = useLanguage();

  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [openInApp, setOpenInApp] = useState(true);

  // Advanced Accordions
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [showTargeting, setShowTargeting] = useState(false);
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');

  const [showSecurity, setShowSecurity] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [clickLimit, setClickLimit] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: destinationUrl,
          title: title || undefined,
          slug: customSlug || undefined,
          open_in_app: openInApp,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          ios_url: iosUrl || undefined,
          android_url: androidUrl || undefined,
          password: password || undefined,
          expires_at: expiresAt || undefined,
          click_limit: clickLimit ? parseInt(clickLimit) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });

        // Reset fields
        setDestinationUrl('');
        setTitle('');
        setCustomSlug('');
        setPassword('');
        setIosUrl('');
        setAndroidUrl('');
        onClose();
        if (onCreated) onCreated();
      } else {
        setError(data.error || 'Xatolik yuz berdi');
      }
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.createNewLink} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.destinationUrl} *
          </label>
          <div className="relative">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://t.me/kanal yoki https://sayt.uz/promo"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Title & Custom Slug Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.titleOptional}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan, Telegram Reklama"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.customSlug}
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2">
              <span className="text-slate-500 text-xs font-mono">urls.uz/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="promo2026"
                className="w-full pl-1 bg-transparent text-white text-sm focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Smart Deep Link Switch */}
        <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs font-semibold text-white">Smart Deep Link (Ilovada ochish)</div>
              <div className="text-[11px] text-slate-400">Telegram, Instagram, YouTube to‘g‘ridan-to‘g‘ri o‘rnatilgan ilovada ochiladi</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={openInApp}
            onChange={(e) => setOpenInApp(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
          />
        </div>

        {/* Accordion 1: UTM Parameters */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowUtm(!showUtm)}
            className="w-full px-4 py-2.5 bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{t.utmBuilder}</span>
            </span>
            {showUtm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showUtm && (
            <div className="p-3.5 bg-slate-950/90 grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">utm_source</label>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="telegram, google"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">utm_medium</label>
                <input
                  type="text"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="cpc, banner"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">utm_campaign</label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="bahor_chegirma"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Device Targeting */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTargeting(!showTargeting)}
            className="w-full px-4 py-2.5 bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{t.deviceTargeting}</span>
            </span>
            {showTargeting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showTargeting && (
            <div className="p-3.5 bg-slate-950/90 space-y-2.5 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">iOS uchun manzil (App Store yoki maxsus havola)</label>
                <input
                  type="text"
                  value={iosUrl}
                  onChange={(e) => setIosUrl(e.target.value)}
                  placeholder="https://apps.apple.com/app/..."
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Android uchun manzil (Google Play Store)</label>
                <input
                  type="text"
                  value={androidUrl}
                  onChange={(e) => setAndroidUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/..."
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Password & Expiration */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSecurity(!showSecurity)}
            className="w-full px-4 py-2.5 bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{t.passwordProtect} va Cheklovlar</span>
            </span>
            {showSecurity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showSecurity && (
            <div className="p-3.5 bg-slate-950/90 grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Parol (ixtiyoriy)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Maxfiy kod..."
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Amal qilish muddati</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Maksimal bosishlar soni</label>
                <input
                  type="number"
                  value={clickLimit}
                  onChange={(e) => setClickLimit(e.target.value)}
                  placeholder="Masalan, 500"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50"
          >
            {loading ? 'Yaratilmoqda...' : t.createNewLink}
          </button>
        </div>
      </form>
    </Modal>
  );
}
