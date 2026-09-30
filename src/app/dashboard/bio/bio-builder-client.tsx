'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import type { ClientBioPage } from '@/lib/client-types';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Check,
  Globe,
  Copy,
  QrCode,
  Smartphone,
  Tablet,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Star,
  Phone,
  Mail,
  Music,
  Video,
  FileText,
  Zap,
  Lock,
  Share2,
  User as UserIcon,
  Palette,
  AlertCircle,
  Upload,
  Crop,
  Image as ImageIcon,
} from 'lucide-react';
import {
  TelegramIcon,
  InstagramIcon,
  YouTubeIcon,
  LinkedInIcon,
  GitHubIcon,
  TikTokIcon,
  TwitterXIcon,
} from '@/components/ui/icons';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { Modal } from '@/components/ui/modal';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import confetti from 'canvas-confetti';
import { copyToClipboard } from '@/lib/utils';

interface BioLinkItem {
  id?: string;
  title: string;
  url: string;
  icon?: string;
  style: string;
  animation: string;
  tag?: string;
  enabled?: boolean;
  click_count?: number;
}

interface Props {
  initialBio: ClientBioPage | undefined;
}

// Preset themes: Free vs Pro
const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Obsidian',
    category: 'Dark',
    pro: false,
    previewBg: 'bg-[#090d16]',
    screenBg: 'bg-[#090d16]',
    cardBg: 'bg-zinc-900/90 border-zinc-800 text-white',
    buttonBg: 'bg-zinc-850 hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-md',
    textColor: 'text-white',
    subtextColor: 'text-zinc-400',
    swatches: ['#090d16', '#18181b', '#3b82f6'],
  },
  {
    id: 'emerald',
    name: 'Uzbekistan Emerald',
    category: 'Nature',
    pro: false,
    previewBg: 'bg-gradient-to-b from-emerald-950 via-zinc-950 to-zinc-950',
    screenBg: 'bg-gradient-to-b from-emerald-950 via-zinc-950 to-zinc-950',
    cardBg: 'bg-emerald-900/30 border-emerald-800/50 text-emerald-100',
    buttonBg: 'bg-emerald-900/40 hover:bg-emerald-800/40 text-emerald-100 border border-emerald-600/40 shadow-emerald-950/50',
    textColor: 'text-emerald-100',
    subtextColor: 'text-emerald-300/70',
    swatches: ['#064e3b', '#022c22', '#10b981'],
  },
  {
    id: 'clean-light',
    name: 'Minimal Light',
    category: 'Light',
    pro: false,
    previewBg: 'bg-slate-100',
    screenBg: 'bg-slate-100',
    cardBg: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    buttonBg: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm',
    textColor: 'text-slate-900',
    subtextColor: 'text-slate-600',
    swatches: ['#f8fafc', '#e2e8f0', '#0f172a'],
  },
  {
    id: 'neon',
    name: 'Cyberpunk Neon',
    category: 'Vibrant',
    pro: true,
    previewBg: 'bg-gradient-to-b from-purple-950 via-zinc-950 to-indigo-950',
    screenBg: 'bg-gradient-to-b from-purple-950 via-zinc-950 to-indigo-950',
    cardBg: 'bg-purple-900/30 border-purple-800/50 text-purple-100',
    buttonBg: 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 text-white border border-purple-500/40',
    textColor: 'text-purple-100',
    subtextColor: 'text-purple-300/70',
    swatches: ['#581c87', '#312e81', '#ec4899'],
  },
  {
    id: 'glass',
    name: 'Frosted Glass',
    category: 'Modern',
    pro: true,
    previewBg: 'bg-zinc-950',
    screenBg: 'bg-zinc-950',
    cardBg: 'bg-white/10 backdrop-blur-xl border-white/15 text-white',
    buttonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-lg',
    textColor: 'text-white',
    subtextColor: 'text-zinc-300',
    swatches: ['#09090b', '#27272a', '#71717a'],
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    category: 'Warm',
    pro: true,
    previewBg: 'bg-gradient-to-b from-amber-950 via-zinc-950 to-rose-950',
    screenBg: 'bg-gradient-to-b from-amber-950 via-zinc-950 to-rose-950',
    cardBg: 'bg-amber-900/30 border-amber-800/40 text-amber-100',
    buttonBg: 'bg-gradient-to-r from-amber-600/30 to-rose-600/30 hover:from-amber-600/50 hover:to-rose-600/50 text-white border border-amber-500/30',
    textColor: 'text-amber-100',
    subtextColor: 'text-amber-300/70',
    swatches: ['#78350f', '#4c0519', '#f59e0b'],
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    category: 'Cool',
    pro: true,
    previewBg: 'bg-gradient-to-b from-[#0a192f] via-zinc-950 to-[#020c1b]',
    screenBg: 'bg-gradient-to-b from-[#0a192f] via-zinc-950 to-[#020c1b]',
    cardBg: 'bg-sky-950/40 border-sky-800/40 text-sky-100',
    buttonBg: 'bg-sky-900/40 hover:bg-sky-800/40 text-sky-100 border border-sky-600/40 shadow-sky-950/50',
    textColor: 'text-sky-100',
    subtextColor: 'text-sky-300/70',
    swatches: ['#0c4a6e', '#082f49', '#38bdf8'],
  },
  {
    id: 'ruby',
    name: 'Velvet Ruby',
    category: 'Luxury',
    pro: true,
    previewBg: 'bg-gradient-to-b from-[#2a0812] via-zinc-950 to-zinc-950',
    screenBg: 'bg-gradient-to-b from-[#2a0812] via-zinc-950 to-zinc-950',
    cardBg: 'bg-rose-950/40 border-rose-800/40 text-rose-100',
    buttonBg: 'bg-gradient-to-r from-rose-700/40 to-pink-700/40 hover:from-rose-700/60 hover:to-pink-700/60 text-white border border-rose-500/40 shadow-rose-950/50',
    textColor: 'text-rose-100',
    subtextColor: 'text-rose-300/70',
    swatches: ['#881337', '#4c0519', '#fb7185'],
  },
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
];

