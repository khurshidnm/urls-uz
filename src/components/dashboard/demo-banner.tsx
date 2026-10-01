'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { Sparkles, Shield, RotateCcw, Plus, Check, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

interface DemoBannerProps {
  onStartFree?: () => void;
}

export function DemoBanner({ onStartFree }: DemoBannerProps) {
  const {
    user,
    openAuthModal,
    isSuperAdmin,
    demoEditMode,
    setDemoEditMode,
    resetDemoData,
  } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const { t } = useLanguage();

  // CASE 1: Super Admin in Demo Edit Mode
  if (isSuperAdmin && demoEditMode) {
    const handleReset = async () => {
      if (
        !confirm(
          'Haqiqatan ham barcha Demo maʼlumotlarini (havolalar va bio sahifani) asl holatiga qaytarmoqchimisiz?'
        )
      ) {
        return;
      }
      setIsResetting(true);
      await resetDemoData();
      setIsResetting(false);
    };

    return (
      <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-zinc-950 border-b border-purple-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none animate-fade-in shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-extrabold text-white font-mono text-[11px] bg-purple-500/25 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 shadow-sm">
              <Shield className="w-3 h-3 text-purple-400" />
              SUPER ADMIN · DEMO BOSHQARUVI
            </span>
            <span className="text-zinc-200 font-semibold truncate">
              Demo maʼlumotlarini tahrirlash faol
            </span>
            <span className="text-zinc-500 hidden lg:inline">·</span>
            <span className="text-zinc-400 hidden lg:inline truncate">
              Kiritgan barcha o‘zgarishlaringiz barcha yangi mehmonlar uchun jonli demo sifatida aks etadi.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-create-link'));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Yangi Demo Havola</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            title="ApexTech Solutions boshlang‘ich namunaviy maʼlumotlariga qaytarish"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg border border-zinc-700 transition-all cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-zinc-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Tiklanmoqda...' : 'Dastlabki holatga qaytarish'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoEditMode(false)}
            className="px-2.5 py-1 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    );
  }

  // CASE 2: Super Admin not currently in Demo Edit Mode -> Offer quick toggle
  if (isSuperAdmin && !demoEditMode) {
    return (
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Super Admin hisobi: Demo versiyadagi maʼlumotlarni boshqarish mumkin</span>
        </div>
        <button
          type="button"
          onClick={() => setDemoEditMode(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-md text-xs font-semibold transition-colors cursor-pointer"
        >
          <Shield className="w-3 h-3" />
          <span>Demo Maʼlumotlarini Tahrirlash Rejimini Yoqish</span>
        </button>
      </div>
    );
  }

  // CASE 3: Authenticated standard user
  if (user) return null;

  // CASE 4: Guest visitor in Read-Only Demo Mode
  const handleStart = () => {
    if (onStartFree) {
      onStartFree();
    } else {
      openAuthModal(undefined, undefined, 'signup');
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none animate-fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-bold text-white font-mono text-[11px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
            {t.shell.demoBadge}
          </span>
          <span className="text-zinc-300 font-medium truncate">
            {t.shell.demoReadOnly}
          </span>
          <span className="text-zinc-500 hidden md:inline">·</span>
          <span className="text-zinc-400 hidden md:inline truncate">
            {t.shell.demoNote}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t.shell.startFree}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
