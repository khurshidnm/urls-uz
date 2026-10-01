'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { useToast } from '@/components/ui/toast';
import { copyToClipboard, formatDate } from '@/lib/utils';

interface Props {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
}

type Step = { kind: 'idle' } | { kind: 'setup'; secret: string; uri: string } | { kind: 'codes'; codes: string[] } | { kind: 'confirm'; action: 'disable' | 'recovery-codes' };

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

/** Two-step login with an authenticator app (Google Authenticator, ...), optional per user. */
export default function TwoFactorSettings({ enabled, enabledAt, recoveryCodesLeft }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, what: string) => {
    if (await copyToClipboard(text)) {
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const run = async (body: Record<string, unknown>, onOk: (data: { secret?: string; uri?: string; recoveryCodes?: string[] }) => void) => {
    setBusy(true);
    try {
      const data = await post(body);
      if (!data.success) return showToast('error', data.error || 'Bajarilmadi');
      setCode('');
      onOk(data);
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () => run({ action: 'setup' }, (d) => setStep({ kind: 'setup', secret: d.secret!, uri: d.uri! }));
  const confirmSetup = () =>
    run({ action: 'enable', code }, (d) => {
      showToast('success', 'Ikki bosqichli himoya yoqildi');
      setStep({ kind: 'codes', codes: d.recoveryCodes! });
    });
  const confirmAction = (action: 'disable' | 'recovery-codes') =>
    run({ action, code }, (d) => {
      if (action === 'disable') {
        showToast('success', 'Ikki bosqichli himoya o‘chirildi');
        setStep({ kind: 'idle' });
        router.refresh();
      } else {
        setStep({ kind: 'codes', codes: d.recoveryCodes! });
      }
    });

  const codeInput = (onEnter: () => void, placeholder = '6 xonali kod') => (
    <input
      value={code}
      onChange={(e) => setCode(e.target.value.slice(0, 20))}
      onKeyDown={(e) => e.key === 'Enter' && code.length >= 6 && onEnter()}
      placeholder={placeholder}
      aria-label="Tasdiqlash kodi"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      className="w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm font-mono tracking-widest focus:outline-none focus:border-indigo-500"
    />
  );
  const primary = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50';
  const secondary = 'px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:text-white';

  return (
    <div id="two-factor" className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        {enabled ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldOff className="w-4 h-4 text-slate-500" />}
        <div>
          <h3 className="text-sm font-bold text-white">Ikki bosqichli himoya (2FA)</h3>
          <p className="text-[11px] text-slate-400">
            Kirishda Telegram, telefon yoki Google’dan tashqari Google Authenticator ilovasidagi kod ham so‘raladi.
          </p>
        </div>
      </div>

      {step.kind === 'codes' ? (
        <div className="space-y-3">
          <p className="text-xs text-amber-300">
            Tiklash kodlarini xavfsiz joyga saqlang — ular qayta ko‘rsatilmaydi. Telefoningiz yo‘qolsa, har bir kod bilan bir marta kirish mumkin.
          </p>
          <ul className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-white text-center" aria-label="Tiklash kodlari">
            {step.codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(step.codes.join('\n'), 'codes')} className={secondary}>
              {copied === 'codes' ? 'Nusxalandi' : 'Nusxalash'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep({ kind: 'idle' });
                router.refresh();
              }}
              className={primary}
            >
              Saqladim
            </button>
          </div>
        </div>
      ) : step.kind === 'setup' ? (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
          <div className="justify-self-center">
            <QrCanvas value={step.uri} size={160} fgColor="#0f172a" bgColor="#ffffff" centerLogo="none" frameStyle="none" showControls={false} />
          </div>
          <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
            <li>Telefoningizga Google Authenticator (yoki Microsoft Authenticator, 1Password) o‘rnating.</li>
            <li>
              Ilovada «+» → «QR kodni skanerlash»ni tanlab, chapdagi kodni skanerlang. Skanerlab bo‘lmasa, kalitni qo‘lda kiriting:
              <button
                type="button"
                onClick={() => copy(step.secret, 'secret')}
                className="mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-white break-all text-left"
              >
                {step.secret.match(/.{1,4}/g)?.join(' ')}
                {copied === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              </button>
            </li>
            <li>
              Ilova ko‘rsatgan 6 xonali kodni kiriting:
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {codeInput(confirmSetup)}
                <button type="button" onClick={confirmSetup} disabled={busy || code.length < 6} className={primary}>
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Tasdiqlash va yoqish
                </button>
                <button type="button" onClick={() => setStep({ kind: 'idle' })} className="text-[11px] text-slate-500 hover:text-white">
                  Bekor qilish
                </button>
              </div>
            </li>
          </ol>
        </div>
      ) : enabled ? (
        <div className="space-y-3">
          <p className="text-xs text-emerald-300">
            Yoqilgan{enabledAt ? ` · ${formatDate(enabledAt)}` : ''} · {recoveryCodesLeft} ta tiklash kodi qoldi
          </p>
          {step.kind === 'confirm' ? (
            <div className="flex flex-wrap items-center gap-2">
              {codeInput(() => confirmAction(step.action), 'Ilovadagi kod')}
              <button type="button" onClick={() => confirmAction(step.action)} disabled={busy || code.length < 6} className={step.action === 'disable' ? `${primary} !bg-rose-600 !text-white` : primary}>
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {step.action === 'disable' ? 'O‘chirish' : 'Yangi kodlarni olish'}
              </button>
              <button type="button" onClick={() => setStep({ kind: 'idle' })} className="text-[11px] text-slate-500 hover:text-white">
                Bekor qilish
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setStep({ kind: 'confirm', action: 'recovery-codes' })} className={secondary}>
                Yangi tiklash kodlari
              </button>
              <button type="button" onClick={() => setStep({ kind: 'confirm', action: 'disable' })} className={`${secondary} !text-rose-300 !border-rose-500/30`}>
                2FA ni o‘chirish
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400">O‘chiq. Yoqsangiz, akkauntingizga faqat telefoningizdagi kod bilan kirish mumkin bo‘ladi.</p>
          <button type="button" onClick={startSetup} disabled={busy} className={`${primary} shrink-0`}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} 2FA ni yoqish
          </button>
        </div>
      )}
    </div>
  );
}