const ICON_OPTIONS = [
  { id: 'link', label: 'Havola', icon: Globe },
  { id: 'telegram', label: 'Telegram', icon: TelegramIcon },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { id: 'youtube', label: 'YouTube', icon: YouTubeIcon },
  { id: 'tiktok', label: 'TikTok', icon: TikTokIcon },
  { id: 'github', label: 'GitHub', icon: GitHubIcon },
  { id: 'shop', label: 'Do‘kon', icon: ShoppingBag },
  { id: 'star', label: 'Yulduz', icon: Star },
  { id: 'phone', label: 'Telefon', icon: Phone },
  { id: 'mail', label: 'Email', icon: Mail },
  { id: 'music', label: 'Musiqa', icon: Music },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'file', label: 'Fayl / PDF', icon: FileText },
  { id: 'zap', label: 'Maxsus', icon: Zap },
];

/** Saved button -> editable builder state. */
function toBuilderButton(l: ClientBioPage['links'][number]): BioLinkItem {
  return {
    id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon || 'link',
    style: l.style === 'solid' ? 'solid' : 'glass', // Restrict to free styles
    animation: 'none',
    tag: '',
    enabled: l.is_active,
    click_count: l.click_count || 0,
  };
}

export default function BioBuilderClient({ initialBio }: Props) {
  const { user, isSuperAdmin, demoEditMode } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const checkDemoRestricted = (actionName: string) => {
    if (isSuperAdmin && demoEditMode) {
      return false;
    }
    if (!user) {
      window.dispatchEvent(
        new CustomEvent('open-demo-restriction', { detail: { actionTitle: actionName } })
      );
      return true;
    }
    return false;
  };

  const parsedSocial: Record<string, string> = initialBio?.social_links ?? {};

  // Profile Fields
  const [handle, setHandle] = useState(initialBio?.handle || 'apextech');
  const [title, setTitle] = useState(initialBio?.title || 'ApexTech Solutions');
  const [bio, setBio] = useState(
    initialBio?.bio || 'O‘zbekistondagi yetakchi fintex ekotizimi · Tezkor to‘lovlar, biznes xizmatlari va innovatsiyalar 🚀'
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialBio?.avatar_url || AVATAR_PRESETS[0]
  );
  // Custom Avatar Upload & Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [avatarSizeKb, setAvatarSizeKb] = useState<number | null>(() => {
    if (initialBio?.avatar_url && initialBio.avatar_url.startsWith('data:image/')) {
      const base64Data = initialBio.avatar_url.split(',')[1] || '';
      return Math.round((base64Data.length * 3) / 4 / 1024);
    }
    return null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (checkDemoRestricted('Profil rasmini almashtirish')) {
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Iltimos, rasm formatidagi faylni tanlang (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImageSrc(reader.result);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string, fileSizeKb: number) => {
    setAvatarUrl(croppedDataUrl);
    setAvatarSizeKb(fileSizeKb);
  };

  const [theme, setTheme] = useState(initialBio?.theme || 'midnight');
  const buttonRadius = 'rounded-xl';

  // Social Links
  const [socialTelegram, setSocialTelegram] = useState(parsedSocial.telegram || 'urls_uz');
  const [socialInstagram, setSocialInstagram] = useState(parsedSocial.instagram || 'urls.uz');
  const [socialYoutube, setSocialYoutube] = useState(parsedSocial.youtube || '');
  const [socialTiktok, setSocialTiktok] = useState(parsedSocial.tiktok || '');
  const [socialGithub, setSocialGithub] = useState(parsedSocial.github || '');
  const [socialLinkedin, setSocialLinkedin] = useState(parsedSocial.linkedin || '');
  const [socialTwitter, setSocialTwitter] = useState(parsedSocial.twitter || '');
  const [socialWebsite, setSocialWebsite] = useState(parsedSocial.website || 'https://urls.uz');

  // Custom Links: Limited to 4 in Free Plan
  const BIO_LINKS_LIMIT = 4;
  const initialLinks = initialBio?.links && initialBio.links.length > 0
    ? initialBio.links.slice(0, BIO_LINKS_LIMIT).map(toBuilderButton)
    : [
        {
          title: '🌐 Rasmiy Veb-Sayt',
          url: 'https://urls.uz',
          icon: 'link',
          style: 'glass',
          animation: 'none',
          tag: 'Asosiy',
          enabled: true,
          click_count: 0,
        },
        {
          title: '📢 Telegram Rasmiy Kanal',
          url: 'https://t.me/urls_uz',
          icon: 'telegram',
          style: 'glass',
          animation: 'none',
          tag: 'Yangi',
          enabled: true,
          click_count: 0,
        },
        {
          title: '📸 Instagram Blogimiz',
          url: 'https://instagram.com/urls.uz',
          icon: 'instagram',
          style: 'solid',
          animation: 'none',
          tag: '',
          enabled: true,
          click_count: 0,
        },
      ];

  const [links, setLinks] = useState<BioLinkItem[]>(initialLinks);

  // Active Editor Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'social' | 'themes'>('profile');

  // Device Preview State: 'iphone' or 'ipad'
  const [deviceMode, setDeviceMode] = useState<'iphone' | 'ipad'>('iphone');
  const [deviceFinish, setDeviceFinish] = useState<'black' | 'natural' | 'desert'>('black');
  const [previewScale, setPreviewScale] = useState<number>(100);

  // Modals & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proModalText, setProModalText] = useState('');

  const currentThemeObj = useMemo(() => {
    return THEMES.find((t) => t.id === theme) || THEMES[0];
  }, [theme]);

  const fullBioUrl = `https://urls.uz/b/${handle}`;

  // Link Handlers
  const addLink = () => {
    if (checkDemoRestricted('Yangi bio havola qo‘shish')) return;

    if (links.length >= BIO_LINKS_LIMIT) {
      setProModalText('Bepul tarifda faqat 4 ta tugma yaratish mumkin. Cheksiz tugmalar Pro tarifda tez kunda ishga tushadi!');
      setProModalOpen(true);
      return;
    }

    setLinks([
      ...links,
      {
        title: 'Yangi Havola',
        url: 'https://',
        icon: 'link',
        style: 'glass',
        animation: 'none',
        tag: '',
        enabled: true,
        click_count: 0,
      },
    ]);
  };

  const removeLink = (index: number) => {
    if (checkDemoRestricted('Bio havolani o‘chirish')) return;
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = <K extends keyof BioLinkItem>(index: number, field: K, value: BioLinkItem[K]) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...links];
    const item = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = item;
    setLinks(updated);
  };

  const handleCopyBioLink = async () => {
    const ok = await copyToClipboard(fullBioUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleThemeSelect = (th: typeof THEMES[0]) => {
    if (th.pro) {
      setProModalText(`"${th.name}" mavzusi pullik Pro tarifda tez kunda ishga tushadi! Hozirda Midnight Obsidian, Uzbekistan Emerald va Minimal Light mavzulari barcha uchun to‘liq bepul.`);
      setProModalOpen(true);
      return;
    }
    setTheme(th.id);
  };

  const handleSave = async () => {
    if (checkDemoRestricted('Bio sahifani saqlash')) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          title,
          bio,
          avatar_url: avatarUrl,
          theme,
          social_links: {
            telegram: socialTelegram,
            instagram: socialInstagram,
            youtube: socialYoutube,
            tiktok: socialTiktok,
            github: socialGithub,
            linkedin: socialLinkedin,
            twitter: socialTwitter,
            website: socialWebsite,
          },
          links: links.slice(0, BIO_LINKS_LIMIT).map((l, i) => ({
            // Existing buttons keep their short link and statistics
            id: l.id,
            title: l.title,
            url: l.url,
            icon: l.icon || 'link',
            style: l.style,
            animation: 'none',
            sort_order: i,
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || 'Saqlashda xatolik yuz berdi');
      } else {
        // Adopt server ids so the next save keeps each button's short link and statistics
        setLinks(data.bioPage.links.map(toBuilderButton));
        if (data.limitNotice) showToast('info', data.limitNotice);
        setSavedSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const renderIconComponent = (iconId?: string) => {
    switch (iconId) {
      case 'telegram':
        return <TelegramIcon className="w-4 h-4 text-[#229ED9] shrink-0" />;
      case 'instagram':
        return <InstagramIcon className="w-4 h-4 text-[#E1306C] shrink-0" />;
      case 'youtube':
        return <YouTubeIcon className="w-4 h-4 text-[#FF0000] shrink-0" />;
      case 'tiktok':
        return <TikTokIcon className="w-4 h-4 text-white shrink-0" />;
      case 'github':
        return <GitHubIcon className="w-4 h-4 text-white shrink-0" />;
      case 'shop':
        return <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'star':
        return <Star className="w-4 h-4 text-yellow-400 shrink-0" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'mail':
        return <Mail className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'music':
        return <Music className="w-4 h-4 text-pink-400 shrink-0" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'file':
        return <FileText className="w-4 h-4 text-orange-400 shrink-0" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-yellow-300 shrink-0" />;
      default:
        return <Globe className="w-4 h-4 text-zinc-400 shrink-0" />;
    }
  };

  const getDeviceFinishBorder = () => {
    if (deviceFinish === 'natural') return 'border-[#9a948d] bg-[#3a3734] shadow-[0_25px_60px_-15px_rgba(154,148,141,0.25)]';
    if (deviceFinish === 'desert') return 'border-[#b59e88] bg-[#42362c] shadow-[0_25px_60px_-15px_rgba(181,158,136,0.25)]';
    return 'border-zinc-700 bg-zinc-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]';
  };

  return (
    <div className="space-y-6">
      {/* Top Main Navigation & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Link-in-Bio Studio
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              @{handle}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Bepul: {links.length}/{BIO_LINKS_LIMIT} tugma
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Instagram, Telegram, TikTok va YouTube uchun yagona shaxsiy profilingizni boshqaring
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Link pill */}
          <button
            onClick={handleCopyBioLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
            title="Havoladan nusxa olish"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="text-[11px]">{copiedLink ? 'Nusxalandi!' : `urls.uz/b/${handle}`}</span>
          </button>

          {/* QR Code button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>QR Kod</span>
          </button>

          {/* Open live page */}
          <Link
            href={`/b/${handle}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <span>Ochish</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </Link>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saqlandi!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saqlanmoqda...' : t.save}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Editor Controls (Left) & Real Device Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Tabs */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-5">
          {/* Navigation Tab Bar */}
          <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profil</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'links'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tugmalar</span>
              <span className="w-4 h-4 rounded-full bg-zinc-700 text-[10px] flex items-center justify-center text-zinc-200 font-mono">
                {links.length}/{BIO_LINKS_LIMIT}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'social'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Ijtimoiy</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'themes'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Mavzular</span>
            </button>
          </div>

          {/* TAB 1: PROFIL & ASOSIY MA'LUMOTLAR */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Asosiy Profil Ma’lumotlari
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Tasdiqlangan nishon (Pro tez kunda)
                  </span>
                </div>

                {/* Handle and Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Shaxsiy Handle / Slug
                    </label>
                    <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-zinc-600 rounded-xl px-3 py-2 text-xs font-mono transition-colors">
                      <span className="text-zinc-500 select-none">urls.uz/b/</span>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        className="w-full bg-transparent text-white focus:outline-none pl-0.5"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Sarlavha (Ism yoki Brend)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none transition-colors"
                      placeholder="Khurshid Nur"
                    />
                  </div>
                </div>

                {/* Bio text */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      Bio / Qisqa tavsif
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {bio.length}/160 belgi
                    </span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none resize-none transition-colors"
                    placeholder="O‘zingiz yoki loyihangiz haqida 1-2 jumlalik qiziqarli ta’rif"
                  />
                </div>

                {/* Avatar Section: Custom Upload + Crop + Presets */}
                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Profil rasmi (Avatar)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Maksimal: &le; 100 KB
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/jpg"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Avatar Upload Card */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-3.5">
                    <div className="relative shrink-0 self-center sm:self-auto">
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover bg-zinc-900 border-2 border-zinc-700 shadow-md ring-2 ring-indigo-500/20"
                      />
                      {avatarUrl.startsWith('data:image/') && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-zinc-950" />
                          <span>Qurilmadan rasm yuklash</span>
                        </button>

                        {rawImageSrc && (
                          <button
                            type="button"
                            onClick={() => setCropModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Crop className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Qayta qirqish</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px]">
                        {avatarSizeKb !== null ? (
                          <span className="font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            Hajmi: {avatarSizeKb} KB (&le; 100 KB limit)
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">
                            Istalgan joyini qirqib, 100 KB gacha avtomatik siqib yuklaydi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-400 block font-mono">
                      Yoki tayyor avatarlardan birini tanlang:
                    </span>
                    <div className="flex items-center gap-2">
                      {AVATAR_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(p);
                            setAvatarSizeKb(null);
                          }}
                          className={`relative rounded-full overflow-hidden w-8 h-8 transition-all hover:scale-105 ${
                            avatarUrl === p
                              ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950'
                              : 'opacity-70 hover:opacity-100 border border-zinc-800'
                          }`}
                        >
                          <img src={p} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual URL Input */}
                  <details className="text-xs group">
                    <summary className="text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer select-none font-mono py-1">
                      + Rasm manzilini (URL) qo&lsquo;lda kiritish
                    </summary>
                    <div className="pt-2">
                      <input
                        type="text"
                        value={avatarUrl.startsWith('data:image/') ? '' : avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setAvatarSizeKb(null);
                        }}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none font-mono transition-colors"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HAVOLALAR & TUGMALAR (MAX 4) */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Havolalar ({links.length}/{BIO_LINKS_LIMIT} ta)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Bepul tarifda ko‘pi bilan 4 ta tugma qo‘shish mumkin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  disabled={links.length >= BIO_LINKS_LIMIT}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{links.length >= BIO_LINKS_LIMIT ? 'Limit to‘lgan (4/4)' : 'Tugma qo‘shish'}</span>
                </button>
              </div>

              {/* Limit Alert note */}
              {links.length >= BIO_LINKS_LIMIT && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Bepul tarif limiti: 4 / 4 ta tugma qo‘shilgan. Yangi tugma qo‘shish uchun mavjudlarini o‘chiring. Cheksiz tugmalar Pro tarifda tez kunda ishga tushadi!
                  </span>
                </div>
              )}

              {/* Links list */}
              <div className="space-y-3">
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3 relative group transition-all hover:border-zinc-700"
                  >
                    {/* Header bar of link item */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-500">#{idx + 1}</span>
                        <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center">
                          {renderIconComponent(link.icon)}
                        </div>
                        <span className="text-xs font-medium text-white truncate max-w-[140px]">
                          {link.title || 'Nomsiz tugma'}
                        </span>
                      </div>

                      {/* Controls: Up, Down, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveLink(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                          title="Yuqoriga surish"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLink(idx, 'down')}
                          disabled={idx === links.length - 1}
                          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                          title="Pastga surish"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLink(idx)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 ml-1 transition-colors"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inputs: Title and URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                          Tugma Matni
                        </label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updateLink(idx, 'title', e.target.value)}
                          placeholder="Masalan: Telegram Kanal"
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                          Havola Manzili (URL)
                        </label>
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateLink(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono transition-colors"
                        />
                      </div>
                    </div>

                    {/* Icon & Style Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {/* Icon selector */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                          Ikonka
                        </label>
                        <select
                          value={link.icon || 'link'}
                          onChange={(e) => updateLink(idx, 'icon', e.target.value)}
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                        >
                          {ICON_OPTIONS.map((ico) => (
                            <option key={ico.id} value={ico.id}>
                              {ico.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Style selector */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                          Dizayn
                        </label>
                        <select
                          value={link.style || 'glass'}
                          onChange={(e) => updateLink(idx, 'style', e.target.value)}
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                        >
                          <option value="glass">Oynaviy (Glass)</option>
                          <option value="solid">To‘q fon (Solid)</option>
                        </select>
                      </div>

                      {/* Badge / Tag text */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                          Nishon (Tag)
                        </label>
                        <input
                          type="text"
                          value={link.tag || ''}
                          onChange={(e) => updateLink(idx, 'tag', e.target.value)}
                          placeholder="Yangi / Hot"
                          className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: IJTIMOIY TARMOQLAR */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Ijtimoiy Tarmoq Havolalari
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Sahifangiz tepasida chiroyli nishon ko‘rinishida aks etadi
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Telegram */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <TelegramIcon className="w-4 h-4 text-[#229ED9] shrink-0" />
                    <input
                      type="text"
                      value={socialTelegram}
                      onChange={(e) => setSocialTelegram(e.target.value)}
                      placeholder="Telegram (kanal_nomi)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <InstagramIcon className="w-4 h-4 text-[#E1306C] shrink-0" />
                    <input
                      type="text"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="Instagram (profil_nomi)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <YouTubeIcon className="w-4 h-4 text-[#FF0000] shrink-0" />
                    <input
                      type="text"
                      value={socialYoutube}
                      onChange={(e) => setSocialYoutube(e.target.value)}
                      placeholder="YouTube (@kanal_nomi)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <TikTokIcon className="w-4 h-4 text-white shrink-0" />
                    <input
                      type="text"
                      value={socialTiktok}
                      onChange={(e) => setSocialTiktok(e.target.value)}
                      placeholder="TikTok (@foydalanuvchi)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* GitHub */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <GitHubIcon className="w-4 h-4 text-zinc-300 shrink-0" />
                    <input
                      type="text"
                      value={socialGithub}
                      onChange={(e) => setSocialGithub(e.target.value)}
                      placeholder="GitHub (username)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <LinkedInIcon className="w-4 h-4 text-[#0077B5] shrink-0" />
                    <input
                      type="text"
                      value={socialLinkedin}
                      onChange={(e) => setSocialLinkedin(e.target.value)}
                      placeholder="LinkedIn (profil_id)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Twitter / X */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <TwitterXIcon className="w-4 h-4 text-zinc-300 shrink-0" />
                    <input
                      type="text"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="X / Twitter (username)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Website */}
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <input
                      type="text"
                      value={socialWebsite}
                      onChange={(e) => setSocialWebsite(e.target.value)}
                      placeholder="Shaxsiy veb-sayt (https://...)"
                      className="w-full bg-transparent text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MAVZULAR (FREE VS PRO LOCKED) */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Dizayn Mavzulari
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Bepul versiyada 3 ta asosiy mavzu ochiq. Kengaytirilgan mavzular Pro tarifda tez kunda chiqadi.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map((th) => {
                    const isSelected = theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleThemeSelect(th)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
                          isSelected
                            ? 'bg-zinc-850 border-white shadow-md ring-1 ring-white'
                            : th.pro
                            ? 'bg-zinc-950/40 border-zinc-850 opacity-75 hover:opacity-100 hover:border-zinc-700'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-white">{th.name}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : th.pro ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                              <Lock className="w-2.5 h-2.5" /> PRO
                            </span>
                          ) : null}
                        </div>

                        {/* Swatches preview */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {th.swatches.map((sw, i) => (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: sw }}
                            />
                          ))}
                          <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                            {th.pro ? 'Tez kunda' : 'Faol'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REAL IPHONE & IPAD PREVIEW STUDIO */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center sticky top-20">
          {/* Device Controls Toolbar */}
          <div className="w-full flex items-center justify-between mb-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2">
            {/* Device Switcher (iPhone vs iPad) */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setDeviceMode('iphone')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  deviceMode === 'iphone'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone 16 Pro</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceMode('ipad')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  deviceMode === 'ipad'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>iPad Air</span>
              </button>
            </div>

            {/* Device Finish Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">Korpus:</span>
              <button
                type="button"
                onClick={() => setDeviceFinish('black')}
                className={`w-4 h-4 rounded-full bg-zinc-900 border border-zinc-600 ${deviceFinish === 'black' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950' : ''}`}
                title="Space Black"
              />
              <button
                type="button"
                onClick={() => setDeviceFinish('natural')}
                className={`w-4 h-4 rounded-full bg-[#9a948d] border border-zinc-500 ${deviceFinish === 'natural' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950' : ''}`}
                title="Natural Titanium"
              />
              <button
                type="button"
                onClick={() => setDeviceFinish('desert')}
                className={`w-4 h-4 rounded-full bg-[#b59e88] border border-zinc-500 ${deviceFinish === 'desert' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950' : ''}`}
                title="Desert Titanium"
              />
            </div>

            {/* Scale toggle */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <button
                onClick={() => setPreviewScale(previewScale === 100 ? 90 : 100)}
                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:text-white"
                title="Masshtabni o‘zgartirish"
              >
                {previewScale}%
              </button>
            </div>
          </div>

          {/* DEVICE FRAME CONTAINER */}
          <div
            className="w-full flex items-center justify-center transition-all duration-300"
            style={{ transform: `scale(${previewScale / 100})`, transformOrigin: 'top center' }}
          >
            {/* REAL IPHONE 16 PRO VIEW */}
            {deviceMode === 'iphone' ? (
              <div
                className={`relative w-[330px] rounded-[52px] p-[11px] border-[4px] shadow-2xl transition-all duration-300 ${getDeviceFinishBorder()}`}
              >
                {/* Hardware Buttons Simulation */}
                <div className="absolute -left-[7px] top-[105px] w-[3px] h-[24px] bg-zinc-600 rounded-l-sm" />
                <div className="absolute -left-[7px] top-[145px] w-[3px] h-[45px] bg-zinc-600 rounded-l-sm" />
                <div className="absolute -left-[7px] top-[200px] w-[3px] h-[45px] bg-zinc-600 rounded-l-sm" />
                <div className="absolute -right-[7px] top-[165px] w-[3px] h-[65px] bg-zinc-600 rounded-r-sm" />

                {/* iPhone Screen Glass */}
                <div
                  className={`w-full rounded-[42px] overflow-hidden ${currentThemeObj.screenBg} text-center transition-colors duration-300 h-[640px] flex flex-col relative border border-white/5 select-none`}
                >
                  {/* Top iOS Status Bar */}
                  <div className="pt-3 px-6 pb-1 flex items-center justify-between text-white text-[11px] font-medium tracking-tight z-30 shrink-0">
                    <span className="font-mono text-[11px] text-zinc-300">09:41</span>
                    {/* Dynamic Island */}
                    <div className="w-24 h-6 bg-black rounded-full flex items-center justify-between px-2 text-[9px] text-white shadow-md ring-1 ring-white/10 mx-auto">
                      <span className="w-2 h-2 rounded-full bg-[#111] ring-1 ring-zinc-800" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    {/* Battery & Signal */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-300">
                      <span>5G</span>
                      <div className="w-5 h-2.5 rounded-sm border border-zinc-400 p-0.5 flex items-center">
                        <div className="w-3 h-1.5 bg-white rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Safari In-App Address Bar Pill */}
                  <div className="px-5 py-1 z-20 shrink-0">
                    <div className="w-full py-1 px-3 bg-black/30 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                      <span>🔒 urls.uz/b/{handle}</span>
                    </div>
                  </div>

                  {/* Scrollable Content inside iPhone */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 scrollbar-none">
                    {/* Avatar with Gradient Ring */}
                    <div className="relative mx-auto w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover bg-zinc-900 border border-white/20"
                      />
                    </div>

                    {/* Title (Verified badge hidden for free tier) */}
                    <div>
                      <h4 className={`font-bold text-base tracking-tight ${currentThemeObj.textColor}`}>
                        {title}
                      </h4>
                      <p className="text-xs font-mono text-indigo-400 font-medium mt-0.5">
                        @{handle}
                      </p>
                      <p className={`text-xs ${currentThemeObj.subtextColor} mt-1.5 px-2 leading-relaxed line-clamp-3`}>
                        {bio}
                      </p>
                    </div>

                    {/* Social Media Chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {socialTelegram && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#229ED9]">
                          <TelegramIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialInstagram && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#E1306C]">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialYoutube && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#FF0000]">
                          <YouTubeIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialTiktok && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                          <TikTokIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialGithub && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                          <GitHubIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialLinkedin && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#0077B5]">
                          <LinkedInIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialTwitter && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                          <TwitterXIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {socialWebsite && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Custom Links List (Max 4) */}
                    <div className="space-y-2.5 pt-2">
                      {links.map((l, i) => (
                        <div
                          key={i}
                          className={`w-full p-3 ${buttonRadius} border flex items-center justify-between text-left text-xs font-semibold transition-all shadow-sm ${
                            l.style === 'solid'
                              ? 'bg-zinc-800 text-white border-zinc-700'
                              : currentThemeObj.buttonBg
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderIconComponent(l.icon)}
                            <span className="truncate">{l.title || 'Nomsiz havola'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {l.tag && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 text-white">
                                {l.tag}
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer attribution */}
                    <div className="pt-4 pb-2 text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                      <span>Powered by</span>
                      <span className="text-white font-semibold">urls.uz</span>
                    </div>
                  </div>

                  {/* iOS Bottom Home Indicator Bar */}
                  <div className="py-2 shrink-0">
                    <div className="w-32 h-1 bg-white/70 rounded-full mx-auto" />
                  </div>
                </div>
              </div>
            ) : (
              /* REAL IPAD AIR / TABLET VIEW */
              <div
                className={`relative w-full max-w-[560px] rounded-[38px] p-[13px] border-[4px] shadow-2xl transition-all duration-300 ${getDeviceFinishBorder()}`}
              >
                {/* iPad Screen Glass */}
                <div
                  className={`w-full rounded-[28px] overflow-hidden ${currentThemeObj.screenBg} transition-colors duration-300 h-[620px] flex flex-col relative border border-white/5 select-none`}
                >
                  {/* Top iPad Status Bar */}
                  <div className="pt-2 px-6 pb-1 flex items-center justify-between text-white text-[11px] font-medium tracking-tight z-30 shrink-0">
                    <span className="font-mono text-zinc-400 text-[11px]">Chorshanba, 09:41</span>
                    <div className="w-2 h-2 rounded-full bg-black ring-1 ring-zinc-800" />
                    <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                      <span>Wi-Fi</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* iPad Safari Browser Toolbar */}
                  <div className="px-4 py-1.5 z-20 shrink-0 bg-black/40 border-b border-white/10 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>

                    <div className="flex-1 max-w-sm mx-auto py-1 px-3 bg-zinc-900/90 rounded-lg border border-zinc-700/60 flex items-center justify-center gap-1.5 text-[11px] text-zinc-300 font-mono">
                      <span>https://urls.uz/b/{handle}</span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Scrollable Content inside iPad */}
                  <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 scrollbar-none text-center">
                    {/* Avatar with Gradient Ring */}
                    <div className="relative mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover bg-zinc-900 border border-white/20"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className={`font-bold text-xl tracking-tight ${currentThemeObj.textColor}`}>
                        {title}
                      </h4>
                      <p className="text-xs font-mono text-indigo-400 font-medium mt-0.5">
                        @{handle}
                      </p>
                      <p className={`text-xs ${currentThemeObj.subtextColor} mt-1.5 max-w-md mx-auto leading-relaxed`}>
                        {bio}
                      </p>
                    </div>

                    {/* Social Media Chips */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {socialTelegram && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#229ED9]">
                          <TelegramIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialInstagram && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#E1306C]">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialYoutube && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#FF0000]">
                          <YouTubeIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialTiktok && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                          <TikTokIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialGithub && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                          <GitHubIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialLinkedin && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#0077B5]">
                          <LinkedInIcon className="w-4 h-4" />
                        </div>
                      )}
                      {socialTwitter && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white">
                          <TwitterXIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {socialWebsite && (
                        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Custom Links List - 2 Column Grid on iPad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2">
                      {links.map((l, i) => (
                        <div
                          key={i}
                          className={`p-3.5 ${buttonRadius} border flex items-center justify-between text-left text-xs font-semibold transition-all shadow-sm ${
                            l.style === 'solid'
                              ? 'bg-zinc-800 text-white border-zinc-700'
                              : currentThemeObj.buttonBg
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderIconComponent(l.icon)}
                            <span className="truncate">{l.title || 'Nomsiz havola'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {l.tag && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 text-white">
                                {l.tag}
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* iPad Footer */}
                    <div className="pt-6 pb-2 text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                      <span>Powered by</span>
                      <span className="text-white font-semibold">urls.uz</span>
                    </div>
                  </div>

                  {/* iPad Bottom Home Bar */}
                  <div className="py-2 shrink-0">
                    <div className="w-44 h-1 bg-white/60 rounded-full mx-auto" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR CODE MODAL FOR BIO PAGE */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Link-in-Bio QR Kodi"
      >
        <div className="space-y-4 text-center py-2">
          <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
            <QrCanvas
              url={fullBioUrl}
              size={200}
              fgColor="#09090b"
              bgColor="#ffffff"
              bodyShape="rounded"
              eyeFrameShape="rounded"
              eyeBallShape="circle"
              showControls={false}
            />
          </div>

          <div>
            <h4 className="text-base font-bold text-white mb-1">
              urls.uz/b/{handle}
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Smartfon kamerasi orqali skanerlab, sahifani bevosita ochish yoki chop etish uchun QR kod
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleCopyBioLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copiedLink ? 'Nusxalandi!' : 'Havolani nusxalash'}</span>
            </button>

            <Link
              href={`/b/${handle}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Sahifani ochish</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Modal>

      {/* PRO FEATURE COMING SOON MODAL */}
      <Modal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        title="Pro Xususiyat (Tez Kunda)"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-base font-bold text-white mb-1.5">
              Pullik Pro imkoniyat
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {proModalText || 'Ushbu imkoniyat pullik Pro tarifda tez kunda taqdim etiladi.'}
            </p>
          </div>

          <button
            onClick={() => setProModalOpen(false)}
            className="w-full py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Tushundim
          </button>
        </div>
      </Modal>

      {/* IMAGE CROP & COMPRESSION MODAL (STRICTLY <= 100 KB) */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        maxSizeKb={100}
      />
    </div>
  );
}
