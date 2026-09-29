'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Check,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon, GitHubIcon } from '@/components/ui/icons';
import confetti from 'canvas-confetti';

interface Props {
  initialBio: any;
}

export default function BioBuilderClient({ initialBio }: Props) {
  const { t, locale } = useLanguage();

  let parsedSocial: Record<string, string> = {};
  try {
    parsedSocial = JSON.parse(initialBio?.social_links || '{}');
  } catch {
    parsedSocial = {};
  }

  const [handle, setHandle] = useState(initialBio?.handle || 'urls');
  const [title, setTitle] = useState(initialBio?.title || 'Mening Sahifam');
  const [bio, setBio] = useState(initialBio?.bio || 'Tadbirkor va kontent yaratuvchi');
  const [avatarUrl, setAvatarUrl] = useState(
    initialBio?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
  );
  const [theme, setTheme] = useState(initialBio?.theme || 'midnight');
  const [socialTelegram, setSocialTelegram] = useState(parsedSocial.telegram || '');
  const [socialInstagram, setSocialInstagram] = useState(parsedSocial.instagram || '');
  const [socialYoutube, setSocialYoutube] = useState(parsedSocial.youtube || '');
  const [socialGithub, setSocialGithub] = useState(parsedSocial.github || '');

  const [links, setLinks] = useState<Array<{ title: string; url: string; style: string; animation: string }>>(
    initialBio?.links && initialBio.links.length > 0
      ? initialBio.links.map((l: any) => ({
          title: l.title,
          url: l.url,
          style: l.style || 'glass',
          animation: l.animation || 'none',
        }))
      : [
          { title: 'Rasmiy Veb-Sayt', url: 'https://urls.uz', style: 'gradient', animation: 'pulse' },
          { title: 'Telegram Kanal', url: 'https://t.me/urls_uz', style: 'glass', animation: 'none' },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const themes = [
    { id: 'midnight', label: 'Midnight Obsidian' },
    { id: 'emerald', label: 'Uzbekistan Emerald' },
    { id: 'neon', label: 'Cyberpunk Neon' },
    { id: 'glass', label: 'Frosted Glass' },
    { id: 'sunset', label: 'Golden Sunset' },
  ];

  const addLink = () => {
    setLinks([
      ...links,
      { title: 'Yangi Havola', url: 'https://', style: 'glass', animation: 'none' },
    ]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: string, value: string) => {
    const updated = [...links];
    (updated[index] as any)[field] = value;
    setLinks(updated);
  };

  const handleSave = async () => {
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
            github: socialGithub,
          },
          links,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      alert('Saqlashda xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t.bioPages}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Instagram, Telegram va TikTok profillaringiz uchun yagona Link-in-Bio sahifangizni boshqaring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/b/${handle}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <span>Sahifani ochish</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Saqlandi!' : isSaving ? 'Saqlanmoqda...' : t.save}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Settings Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Handle and Basic Info */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asosiy maʼlumotlar</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Shaxsiy Handle / Manzil
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <span className="text-slate-500 font-mono">urls.uz/b/</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full bg-transparent text-white font-mono focus:outline-none pl-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sarlavha (Ism yoki Brend)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bio / Qisqa tavsif
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Profil rasmi (Avatar URL)
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Theme Selector */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dizayn Mavzusi</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    theme === th.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ijtimoiy Tarmoqlar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <TelegramIcon className="w-4 h-4 text-[#229ED9] shrink-0" />
                <input
                  type="text"
                  value={socialTelegram}
                  onChange={(e) => setSocialTelegram(e.target.value)}
                  placeholder="Telegram (masalan: kanal_nomi)"
                  className="w-full bg-transparent text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <InstagramIcon className="w-4 h-4 text-[#E1306C] shrink-0" />
                <input
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="Instagram (masalan: profil_nomi)"
                  className="w-full bg-transparent text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <YouTubeIcon className="w-4 h-4 text-[#FF0000] shrink-0" />
                <input
                  type="text"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="YouTube (@kanal)"
                  className="w-full bg-transparent text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <GitHubIcon className="w-4 h-4 text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={socialGithub}
                  onChange={(e) => setSocialGithub(e.target.value)}
                  placeholder="GitHub (username)"
                  className="w-full bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Links List Manager */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tugmalar & Havolalar</h3>
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tugma qo‘shish</span>
              </button>
            </div>

            <div className="space-y-3">
              {links.map((link, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">#{idx + 1} Tugma</span>
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => updateLink(idx, 'title', e.target.value)}
                      placeholder="Tugma matni"
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(idx, 'url', e.target.value)}
                      placeholder="Havola (https://...)"
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-400">
                      <input
                        type="checkbox"
                        checked={link.style === 'gradient'}
                        onChange={(e) => updateLink(idx, 'style', e.target.checked ? 'gradient' : 'glass')}
                        className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-800"
                      />
                      <span>Yorqin Gradient</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-slate-400">
                      <input
                        type="checkbox"
                        checked={link.animation === 'pulse'}
                        onChange={(e) => updateLink(idx, 'animation', e.target.checked ? 'pulse' : 'none')}
                        className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-800"
                      />
                      <span>Pulsatsiya animatsiyasi</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Phone Mockup Preview Sticky */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-24">
          <div className="relative w-[290px] rounded-[44px] p-3.5 bg-slate-800 border-[3px] border-slate-700/80 shadow-2xl">
            {/* Dynamic Island */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20" />

            {/* Screen */}
            <div className={`w-full ${theme === 'emerald' ? 'bg-emerald-950' : theme === 'neon' ? 'bg-purple-950' : theme === 'sunset' ? 'bg-amber-950' : 'bg-[#090d16]'} rounded-[36px] overflow-hidden p-5 pt-10 text-center transition-colors duration-300 min-h-[460px] flex flex-col`}>
              <div className="relative mx-auto w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-pink-500 mb-2">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <div className="flex items-center justify-center gap-1 mb-0.5">
                <h4 className="font-bold text-white text-sm">{title}</h4>
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-[11px] text-indigo-400 font-medium mb-1">@{handle}</p>
              <p className="text-[10px] text-slate-400 mb-3 px-1 leading-tight line-clamp-2">{bio}</p>

              {/* Social icons */}
              <div className="flex justify-center gap-2 mb-3">
                {socialTelegram && (
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[#229ED9]">
                    <TelegramIcon className="w-3 h-3" />
                  </span>
                )}
                {socialInstagram && (
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[#E1306C]">
                    <InstagramIcon className="w-3 h-3" />
                  </span>
                )}
                {socialYoutube && (
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[#FF0000]">
                    <YouTubeIcon className="w-3 h-3" />
                  </span>
                )}
                {socialGithub && (
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <GitHubIcon className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="space-y-2 mb-4 text-xs font-semibold flex-1">
                {links.map((l, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left text-[11px] ${
                      l.style === 'gradient'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-200'
                    } ${l.animation === 'pulse' ? 'animate-pulse' : ''}`}
                  >
                    <span className="truncate">{l.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-60 ml-2" />
                  </div>
                ))}
              </div>

              <div className="text-[9px] text-slate-500 mt-auto">urls.uz/b/{handle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
