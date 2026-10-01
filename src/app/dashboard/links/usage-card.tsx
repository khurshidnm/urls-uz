import React from 'react';
import type { WorkspaceUsage } from '@/lib/client-types';

const PLAN_NAMES: Record<WorkspaceUsage['plan'], string> = { free: 'Bepul tarif', pro: 'Pro tarif', enterprise: 'Enterprise' };

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
  const { usage: u, limits } = usage;
  const atLimit = limits.activeLinks !== null && u.activeLinks >= limits.activeLinks;

  return (
    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center gap-4">
      <div className="md:w-56 shrink-0">
        <div className="text-sm font-semibold text-white">{PLAN_NAMES[usage.plan]}</div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {atLimit
            ? 'Limit to‘ldi: yangi havola uchun eskisini arxivlang.'
            : usage.plan === 'free'
              ? 'Arxivlangan havolalar limitga hisoblanmaydi.'
              : 'Cheksiz havolalar.'}
        </p>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Meter label="Faol havolalar" used={u.activeLinks} limit={limits.activeLinks} color="bg-emerald-500" />
        <Meter label="Deep Link" used={u.deepLinks} limit={limits.deepLinks} color="bg-indigo-500" />
        <Meter label="Qurilmalar" used={u.deviceTargeting} limit={limits.deviceTargeting} color="bg-purple-500" />
      </div>
    </div>
  );
}
