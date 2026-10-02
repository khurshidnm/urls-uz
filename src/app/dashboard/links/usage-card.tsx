'use client';

import React from 'react';
import type { WorkspaceUsage } from '@/lib/client-types';
import { useLanguage } from '@/lib/language-context';

function Meter({ label, used, limit, color }: { label: string; used: number; limit: number | null; color: string }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const full = limit !== null && used >= limit;
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className={full ? 'text-amber-400 font-semibold' : 'text-zinc-300'}>
          {used} / {limit ?? '∞'}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${full ? 'bg-amber-500' : color}`} style={{ width: `${limit ? Math.max(pct, 2) : 0}%` }} />
      </div>
    </div>
  );
}

/** Plan usage from the server, the same numbers the API enforces. */
export default function UsageCard({ usage }: { usage: WorkspaceUsage }) {
  const { tr } = useLanguage();
  const { usage: u, limits } = usage;
  const planName = { free: tr('Bepul tarif', 'Бесплатный тариф', 'Free plan'), pro: tr('Pro tarif', 'Тариф Pro', 'Pro plan'), enterprise: 'Enterprise' }[usage.plan];
  const atLimit = limits.activeLinks !== null && u.activeLinks >= limits.activeLinks;

  return (
    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center gap-4">
      <div className="md:w-56 shrink-0">
        <div className="text-sm font-semibold text-white">{planName}</div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {atLimit
            ? tr('Limit to‘ldi: yangi havola uchun eskisini arxivlang.', 'Лимит исчерпан: архивируйте старую ссылку, чтобы создать новую.', 'Limit reached: archive an old link to add a new one.')
            : usage.plan === 'free'
              ? tr('Arxivlangan havolalar limitga hisoblanmaydi.', 'Архивные ссылки не учитываются в лимите.', 'Archived links don’t count toward the limit.')
              : tr('Cheksiz havolalar.', 'Безлимитные ссылки.', 'Unlimited links.')}
        </p>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Meter label={tr('Faol havolalar', 'Активные ссылки', 'Active links')} used={u.activeLinks} limit={limits.activeLinks} color="bg-emerald-500" />
        <Meter label="Deep Link" used={u.deepLinks} limit={limits.deepLinks} color="bg-indigo-500" />
        <Meter label={tr('Qurilmalar', 'Устройства', 'Devices')} used={u.deviceTargeting} limit={limits.deviceTargeting} color="bg-purple-500" />
      </div>
    </div>
  );
}
