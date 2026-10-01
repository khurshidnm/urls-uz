'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Props {
  workspaceId: string;
  /** A paid plan is active now (enables "end plan"). */
  hasActivePlan: boolean;
}

const MONTH_PRESETS = [1, 3, 6, 12];

/** Records a payment and gives (or extends) a paid plan; or ends the current one. */
export default function GrantPlanForm({ workspaceId, hasActivePlan }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [plan, setPlan] = useState<'pro' | 'enterprise'>('pro');
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'manual' | 'payme' | 'click' | 'uzum'>('manual');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, months, amount: Number(amount || 0), method, note }),
      });
      const data = await res.json();
      if (!data.success) return showToast('error', data.error || 'Saqlab bo‘lmadi');
      showToast('success', 'To‘lov qayd etildi, tarif berildi');
      setAmount('');
      setNote('');
      router.refresh();
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const endPlan = async () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 3000);
      return;
    }
    setConfirmEnd(false);
    const res = await fetch(`/api/admin/workspaces/${workspaceId}/plan`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) return showToast('error', data.error || 'Bajarilmadi');
    showToast('success', 'Tarif tugatildi');
    router.refresh();
  };

  const field = 'w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600';

  return (
    <form onSubmit={submit} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
        <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Tarif berish (to‘lovni qayd etish)
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-[11px] text-zinc-400 space-y-1">
          <span>Tarif</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className={field}>
            <option value="pro">Pro</option>
            <option value="enterprise">Biznes</option>
          </select>
        </label>
        <label className="text-[11px] text-zinc-400 space-y-1">
          <span>To‘lov usuli</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={field}>
            <option value="manual">Qo‘lda (naqd / o‘tkazma)</option>
            <option value="payme">Payme</option>
            <option value="click">Click</option>
            <option value="uzum">Uzum</option>
          </select>
        </label>
        <div className="text-[11px] text-zinc-400 space-y-1">
          <span>Muddat (oy)</span>
          <div className="flex gap-1.5">
            {MONTH_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                aria-pressed={months === m}
                className={`flex-1 py-2 rounded-lg text-xs border ${months === m ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <label className="text-[11px] text-zinc-400 space-y-1">
          <span>Summa (so‘m)</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="0 — sovg‘a yoki sinov"
            className={`${field} font-mono`}
          />
        </label>
      </div>
      <label className="block text-[11px] text-zinc-400 space-y-1">
        <span>Izoh (ixtiyoriy)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Chek raqami, kelishuv…" className={field} />
      </label>
      <p className="text-[11px] text-zinc-500">Xuddi shu tarif amalda bo‘lsa, muddat uning tugash sanasidan uzaytiriladi.</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Tarif berish
        </button>
        {hasActivePlan && (
          <button
            type="button"
            onClick={endPlan}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${confirmEnd ? 'bg-rose-600 text-white border-rose-600' : 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10'}`}
          >
            {confirmEnd ? 'Tasdiqlash: tarifni tugatish' : 'Tarifni hozir tugatish'}
          </button>
        )}
      </div>
    </form>
  );
}
