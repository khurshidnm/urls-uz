'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  Smartphone,
  Shield,
  Clock,
  Layers,
  Check,
  Loader2,
  QrCode,
  Globe,
  Hash,
  Eye,
  EyeOff,
  Zap,
  Tag,
  Target,
  Copy,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { isValidSlug, isReservedSlug, copyToClipboard } from '@/lib/utils';

interface CreateLinkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type TabId = 'general' | 'utm' | 'protection' | 'qr';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

export default function CreateLinkDrawer({ isOpen, onClose, onCreated }: CreateLinkDrawerProps) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('general');

  // General Tab
  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [tags, setTags] = useState('');
  const [openInApp, setOpenInApp] = useState(false);

  // UTM Tab
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Protection Tab
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [clickLimit, setClickLimit] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');
  const [huaweiUrl, setHuaweiUrl] = useState('');
  const [desktopUrl, setDesktopUrl] = useState('');

  // QR Tab
  const [qrFg, setQrFg] = useState('#0f172a');
  const [qrBg, setQrBg] = useState('#ffffff');
  const [qrLogo, setQrLogo] = useState<'telegram' | 'none'>('telegram');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState<{slug: string; shortUrl: string} | null>(null);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Debounced live verification of custom slug availability
  useEffect(() => {
    const trimmed = customSlug.trim().toLowerCase();
    if (!trimmed) {
      setSlugStatus({ checking: false });
      return;
    }

    if (isReservedSlug(trimmed)) {
      setSlugStatus({
        checking: false,
        available: false,
        message: 'Ushbu slug tizim tomonidan band qilingan (Reserved path)',
      });
      return;
    }

    if (!isValidSlug(trimmed)) {
      setSlugStatus({
        checking: false,
        available: false,
        message: 'Slug 3–50 ta belgi (faqat harf, raqam, tire yoki tagchiziq) bo‘lishi lozim',
      });
      return;
    }

    setSlugStatus({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-slug?slug=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSlugStatus({
          checking: false,
          available: data.available,
          message: data.message,
        });
      } catch {
        setSlugStatus({ checking: false });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [customSlug]);

  const isExpiredDate = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;

  const resetForm = useCallback(() => {
    setDestinationUrl('');
    setTitle('');
    setCustomSlug('');
    setSlugStatus({ checking: false });
    setTags('');
    setOpenInApp(false);
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
    setPassword('');
    setExpiresAt('');
    setClickLimit('');
    setIosUrl('');
    setAndroidUrl('');
    setHuaweiUrl('');
    setDesktopUrl('');
    setError('');
    setCreatedLink(null);
    setActiveTab('general');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) return;

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

    if (isExpiredDate) {
      setError("Amal qilish muddati kelajakdagi vaqt bo‘lishi lozim (o‘tib ketgan sana belgilangan).");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo_user',
        },
        body: JSON.stringify({
          user_id: user?.id || 'demo_user',
          destination_url: destinationUrl,
          slug: customSlug.trim() || undefined,
          title: title || undefined,
          tags: tags.trim() || undefined,
          open_in_app: openInApp,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          utm_term: utmTerm || undefined,
          utm_content: utmContent || undefined,
          ios_url: iosUrl || undefined,
          android_url: androidUrl || undefined,
          huawei_url: huaweiUrl || undefined,
          desktop_url: desktopUrl || undefined,
          password: password || undefined,
          expires_at: expiresAt || undefined,
          click_limit: clickLimit ? parseInt(clickLimit) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const shortUrl = `${window.location.origin}/${data.link.slug}`;
        setCreatedLink({ slug: data.link.slug, shortUrl });

        confetti({
          particleCount: 50,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#06b6d4', '#10b981'],
        });

        showToast('success', 'Havola muvaffaqiyatli yaratildi!');

        // Auto-copy to clipboard with universal fallback
        const ok = await copyToClipboard(shortUrl);
        if (ok) {
          showToast('copied', `${shortUrl} nusxalandi!`);
        }

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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const tabs: TabItem[] = [
    { id: 'general', label: locale === 'uz' ? 'Asosiy' : 'General', icon: <Link2 className="w-3.5 h-3.5" /> },
    { id: 'utm', label: 'UTM', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'protection', label: locale === 'uz' ? 'Himoya' : 'Protection', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'qr', label: 'QR Code', icon: <QrCode className="w-3.5 h-3.5" /> },
  ];

  const utmPresets = [
    { label: '⚡ Google Ads', source: 'google', medium: 'cpc', campaign: 'search_promo' },
    { label: '📱 Telegram Kanal', source: 'telegram', medium: 'channel', campaign: 'post_link' },
    { label: '📸 Instagram / Meta', source: 'instagram', medium: 'social_story', campaign: 'bio_traffic' },
    { label: '✉️ Email Newsletter', source: 'newsletter', medium: 'email', campaign: 'weekly_digest' },
    { label: '🎵 TikTok Promo', source: 'tiktok', medium: 'video', campaign: 'influencer' },
    { label: '🧹 Tozalash', source: '', medium: '', campaign: '' },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={t.createNewLink}
      subtitle={locale === 'uz' ? 'Yangi qisqa havola, UTM, QR va himoya sozlamalari' : 'Create a new short link with UTM, QR and protection'}
      width="lg"
    >
      {/* Success State */}
      {createdLink ? (
        <div className="space-y-6 animate-fade-in-up">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/25">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t.shortenedSuccess}</h3>
            <p className="text-xs text-slate-400">Havola avtomatik nusxalandi</p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <a
                href={createdLink.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-indigo-300 hover:text-indigo-200 font-mono flex items-center gap-1.5 transition-colors"
              >
                {createdLink.shortUrl}
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(createdLink.shortUrl);
                  if (ok) showToast('copied', 'Nusxalandi!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copy}</span>
              </button>
            </div>
          </div>

          {/* QR Preview */}
          <div className="flex justify-center p-6 bg-white rounded-2xl">
            <QrCanvas
              url={createdLink.shortUrl}
              size={200}
              fgColor={qrFg}
              bgColor={qrBg}
              centerLogo={qrLogo}
              frameText="SCAN ME"
              frameStyle="bottom"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
              }}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-xl border border-[var(--border-subtle)] transition-colors"
            >
              Yana yaratish
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-gradient-btn rounded-xl transition-all"
            >
              Yopish
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tab Bar */}
          <div className="flex bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              {/* Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.destinationUrl} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://t.me/kanal yoki https://sayt.uz/promo"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                {destinationUrl && !destinationUrl.includes('.') && (
                  <p className="text-[11px] text-amber-400 mt-1 font-mono">
                    Haqiqiy domen kiriting (masalan: sayt.uz yoki https://sayt.uz)
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {t.titleOptional}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan, Telegram Reklama"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Custom Slug Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Maxsus Qisqa Slug (Ixtiyoriy)
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">Bo‘sh qolsa: avtomatik 5-belgi</span>
                </div>
                <div className={`flex items-center rounded-lg bg-zinc-950 border px-3 py-2 transition-colors ${
                  customSlug && slugStatus.available === true
                    ? 'border-emerald-500/50 focus-within:border-emerald-500'
                    : customSlug && slugStatus.available === false
                    ? 'border-rose-500/50 focus-within:border-rose-500'
                    : 'border-zinc-800 focus-within:border-zinc-500'
                }`}>
                  <span className="text-xs font-mono text-zinc-500 shrink-0 select-none">urls.uz/</span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="promo-2026"
                    className="w-full bg-transparent text-xs text-white font-mono focus:outline-none pl-1"
                  />
                  {slugStatus.checking && (
                    <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin shrink-0" />
                  )}
                  {!slugStatus.checking && customSlug && slugStatus.available === true && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>

                {/* Inline Feedback */}
                {customSlug && (
                  <div className="mt-1.5 font-mono text-[11px]">
                    {slugStatus.checking ? (
                      <span className="text-zinc-500">Slug mavjudligi tekshirilmoqda...</span>
                    ) : slugStatus.available === true ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Slug mavjud va foydalanish mumkin
                      </span>
                    ) : slugStatus.available === false ? (
                      <span className="text-rose-400">
                        {slugStatus.message || 'Ushbu slug band qilingan'}
                      </span>
                    ) : null}
                  </div>
                )}

                {!customSlug && (
                  <div className="mt-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <Hash className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>Noyob 5-belgili Base62 qisqa ID avtomatik tarzda yaratiladi.</span>
                  </div>
                )}
              </div>

              {/* Tags Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Teglar (Tags)
                  </label>
                  <span className="text-[10px] text-slate-500">Vergul bilan ajrating</span>
                </div>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="masalan: telegram, promo, marketing"
                  className="w-full px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-500">Tavsiya etilgan:</span>
                  {['telegram', 'instagram', 'promo', 'ads', 'bio'].map((tagItem) => (
                    <button
                      key={tagItem}
                      type="button"
                      onClick={() => {
                        const current = tags ? tags.split(',').map((t) => t.trim()) : [];
                        if (!current.includes(tagItem)) {
                          setTags(current.length > 0 ? `${tags}, ${tagItem}` : tagItem);
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-300 hover:text-white text-[10px] font-medium border border-[var(--border-subtle)] transition-colors"
                    >
                      +{tagItem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Deep Link Toggle */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Smart Deep Link</div>
                    <div className="text-[11px] text-slate-400">Telegram, Instagram — ilovada ochish</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openInApp}
                    onChange={(e) => setOpenInApp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* UTM Tab */}
          {activeTab === 'utm' && (
            <div className="space-y-4 animate-fade-in">
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Tezkor UTM shablonlar</label>
                <div className="flex flex-wrap gap-2">
                  {utmPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setUtmSource(preset.source);
                        setUtmMedium(preset.medium);
                        setUtmCampaign(preset.campaign);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-300 border border-[var(--border-subtle)] hover:border-indigo-500/30 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">utm_source</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="telegram, google"
                    className="w-full px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">utm_medium</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="cpc, social, email"
                    className="w-full px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">utm_campaign</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="bahor_chegirma"
                    className="w-full px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">utm_term</label>
                  <input
                    type="text"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    placeholder="kalit_soz"
                    className="w-full px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">utm_content</label>
                <input
                  type="text"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="banner_top, cta_button"
                  className="w-full px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Preview */}
              {(utmSource || utmMedium || utmCampaign) && (
                <div className="p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Parametrlar ko'rinishi</div>
                  <code className="text-[11px] text-indigo-300 font-mono break-all">
                    ?{utmSource && `utm_source=${utmSource}`}
                    {utmMedium && `&utm_medium=${utmMedium}`}
                    {utmCampaign && `&utm_campaign=${utmCampaign}`}
                    {utmTerm && `&utm_term=${utmTerm}`}
                    {utmContent && `&utm_content=${utmContent}`}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Protection Tab */}
          {activeTab === 'protection' && (
            <div className="space-y-4 animate-fade-in">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  {t.passwordProtect}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parol kiriting..."
                    className="w-full px-3.5 py-3 pr-10 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {t.expirationDate}
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={`w-full px-3.5 py-3 bg-[var(--surface-1)] border rounded-xl text-white text-sm focus:outline-none transition-all [color-scheme:dark] ${
                    isExpiredDate
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-[var(--border-default)] focus:border-indigo-500'
                  }`}
                />
                {isExpiredDate && (
                  <p className="text-[11px] text-rose-400 mt-1.5 font-mono">
                    ⚠️ Amal qilish muddati kelajakdagi vaqt bo‘lishi lozim (o‘tib ketgan sana).
                  </p>
                )}
              </div>

              {/* Click Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  {t.clickLimit}
                </label>
                <input
                  type="number"
                  value={clickLimit}
                  onChange={(e) => setClickLimit(e.target.value)}
                  placeholder="500"
                  min="1"
                  className="w-full px-3.5 py-3 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Device Targeting */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  {t.deviceTargeting}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Apple iOS URL (App Store / Universal)</label>
                    <input
                      type="text"
                      value={iosUrl}
                      onChange={(e) => setIosUrl(e.target.value)}
                      placeholder="https://apps.apple.com/app/..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Google Android URL (Play Store / Intent)</label>
                    <input
                      type="text"
                      value={androidUrl}
                      onChange={(e) => setAndroidUrl(e.target.value)}
                      placeholder="https://play.google.com/store/apps/..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Huawei HarmonyOS URL (AppGallery)</label>
                    <input
                      type="text"
                      value={huaweiUrl}
                      onChange={(e) => setHuaweiUrl(e.target.value)}
                      placeholder="https://appgallery.huawei.com/app/..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Desktop Workstation URL (Web Landing / App)</label>
                    <input
                      type="text"
                      value={desktopUrl}
                      onChange={(e) => setDesktopUrl(e.target.value)}
                      placeholder="https://mysite.uz/desktop"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Tab */}
          {activeTab === 'qr' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-400">
                Havola yaratilgandan so'ng QR kod avtomatik ravishda hosil bo'ladi. Ranglarni sozlang:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Oldi rang (Foreground)</label>
                  <div className="flex items-center gap-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl px-3 py-2">
                    <input
                      type="color"
                      value={qrFg}
                      onChange={(e) => setQrFg(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-white font-mono">{qrFg}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Fon rangi (Background)</label>
                  <div className="flex items-center gap-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl px-3 py-2">
                    <input
                      type="color"
                      value={qrBg}
                      onChange={(e) => setQrBg(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-white font-mono">{qrBg}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-2">Markaziy logotip</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQrLogo('telegram')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      qrLogo === 'telegram'
                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                        : 'bg-[var(--surface-1)] border-[var(--border-subtle)] text-slate-400 hover:text-white'
                    }`}
                  >
                    📱 Telegram
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrLogo('none')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      qrLogo === 'none'
                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                        : 'bg-[var(--surface-1)] border-[var(--border-subtle)] text-slate-400 hover:text-white'
                    }`}
                  >
                    ⬜ Bo'sh
                  </button>
                </div>
              </div>

              {/* Live QR Preview */}
              {destinationUrl && (
                <div className="flex justify-center p-6 bg-white rounded-2xl">
                  <QrCanvas
                    url={destinationUrl}
                    size={180}
                    fgColor={qrFg}
                    bgColor={qrBg}
                    centerLogo={qrLogo}
                    frameText="SCAN ME"
                    frameStyle="bottom"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 animate-fade-in">
              {error}
            </div>
          )}

          {/* Action Buttons (sticky bottom) */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !destinationUrl}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yaratilmoqda...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{t.createNewLink}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
