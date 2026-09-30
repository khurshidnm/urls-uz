import React from 'react';
import { Globe, ShoppingBag, Star, Phone, Mail, Music, Video, FileText, Zap } from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon, GitHubIcon, TikTokIcon } from '@/components/ui/icons';
import type { ClientBioPage } from '@/lib/client-types';

/* Themes, presets and helpers shared by the bio builder pieces. */

export interface BioLinkItem {
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

// Preset themes: Free vs Pro
export const THEMES = [
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

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
];

export const ICON_OPTIONS = [
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
export function toBuilderButton(l: ClientBioPage['links'][number]): BioLinkItem {
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

/** Icon shown on a bio button. */
export function renderBioIcon(iconId?: string) {
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
}
