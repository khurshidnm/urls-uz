'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon, LinkedInIcon, GitHubIcon, TikTokIcon, TwitterXIcon } from '@/components/ui/icons';
import type { BioBuilder } from './use-bio-builder';

/** Social network handles shown as icons. */
export default function SocialTab({ b }: { b: BioBuilder }) {
  const { socialTelegram, setSocialTelegram, socialInstagram, setSocialInstagram, socialYoutube, setSocialYoutube, socialTiktok, setSocialTiktok, socialGithub, setSocialGithub, socialLinkedin, setSocialLinkedin, socialTwitter, setSocialTwitter, socialWebsite, setSocialWebsite } = b;
  return (
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
  );
}
