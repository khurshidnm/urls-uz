'use client';

import React, { useState } from 'react';
import { BioAvatar } from '@/components/ui/bio-avatar';
import Link from 'next/link';
import {
  CheckCircle2,
  Share2,
  Globe,
  ExternalLink,
  QrCode,
  X,
  Check,
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon, LinkedInIcon, GitHubIcon, TikTokIcon, TwitterXIcon } from '@/components/ui/icons';
import { QrCanvas } from '@/components/ui/qr-canvas';

interface BioClientViewProps {
  bioPage: {
    id: string;
    handle: string;
    title: string;
    bio: string;
    avatar_url: string;
    theme: string;
    verified: boolean;
    social_links_parsed: Record<string, string>;
    links: Array<{
      id: string;
      title: string;
      url: string;
      icon: string;
      style: string;
      animation: string;
      click_count: number;
      /** Short link behind the button; null for tel:/mailto:/tg: buttons. */
      short_slug: string | null;
    }>;
  };
}

export default function BioClientView({ bioPage }: BioClientViewProps) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Themes mapping
  const themeClasses: Record<string, { bg: string; card: string; text: string; subtext: string; button: string }> = {
    midnight: {
      bg: 'bg-[#090d16]',
      card: 'bg-slate-900/80 border-slate-800 text-white',
      text: 'text-white',
      subtext: 'text-slate-400',
      button: 'bg-slate-800/90 hover:bg-slate-700/90 text-white border-slate-700/60 shadow-lg',
    },
    emerald: {
      bg: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950',
      card: 'bg-emerald-900/30 border-emerald-800/50 text-white',
      text: 'text-emerald-100',
      subtext: 'text-emerald-300/70',
      button: 'bg-emerald-800/40 hover:bg-emerald-700/40 text-emerald-100 border-emerald-600/40 shadow-emerald-950/50',
    },
    neon: {
      bg: 'bg-gradient-to-b from-purple-950 via-slate-950 to-indigo-950',
      card: 'bg-purple-900/30 border-purple-800/50 text-white',
      text: 'text-purple-100',
      subtext: 'text-purple-300/70',
      button: 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 text-white border-purple-500/40',
    },
    glass: {
      bg: 'bg-slate-950',
      card: 'bg-white/10 backdrop-blur-xl border-white/15 text-white',
      text: 'text-white',
      subtext: 'text-slate-300',
      button: 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/20',
    },
    sunset: {
      bg: 'bg-gradient-to-b from-amber-950 via-slate-950 to-rose-950',
      card: 'bg-amber-900/30 border-amber-800/40 text-white',
      text: 'text-amber-100',
      subtext: 'text-amber-300/70',
      button: 'bg-gradient-to-r from-amber-600/30 to-rose-600/30 hover:from-amber-600/50 hover:to-rose-600/50 text-white border-amber-500/30',
    },
    'clean-light': {
      bg: 'bg-slate-100',
      card: 'bg-white border-slate-200 text-slate-900 shadow-sm',
      text: 'text-slate-900',
      subtext: 'text-slate-600',
      button: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm',
    },
    ocean: {
      bg: 'bg-gradient-to-b from-[#0a192f] via-slate-950 to-[#020c1b]',
      card: 'bg-sky-950/40 border-sky-800/40 text-sky-100',
      text: 'text-sky-100',
      subtext: 'text-sky-300/70',
      button: 'bg-sky-900/40 hover:bg-sky-800/40 text-sky-100 border-sky-600/40 shadow-sky-950/50',
    },
    ruby: {
      bg: 'bg-gradient-to-b from-[#2a0812] via-slate-950 to-zinc-950',
      card: 'bg-rose-950/40 border-rose-800/40 text-rose-100',
      text: 'text-rose-100',
      subtext: 'text-rose-300/70',
      button: 'bg-gradient-to-r from-rose-700/40 to-pink-700/40 hover:from-rose-700/60 hover:to-pink-700/60 text-white border-rose-500/40 shadow-rose-950/50',
    },
  };

  const currentTheme = themeClasses[bioPage.theme] || themeClasses.midnight;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://urls.uz/b/${bioPage.handle}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bioPage.title,
          text: bioPage.bio,
          url: currentUrl,
        });
      } catch {
        // Fallback
      }
    } else {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkClick = (link: BioClientViewProps['bioPage']['links'][number]) => {
    // Buttons backed by a short link are counted by the redirect itself (with geo, device and referrer)
    if (link.short_slug) {
      window.open(`/${link.short_slug}`, '_blank', 'noopener,noreferrer');
      return;
    }
    fetch(`/api/bio/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: link.id }),
    }).catch(() => {});
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const renderSocialIcon = (network: string, value: string) => {
    let href = value;
    let icon = <Globe className="w-5 h-5" />;

    if (network === 'telegram') {
      href = value.startsWith('http') ? value : `https://t.me/${value.replace(/^@/, '')}`;
      icon = <TelegramIcon className="w-5 h-5 text-[#229ED9]" />;
    } else if (network === 'instagram') {
      href = value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`;
      icon = <InstagramIcon className="w-5 h-5 text-[#E1306C]" />;
    } else if (network === 'youtube') {
      href = value.startsWith('http') ? value : `https://youtube.com/${value}`;
      icon = <YouTubeIcon className="w-5 h-5 text-[#FF0000]" />;
    } else if (network === 'github') {
      href = value.startsWith('http') ? value : `https://github.com/${value}`;
      icon = <GitHubIcon className="w-5 h-5 text-white" />;
    } else if (network === 'linkedin') {
      href = value.startsWith('http') ? value : `https://linkedin.com/in/${value}`;
      icon = <LinkedInIcon className="w-5 h-5 text-[#0077B5]" />;
    } else if (network === 'tiktok') {
      href = value.startsWith('http') ? value : `https://tiktok.com/@${value.replace(/^@/, '')}`;
      icon = <TikTokIcon className="w-5 h-5 text-white" />;
    } else if (network === 'twitter' || network === 'x') {
      href = value.startsWith('http') ? value : `https://x.com/${value.replace(/^@/, '')}`;
      icon = <TwitterXIcon className="w-5 h-5 text-white" />;
    }

    return (
      <a
        key={network}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {icon}
      </a>
    );
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} transition-colors duration-300 flex flex-col items-center py-12 px-4`}>
      {/* Top Floating Controls */}
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <Link
          href="/"
          className="text-xs font-semibold tracking-wider text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
        >
          urls.uz
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQr(true)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all"
            title="QR Kod"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all"
            title="Ulashish"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Profile Container */}
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-4 group">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
            <BioAvatar src={bioPage.avatar_url} name={bioPage.title} className="w-full h-full rounded-full object-cover bg-slate-800" />
          </div>
        </div>

        {/* Title & Verified Badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <h1 className={`text-xl font-bold tracking-tight ${currentTheme.text}`}>{bioPage.title}</h1>
          {bioPage.verified && (
            <CheckCircle2 className="w-5 h-5 text-indigo-400 fill-indigo-500/20" />
          )}
        </div>

        {/* Handle */}
        <p className="text-xs font-medium text-indigo-400/90 mb-3">@{bioPage.handle}</p>

        {/* Bio Description */}
        {bioPage.bio && (
          <p className={`text-sm max-w-xs mb-6 leading-relaxed ${currentTheme.subtext}`}>
            {bioPage.bio}
          </p>
        )}

        {/* Social Links Bar */}
        {Object.keys(bioPage.social_links_parsed).length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            {Object.entries(bioPage.social_links_parsed).map(([network, value]) =>
              value ? renderSocialIcon(network, value) : null
            )}
          </div>
        )}

        {/* Bio Link Buttons */}
        <div className="w-full space-y-3.5 mb-12">
          {bioPage.links && bioPage.links.length > 0 ? (
            bioPage.links.map((link) => {
              const isPulse = link.animation === 'pulse';
              const isGradient = link.style === 'gradient';

              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className={`w-full relative group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                    isGradient
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white border-indigo-400/30 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40'
                      : currentTheme.button
                  } ${isPulse ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-center gap-3.5 pl-1">
                    <span className="font-semibold text-sm tracking-wide text-left">{link.title}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          ) : (
            <div className="p-6 rounded-2xl border border-white/10 text-slate-400 text-xs">
              Hozircha havolalar qo‘shilmagan.
            </div>
          )}
        </div>

        {/* Footer Brand */}
        <div className="mt-auto pt-6 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors shadow-sm"
          >
            <span>O‘zingizning bepul bio sahifangizni yarating —</span>
            <span className="font-bold text-indigo-400">urls.uz</span>
          </Link>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowQr(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 z-10 text-center shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setShowQr(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-1">@{bioPage.handle} QR Kodi</h3>
            <p className="text-xs text-slate-400 mb-4">Profilni ochish uchun smartfon kamerasi bilan skanerlang</p>
            <QrCanvas
              url={currentUrl}
              size={240}
              fgColor="#0f172a"
              bgColor="#ffffff"
              centerLogo="telegram"
              frameText={bioPage.title}
              frameStyle="bottom"
            />
          </div>
        </div>
      )}
    </div>
  );
}
