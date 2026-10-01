'use client';

import React from 'react';
import { BioAvatar } from '@/components/ui/bio-avatar';
import { cleanHandle, handleProblem, HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from '@/lib/bio/handle';
import { Check, Upload, Crop } from 'lucide-react';
import { AVATAR_PRESETS } from './bio-builder-constants';
import type { BioBuilder } from './use-bio-builder';
import { SITE_HOST } from '@/lib/site';

/** Handle, title, bio text and avatar. */
export default function ProfileTab({ b }: { b: BioBuilder }) {
  const { handle, savedHandle, setHandle, title, setTitle, bio, setBio, avatarUrl, setAvatarUrl, setCropModalOpen, rawImageSrc, avatarSizeKb, setAvatarSizeKb, fileInputRef, handleFileSelect } = b;
  // The saved handle stays valid even if it predates the current rules
  const problem = handle && handle !== savedHandle ? handleProblem(handle) : null;
  const handleHint = problem
    ? { error: true, text: problem.message }
    : { error: false, text: `Kamida ${HANDLE_MIN_LENGTH} ta belgi: faqat lotin harflari va raqamlar.` };
  return (
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
              <span className="text-zinc-500 select-none">{SITE_HOST}/b/</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(cleanHandle(e.target.value))}
                maxLength={HANDLE_MAX_LENGTH}
                aria-describedby="bio-handle-hint"
                className="w-full bg-transparent text-white focus:outline-none pl-0.5"
                placeholder="username"
              />
            </div>
            <p id="bio-handle-hint" className={`mt-1.5 text-[11px] leading-relaxed ${handleHint.error ? 'text-amber-400' : 'text-zinc-500'}`}>
              {handleHint.text}
            </p>
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
              placeholder="Ismingiz yoki brend nomi"
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
              <BioAvatar src={avatarUrl} name={title} className="w-16 h-16 rounded-full object-cover bg-zinc-900 border-2 border-zinc-700 shadow-md ring-2 ring-indigo-500/20" />
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
  );
}
