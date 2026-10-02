'use client';

import React from 'react';
import { BioAvatar } from '@/components/ui/bio-avatar';
import { ExternalLink, Globe, Smartphone, Tablet, Share2 } from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon, LinkedInIcon, GitHubIcon, TikTokIcon, TwitterXIcon } from '@/components/ui/icons';
import type { BioBuilder } from './use-bio-builder';
import { SITE_URL, SITE_HOST, SITE_NAME } from '@/lib/site';

/** Live iPhone / iPad preview of the bio page. */
export default function DevicePreview({ b }: { b: BioBuilder }) {
  const { handle, title, bio, avatarUrl, buttonRadius, socialTelegram, socialInstagram, socialYoutube, socialTiktok, socialGithub, socialLinkedin, socialTwitter, socialWebsite, links, deviceMode, setDeviceMode, deviceFinish, setDeviceFinish, previewScale, setPreviewScale, currentThemeObj, getDeviceFinishBorder, renderIconComponent } = b;
  return (
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
                  <span>🔒 {SITE_HOST}/b/{handle}</span>
                </div>
              </div>

              {/* Scrollable Content inside iPhone */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 scrollbar-none">
                {/* Avatar with Gradient Ring */}
                <div className="relative mx-auto w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
                  <BioAvatar src={avatarUrl} name={title} className="w-full h-full rounded-full object-cover bg-zinc-900 border border-white/20" />
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
                  <span className="text-white font-semibold">{SITE_NAME}</span>
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
                  <span>{SITE_URL}/b/{handle}</span>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Scrollable Content inside iPad */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 scrollbar-none text-center">
                {/* Avatar with Gradient Ring */}
                <div className="relative mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
                  <BioAvatar src={avatarUrl} name={title} className="w-full h-full rounded-full object-cover bg-zinc-900 border border-white/20" />
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
                  <span className="text-white font-semibold">{SITE_NAME}</span>
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
  );
}
