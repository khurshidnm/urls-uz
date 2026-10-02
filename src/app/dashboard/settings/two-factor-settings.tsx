'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { useToast } from '@/components/ui/toast';
import { copyToClipboard, formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

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
  const { tr, locale } = useLanguage();
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
      if (!data.success) return showToast('error', data.error || tr('Bajarilmadi', 'Не удалось', 'Something went wrong'));
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
      showToast('success', tr('Ikki bosqichli himoya yoqildi', 'Двухфакторная защита включена', 'Two-factor authentication is on'));
      setStep({ kind: 'codes', codes: d.recoveryCodes! });
    });
  const confirmAction = (action: 'disable' | 'recovery-codes') =>
    run({ action, code }, (d) => {
      if (action === 'disable') {
        showToast('success', tr('Ikki bosqichli himoya o‘chirildi', 'Двухфакторная защита отключена', 'Two-factor authentication is off'));
        setStep({ kind: 'idle' });
        router.refresh();
      } else {
        setStep({ kind: 'codes', codes: d.recoveryCodes! });
      }
    });

  const codeInput = (onEnter: () => void, placeholder = tr('6 xonali kod', '6-значный код', '6-digit code')) => (
    <input
      value={code}
      onChange={(e) => setCode(e.target.value.slice(0, 20))}
      onKeyDown={(e) => e.key === 'Enter' && code.length >= 6 && onEnter()}
      placeholder={placeholder}
      aria-label={tr('Tasdiqlash kodi', 'Код подтверждения', 'Verification code')}
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
          <h3 className="text-sm font-bold text-white">{tr('Ikki bosqichli himoya (2FA)', 'Двухфакторная защита (2FA)', 'Two-factor authentication (2FA)')}</h3>
          <p className="text-[11px] text-slate-400">
            {tr('Kirishda Telegram, telefon yoki Google’dan tashqari Google Authenticator ilovasidagi kod ham so‘raladi.', 'При входе, помимо Telegram, телефона или Google, запрашивается код из Google Authenticator.', 'On sign-in, besides Telegram, phone or Google, you’ll also be asked for a code from Google Authenticator.')}
          </p>
        </div>
      </div>

      {step.kind === 'codes' ? (
        <div className="space-y-3">
          <p className="text-xs text-amber-300">
            {tr('Tiklash kodlarini xavfsiz joyga saqlang — ular qayta ko‘rsatilmaydi. Telefoningiz yo‘qolsa, har bir kod bilan bir marta kirish mumkin.', 'Сохраните коды восстановления в надёжном месте — они больше не покажутся. Если потеряете телефон, каждым кодом можно войти один раз.', 'Keep these recovery codes somewhere safe — they won’t be shown again. If you lose your phone, each code signs you in once.')}
          </p>
          <ul className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-white text-center" aria-label={tr('Tiklash kodlari', 'Коды восстановления', 'Recovery codes')}>
            {step.codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(step.codes.join('\n'), 'codes')} className={secondary}>
              {copied === 'codes' ? tr('Nusxalandi', 'Скопировано', 'Copied') : tr('Nusxalash', 'Копировать', 'Copy')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep({ kind: 'idle' });
                router.refresh();
              }}
              className={primary}
            >
              {tr('Saqladim', 'Я сохранил(а)', 'I’ve saved them')}
            </button>
          </div>
        </div>
      ) : step.kind === 'setup' ? (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
          <div className="justify-self-center">
            <QrCanvas value={step.uri} size={160} fgColor="#0f172a" bgColor="#ffffff" centerLogo="none" frameStyle="none" showControls={false} />
          </div>
          <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
            <li>{tr('Telefoningizga Google Authenticator (yoki Microsoft Authenticator, 1Password) o‘rnating.', 'Установите на телефон Google Authenticator (или Microsoft Authenticator, 1Password).', 'Install Google Authenticator (or Microsoft Authenticator, 1Password) on your phone.')}</li>
            <li>
              {tr(
                'Ilovada «+» → «QR kodni skanerlash»ni tanlab, chapdagi kodni skanerlang. Skanerlab bo‘lmasa, kalitni qo‘lda kiriting:',
                'В приложении нажмите «+» → «Сканировать QR-код» и отсканируйте код слева. Если не получается, введите ключ вручную:',
                'In the app tap “+” → “Scan a QR code” and scan the code on the left. If that doesn’t work, enter the key by hand:'
              )}
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
              {tr('Ilova ko‘rsatgan 6 xonali kodni kiriting:', 'Введите 6-значный код из приложения:', 'Enter the 6-digit code the app shows:')}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {codeInput(confirmSetup)}
                <button type="button" onClick={confirmSetup} disabled={busy || code.length < 6} className={primary}>
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {tr('Tasdiqlash va yoqish', 'Подтвердить и включить', 'Confirm and turn on')}
                </button>
                <button type="button" onClick={() => setStep({ kind: 'idle' })} className="text-[11px] text-slate-500 hover:text-white">
                  {tr('Bekor qilish', 'Отмена', 'Cancel')}
                </button>
              </div>
            </li>
          </ol>
        </div>
      ) : enabled ? (
        <div className="space-y-3">
          <p className="text-xs text-emerald-300">
            {tr('Yoqilgan', 'Включена', 'On')}
            {enabledAt ? ` · ${formatDate(enabledAt, locale)}` : ''} ·{' '}
            {tr(`${recoveryCodesLeft} ta tiklash kodi qoldi`, `осталось кодов восстановления: ${recoveryCodesLeft}`, `${recoveryCodesLeft} recovery codes left`)}
          </p>
          {step.kind === 'confirm' ? (
            <div className="flex flex-wrap items-center gap-2">
              {codeInput(() => confirmAction(step.action), tr('Ilovadagi kod', 'Код из приложения', 'Code from the app'))}
              <button type="button" onClick={() => confirmAction(step.action)} disabled={busy || code.length < 6} className={step.action === 'disable' ? `${primary} !bg-rose-600 !text-white` : primary}>
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {step.action === 'disable' ? tr('O‘chirish', 'Отключить', 'Turn off') : tr('Yangi kodlarni olish', 'Получить новые коды', 'Get new codes')}
              </button>
              <button type="button" onClick={() => setStep({ kind: 'idle' })} className="text-[11px] text-slate-500 hover:text-white">
                {tr('Bekor qilish', 'Отмена', 'Cancel')}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setStep({ kind: 'confirm', action: 'recovery-codes' })} className={secondary}>
                {tr('Yangi tiklash kodlari', 'Новые коды восстановления', 'New recovery codes')}
              </button>
              <button type="button" onClick={() => setStep({ kind: 'confirm', action: 'disable' })} className={`${secondary} !text-rose-300 !border-rose-500/30`}>
                {tr('2FA ni o‘chirish', 'Отключить 2FA', 'Turn off 2FA')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400">{tr('O‘chiq. Yoqsangiz, akkauntingizga faqat telefoningizdagi kod bilan kirish mumkin bo‘ladi.', 'Выключена. Если включить, войти в аккаунт можно будет только с кодом с телефона.', 'Off. Turn it on and signing in will also need the code from your phone.')}</p>
          <button type="button" onClick={startSetup} disabled={busy} className={`${primary} shrink-0`}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {tr('2FA ni yoqish', 'Включить 2FA', 'Turn on 2FA')}
          </button>
        </div>
      )}
    </div>
  );
}
