import React from 'react';
import { PLAN_LABELS } from './format';

export default function PlanBadge({ plan, expired = false }: { plan: string; expired?: boolean }) {
  const tone = expired
    ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
    : plan === 'free'
      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  return <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tone}`}>{PLAN_LABELS[plan] ?? plan}</span>;
}
