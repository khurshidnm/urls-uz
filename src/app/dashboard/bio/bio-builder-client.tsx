'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ExternalLink, Save, Check, Copy, QrCode, Share2, User as UserIcon, Palette } from 'lucide-react';
import type { ClientBioPage } from '@/lib/client-types';
import { useBioBuilder } from './use-bio-builder';
import ProfileTab from './profile-tab';
import LinksTab from './links-tab';
import SocialTab from './social-tab';
import ThemesTab from './themes-tab';
import DevicePreview from './device-preview';
import BioModals from './bio-modals';
import { SITE_HOST } from '@/lib/site';

interface Props {
  initialBio: ClientBioPage | undefined;
  /** Starting name and picture for a new bio page. */
  owner: { name: string; avatar: string };
}

export default function BioBuilderClient({ initialBio, owner }: Props) {
  const b = useBioBuilder(initialBio, owner);
  const { handle, BIO_LINKS_LIMIT, links, activeTab, setActiveTab, isSaving, savedSuccess, setQrModalOpen, copiedLink, handleCopyBioLink, handleSave, t } = b;

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
            <span className="text-[11px]">{copiedLink ? 'Nusxalandi!' : `${SITE_HOST}/b/${handle}`}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
          {activeTab === 'profile' && <ProfileTab b={b} />}
          {activeTab === 'links' && <LinksTab b={b} />}
          {activeTab === 'social' && <SocialTab b={b} />}
          {activeTab === 'themes' && <ThemesTab b={b} />}
        </div>
        <DevicePreview b={b} />
      </div>

      <BioModals b={b} />
    </div>
  );
}
