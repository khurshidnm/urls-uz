'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ClientLink } from '@/lib/client-types';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';
import {
  Link2,
  Smartphone,
  Shield,
  Clock,
  Check,
  Loader2,
  QrCode,
  Globe,
  Hash,
  Eye,
  EyeOff,
  Zap,
  Target,
  Copy,
  ExternalLink,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { isValidSlug, isReservedSlug, copyToClipboard } from '@/lib/utils';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function detectApp(rawUrl: string): 'Telegram' | 'Instagram' | 'YouTube' | null {
  const url = rawUrl.toLowerCase().trim();
  if (url.includes('t.me/') || url.includes('telegram.me/')) return 'Telegram';
  if (url.includes('instagram.com/')) return 'Instagram';
  if (url.includes('youtube.com/') || url.includes('youtu.be/')) return 'YouTube';
  return null;
}

export default function CreateLinkModal({ isOpen, onClose, onCreated }: CreateLinkModalProps) {
  const { t, locale } = useLanguage();
  const { isSuperAdmin, demoEditMode } = useAuth();
  const { showToast } = useToast();

  // Core Fields
  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');

  // Feature Toggles & Fields
  const [openInApp, setOpenInApp] = useState(false);
  const [enableDeviceTargeting, setEnableDeviceTargeting] = useState(false);
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');
  const [huaweiUrl, setHuaweiUrl] = useState('');
  const [desktopUrl, setDesktopUrl] = useState('');

  // Protection Accordion
  const [enableProtection, setEnableProtection] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  // Marketing UTM Accordion
  const [enableUtm, setEnableUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState<{ slug: string; shortUrl: string } | null>(null);
  // Result of the last server availability check, keyed by the slug it was for
  const [remoteSlugCheck, setRemoteSlugCheck] = useState<{ slug: string; available?: boolean; message?: string } | null>(null);
  // Captured once per mount: "now" for the past-date check without reading the clock during render
  const [openedAt] = useState(() => Date.now());

  // Plan Quotas & Limits
  const [activeLinksCount, setActiveLinksCount] = useState<number>(0);
  const [deepLinksCount, setDeepLinksCount] = useState<number>(0);
  const [deviceTargetingCount, setDeviceTargetingCount] = useState<number>(0);

  const FREE_PLAN_LIMIT = 10;
  const isTotalLimitReached = activeLinksCount >= FREE_PLAN_LIMIT;
  const isDeepLinkLimitReached = deepLinksCount >= 1;
  const isDeviceTargetingLimitReached = deviceTargetingCount >= 1;

  // Fetch real-time active link statistics
  useEffect(() => {
    if (isOpen) {
      fetch('/api/links')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.links)) {
            const active = (data.links as ClientLink[]).filter((l) => !l.is_archived);
            setActiveLinksCount(active.length);
            setDeepLinksCount(active.filter((l) => l.open_in_app).length);
            setDeviceTargetingCount(
              active.filter((l) => Boolean(l.ios_url || l.android_url || l.huawei_url || l.desktop_url)).length
            );
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Intelligent URL detection (Telegram / Instagram)
  const detectedApp = useMemo(() => detectApp(destinationUrl), [destinationUrl]);

  // Auto-suggest Smart Deep link when a Telegram/Instagram/YouTube URL is first typed
  const handleDestinationChange = (value: string) => {
    const nextApp = detectApp(value);
    if (nextApp && nextApp !== detectedApp && !isDeepLinkLimitReached) {
      setOpenInApp(true);
    }
    setDestinationUrl(value);
  };

  // Live slug validation: format rules are checked locally, availability on the server
  const trimmedSlug = customSlug.trim().toLowerCase();
  const localSlugError = !trimmedSlug
    ? null
    : isReservedSlug(trimmedSlug)
      ? 'Ushbu slug tizim tomonidan band qilingan'
      : !isValidSlug(trimmedSlug)
        ? 'Slug 3–50 ta belgi (faqat harf, raqam, tire yoki tagchiziq) bo‘lishi lozim'
        : null;

  useEffect(() => {
    if (!trimmedSlug || localSlugError) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-slug?slug=${encodeURIComponent(trimmedSlug)}`);
        const data = await res.json();
        setRemoteSlugCheck({ slug: trimmedSlug, available: data.available, message: data.message });
      } catch {
        setRemoteSlugCheck({ slug: trimmedSlug });
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [trimmedSlug, localSlugError]);

  const slugStatus: { checking: boolean; available?: boolean; message?: string } = !trimmedSlug
    ? { checking: false }
    : localSlugError
      ? { checking: false, available: false, message: localSlugError }
      : remoteSlugCheck?.slug === trimmedSlug
        ? { checking: false, available: remoteSlugCheck.available, message: remoteSlugCheck.message }
        : { checking: true };

  const isExpiredDate = expiresAt ? new Date(expiresAt).getTime() <= openedAt : false;

  const resetForm = useCallback(() => {
    setDestinationUrl('');
    setTitle('');
    setCustomSlug('');
    setRemoteSlugCheck(null);
    setOpenInApp(false);
    setEnableDeviceTargeting(false);
    setIosUrl('');
    setAndroidUrl('');
    setHuaweiUrl('');
    setDesktopUrl('');
    setEnableProtection(false);
    setPassword('');
    setShowPassword(false);
    setExpiresAt('');
    setEnableUtm(false);
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmContent('');
    setError('');
    setCreatedLink(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl.trim()) return;

    if (isTotalLimitReached) {
      setError(`Bepul tarif limiti to‘lgan (${activeLinksCount}/${FREE_PLAN_LIMIT}). Yangi havola yaratish uchun eskilarini arxivlang yoki o‘chiring.`);
      return;
    }

    if (openInApp && isDeepLinkLimitReached) {
      setError('Bepul tarifda faqat 1 dona Smart Deep Link yaratish mumkin (1/1 to‘lgan).');
      return;
    }

    if (enableDeviceTargeting && isDeviceTargetingLimitReached) {
      setError('Bepul tarifda faqat 1 dona qurilmalarni aniqlaydigan havola yaratish mumkin (1/1 to‘lgan).');
      return;
    }

    if (customSlug && !isValidSlug(customSlug)) {
      setError(
        isReservedSlug(customSlug)
          ? 'Ushbu slug tizim tomonidan band qilingan. Boshqa nom tanlang.'
          : 'Slug kamida 3 ta belgidan iborat bo‘lishi lozim.'
      );
      return;
    }

    if (customSlug && slugStatus.available === false) {
      setError(slugStatus.message || 'Ushbu slug band qilingan yoki yaroqsiz');
      return;
    }

    if (enableProtection && isExpiredDate) {
      setError("Amal qilish muddati kelajakdagi vaqt bo‘lishi lozim.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // The server decides the owner from the session (and the admin's demo-edit mode)
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: destinationUrl,
          slug: customSlug.trim() || undefined,
          title: title.trim() || undefined,
          open_in_app: openInApp,
          ios_url: enableDeviceTargeting && iosUrl.trim() ? iosUrl.trim() : undefined,
          android_url: enableDeviceTargeting && androidUrl.trim() ? androidUrl.trim() : undefined,
          huawei_url: enableDeviceTargeting && huaweiUrl.trim() ? huaweiUrl.trim() : undefined,
          desktop_url: enableDeviceTargeting && desktopUrl.trim() ? desktopUrl.trim() : undefined,
          password: enableProtection && password.trim() ? password.trim() : undefined,
          // datetime-local has no timezone; send the user's local time as an absolute instant
          expires_at: enableProtection && expiresAt ? new Date(expiresAt).toISOString() : undefined,
          utm_source: enableUtm && utmSource.trim() ? utmSource.trim() : undefined,
          utm_medium: enableUtm && utmMedium.trim() ? utmMedium.trim() : undefined,
          utm_campaign: enableUtm && utmCampaign.trim() ? utmCampaign.trim() : undefined,
          utm_content: enableUtm && utmContent.trim() ? utmContent.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.link) {
        const shortUrl = `${window.location.origin}/${data.link.slug}`;
        setCreatedLink({ slug: data.link.slug, shortUrl });

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#06b6d4', '#10b981'],
        });

        showToast('success', 'Havola muvaffaqiyatli yaratildi!');
        await copyToClipboard(shortUrl);
        showToast('copied', `${shortUrl} nusxalandi!`);

        if (onCreated) onCreated();
      } else {
        setError(data.error || 'Havolani yaratishda xatolik yuz berdi');
      }
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Yangi Qisqa Havola Yaratish
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                {isSuperAdmin && demoEditMode ? (
                  <span className="px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    🛡️ Demo Havolasi Yaratilmoqda (ApexTech Solutions)
                  </span>
                ) : (
                  <>
                    <span className="text-zinc-400">Bepul tarif:</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold ${
                        isTotalLimitReached
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {activeLinksCount}/10 havola
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">Deep Link: {deepLinksCount}/1</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Yopish (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {createdLink ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">Havolangiz tayyor!</h3>
              <p className="text-xs text-zinc-400">
                Havola muvaffaqiyatli qisqartirildi va xotiraga nusxalandi
              </p>
            </div>

            {/* Link Copy Box */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 max-w-lg mx-auto">
              <span className="text-base font-mono font-bold text-indigo-400 truncate">
                {createdLink.shortUrl}
              </span>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyToClipboard(createdLink.shortUrl);
                  if (ok) showToast('copied', 'Nusxalandi!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nusxalash</span>
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              <QrCanvas
                url={createdLink.shortUrl}
                size={180}
                fgColor="#09090b"
                bgColor="#ffffff"
                bodyShape="rounded"
                eyeFrameShape="rounded"
                showControls={false}
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white transition-colors"
              >
                Yana yaratish
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors"
              >
                Tayyor (Yopish)
              </button>
            </div>
          </div>
        ) : (
          /* LINK CREATION FORM */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Limit Alert Banner if total 10 reached */}
              {isTotalLimitReached && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">
                      Bepul tarif limiti: {activeLinksCount} / {FREE_PLAN_LIMIT} ta faol havola to‘lgan
                    </p>
                    <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                      Siz bepul tarifdagi 10 ta havola chegarasiga yetdingiz. Yangi havola yaratish uchun mavjud havolalarni arxivlang yoki o‘chiring. Cheksiz havolalar <strong>Pro tarifda tez kunda</strong> chiqadi!
                    </p>
                  </div>
                </div>
              )}

              {/* 1. PRIMARY SECTION: Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Qisqartiriladigan asl havola manzili (Destination URL) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destinationUrl}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    placeholder="https://t.me/kanal, instagram.com/post yoki sayt.uz/promo"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Intelligent Detection Notice */}
                {detectedApp && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>💡 {detectedApp} aniqlandi — Smart Deep Link tavsiya etiladi (ilovada ochiladi)</span>
                  </div>
                )}
              </div>

              {/* 2. CUSTOM SLUG & TITLE (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Maxsus Qisqa Nom (Slug)
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Ixtiyoriy</span>
                  </div>

                  <div
                    className={`flex items-center rounded-xl bg-zinc-900 border px-3 py-2 text-xs font-mono transition-colors ${
                      customSlug && slugStatus.available === true
                        ? 'border-emerald-500/60'
                        : customSlug && slugStatus.available === false
                        ? 'border-rose-500/60'
                        : 'border-zinc-800 focus-within:border-zinc-600'
                    }`}
                  >
                    <span className="text-zinc-500 shrink-0 select-none">urls.uz/</span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) =>
                        setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                      }
                      placeholder="promo-2026"
                      className="w-full bg-transparent text-white focus:outline-none pl-0.5"
                    />
                    {slugStatus.checking && <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin shrink-0" />}
                    {!slugStatus.checking && customSlug && slugStatus.available === true && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {customSlug && (
                    <div className="mt-1 text-[11px] font-mono">
                      {slugStatus.available === true && (
                        <span className="text-emerald-400">✓ Ushbu slug bo‘sh va foydalanishga tayyor</span>
                      )}
                      {slugStatus.available === false && (
                        <span className="text-rose-400">{slugStatus.message || 'Band qilingan'}</span>
                      )}
                    </div>
                  )}

                  {!customSlug && (
                    <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                      Bo‘sh qolsa: avtomatik 5-belgili ID beriladi
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Sarlavha (Eslatma)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Telegram Reklama posti"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                    Dashboardda qulay topish uchun
                  </span>
                </div>
              </div>

              {/* 3. MODULAR FEATURE CARDS */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                  Qo‘shimcha Imkoniyatlar & Sozlamalar
                </span>

                {/* FEATURE 1: SMART DEEP LINK (1 MAX IN FREE) */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    openInApp
                      ? 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-zinc-900/40 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">Smart Deep Link</h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              isDeepLinkLimitReached && !openInApp
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                            }`}
                          >
                            {isDeepLinkLimitReached ? '1/1 ishlatilgan' : 'Bepul: 1 dona (0/1)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          Telegram yoki Instagram havolasini smartfon ilovasida to‘g‘ridan-to‘g‘ri ochadi
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={openInApp}
                        disabled={isDeepLinkLimitReached && !openInApp}
                        onChange={(e) => setOpenInApp(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-40"></div>
                    </label>
                  </div>

                  {isDeepLinkLimitReached && !openInApp && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] font-mono text-amber-300/80 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Sizda allaqachon 1 ta Deep Link mavjud (1/1 to‘lgan). Pro tarifda cheksiz bo‘ladi.</span>
                    </div>
                  )}
                </div>

                {/* FEATURE 2: DEVICE TARGETING (1 MAX IN FREE, 100 CLICKS CAP) */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    enableDeviceTargeting
                      ? 'bg-purple-950/20 border-purple-500/40'
                      : 'bg-zinc-900/40 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">Qurilmalar Bo‘yicha Yo‘naltirish</h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              isDeviceTargetingLimitReached && !enableDeviceTargeting
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {isDeviceTargetingLimitReached
                              ? '1/1 ishlatilgan'
                              : 'Bepul: 1 dona · 100 klik/kun'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          iPhone (iOS), Android, HarmonyOS (Huawei) va Kompyuterlarni turli do‘kon va ilovalarga yo‘naltirish
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={enableDeviceTargeting}
                        disabled={isDeviceTargetingLimitReached && !enableDeviceTargeting}
                        onChange={(e) => setEnableDeviceTargeting(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-40"></div>
                    </label>
                  </div>

                  {/* Expanded Device Inputs */}
                  {enableDeviceTargeting && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in text-xs font-mono">
                      {/* 1. AUTO-SYNCED READ-ONLY FALLBACK URL */}
                      <div className="p-3 rounded-xl bg-zinc-950/90 border border-indigo-500/30 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Asosiy Fallback URL (Zaxira havola)</span>
                          </label>
                          <span className="text-[10px] text-indigo-300/90 font-mono flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            <Lock className="w-3 h-3 text-indigo-400" /> Read-only (Avto-bog‘langan)
                          </span>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={destinationUrl || ''}
                          placeholder="Avval yuqoridagi Asosiy URL (Target URL) ni kiriting"
                          className="w-full px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-300 text-xs font-mono cursor-not-allowed select-all focus:outline-none"
                        />
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                          💡 <span className="font-semibold text-zinc-300">Qoida:</span> Yuqoridagi Asosiy URL o‘zgarsa, bu zaxira havola ham avtomatik o‘zgaradi. Agar tashrif buyuruvchining qurilmasi uchun maxsus havola kiritilmagan bo‘lsa yoki havola ochilmasa, avtomatik mana shu asosiy URL ochiladi.
                        </p>
                      </div>

                      {/* 2. APPLE IOS */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-zinc-300 font-medium">
                            🍎 Apple iOS (App Store yoki Universal Link)
                          </label>
                          <span className="text-[9px] text-zinc-500">Bo‘sh qolsa: Fallback URL</span>
                        </div>
                        <input
                          type="text"
                          value={iosUrl}
                          onChange={(e) => setIosUrl(e.target.value)}
                          placeholder="https://apps.apple.com/app/id..."
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
                        />
                      </div>

                      {/* 3. GOOGLE ANDROID */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-zinc-300 font-medium">
                            🤖 Google Android (Play Store yoki App Link)
                          </label>
                          <span className="text-[9px] text-zinc-500">Bo‘sh qolsa: Fallback URL</span>
                        </div>
                        <input
                          type="text"
                          value={androidUrl}
                          onChange={(e) => setAndroidUrl(e.target.value)}
                          placeholder="https://play.google.com/store/apps/..."
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
                        />
                      </div>

                      {/* 4. HUAWEI / HARMONYOS */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-zinc-300 font-medium">
                            🔴 Huawei / HarmonyOS (AppGallery yoki App havolasi)
                          </label>
                          <span className="text-[9px] text-zinc-500">Bo‘sh qolsa: Fallback URL</span>
                        </div>
                        <input
                          type="text"
                          value={huaweiUrl}
                          onChange={(e) => setHuaweiUrl(e.target.value)}
                          placeholder="https://appgallery.huawei.com/app/C... yoki appmarket://..."
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
                        />
                      </div>

                      {/* 5. DESKTOP / PC */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-zinc-300 font-medium">
                            💻 Kompyuter (Desktop Web — ixtiyoriy)
                          </label>
                          <span className="text-[9px] text-zinc-500">Bo‘sh qolsa: Fallback URL</span>
                        </div>
                        <input
                          type="text"
                          value={desktopUrl}
                          onChange={(e) => setDesktopUrl(e.target.value)}
                          placeholder="https://sayt.uz/desktop (ixtiyoriy alohida sayt)"
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
                        />
                      </div>

                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-300 text-[10px] leading-relaxed">
                        ℹ️ Bepul tarifda qurilmalarni aniqlovchi havola uchun kunlik 100 klik limiti avtomatik o‘rnatiladi.
                      </div>
                    </div>
                  )}

                  {isDeviceTargetingLimitReached && !enableDeviceTargeting && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] font-mono text-amber-300/80 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Sizda allaqachon 1 ta qurilma yo‘naltiruvchi havola mavjud (1/1 to‘lgan).</span>
                    </div>
                  )}
                </div>

                {/* FEATURE 3: XAVFSIZLIK & MUDDAT (Accordion) */}
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                  <div
                    onClick={() => setEnableProtection(!enableProtection)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Xavfsizlik & Muddat</h4>
                        <p className="text-[11px] text-zinc-400">
                          Havolaga parol o‘rnatish va amal qilish muddatini cheklash
                        </p>
                      </div>
                    </div>
                    {enableProtection ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>

                  {enableProtection && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Password */}
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            Parol bilan himoyalash
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Maxfiy kod..."
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs pr-8 focus:outline-none focus:border-zinc-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expiration Date */}
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            Amal qilish muddati (Tugash sanasi)
                          </label>
                          <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* FEATURE 4: MARKETING UTM (Accordion) */}
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                  <div
                    onClick={() => setEnableUtm(!enableUtm)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Marketing & UTM Teglar</h4>
                        <p className="text-[11px] text-zinc-400">
                          Google Ads, Telegram va Instagram reklama kampaniyalari uchun parametrlar
                        </p>
                      </div>
                    </div>
                    {enableUtm ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>

                  {enableUtm && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in font-mono text-xs">
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-zinc-500 py-1">Shablonlar:</span>
                        {[
                          { l: '⚡ Google Ads', s: 'google', m: 'cpc', c: 'search' },
                          { l: '📢 Telegram', s: 'telegram', m: 'channel', c: 'post' },
                          { l: '📸 Instagram', s: 'instagram', m: 'story', c: 'bio' },
                          { l: '🎵 TikTok', s: 'tiktok', m: 'video', c: 'promo' },
                        ].map((p) => (
                          <button
                            key={p.l}
                            type="button"
                            onClick={() => {
                              setUtmSource(p.s);
                              setUtmMedium(p.m);
                              setUtmCampaign(p.c);
                            }}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                          >
                            {p.l}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                          placeholder="utm_source"
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                          placeholder="utm_medium"
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                          placeholder="utm_campaign"
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={utmContent}
                          onChange={(e) => setUtmContent(e.target.value)}
                          placeholder="utm_content"
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {error ? (
                <div className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 font-mono hidden sm:block">
                  urls.uz tezkor Anycast serverlari orqali himoyalangan
                </div>
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  disabled={loading || isTotalLimitReached}
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Yaratilmoqda...</span>
                    </>
                  ) : isTotalLimitReached ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Limit to‘lgan (10/10) · Pro tez kunda</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Qisqa havola yaratish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
