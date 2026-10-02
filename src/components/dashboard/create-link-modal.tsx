'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, ChevronDown, ChevronUp, Copy, Link2, Loader2, Settings2, Smartphone, Sparkles, X, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/lib/language-context';

type Tr = (uz: string, ru: string, en: string) => string;
import { QrCanvas } from '@/components/ui/qr-canvas';
import { copyToClipboard, shortUrl } from '@/lib/utils';
import { createPayload, EMPTY_LINK_FORM, type LinkFormValues } from '@/components/links/link-form-model';
import {
  DeepLinkSection,
  DeviceTargetingSection,
  OrganizeFields,
  ProtectionSection,
  SlugField,
  UtmSection,
  useSlugStatus,
} from '@/components/links/link-form-sections';
import { quotaState, useFolders, useWorkspaceUsage } from '@/components/links/use-workspace-data';
import type { ClientLink } from '@/lib/client-types';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function detectApp(rawUrl: string): 'Telegram' | 'Instagram' | 'YouTube' | null {
  const url = rawUrl.toLowerCase().trim();
  if (url.includes('t.me/') || url.includes('telegram.me/')) return 'Telegram';
  if (url.includes('instagram.com/')) return 'Instagram';
  if (url.includes('youtube.com/') || url.includes('youtu.be/')) return 'YouTube';
  return null;
}

/** Labels for options that are set, shown while "advanced" is collapsed. */
function activeOptionLabels(v: LinkFormValues, tr: Tr): string[] {
  const labels: string[] = [];
  if (v.slug) labels.push(`/${v.slug}`);
  if (v.title) labels.push(tr('Sarlavha', 'Название', 'Title'));
  if (v.tags.length) labels.push(tr(`${v.tags.length} teg`, `тегов: ${v.tags.length}`, `${v.tags.length} tags`));
  if (v.folder_id) labels.push(tr('Papka', 'Папка', 'Folder'));
  if (v.open_in_app) labels.push('Deep Link');
  if (v.device_targeting) labels.push(tr('Qurilmalar', 'Устройства', 'Devices'));
  if (v.password) labels.push(tr('Parol', 'Пароль', 'Password'));
  if (v.expires_at) labels.push(tr('Muddat', 'Срок', 'Expiry'));
  if (v.click_limit) labels.push(tr('Limit', 'Лимит', 'Limit'));
  if (v.utm_source || v.utm_medium || v.utm_campaign) labels.push('UTM');
  return labels;
}

/**
 * Create a link: one URL field and a button. Everything else is optional and
 * tucked into "advanced", using the same sections as the link settings page.
 */
export default function CreateLinkModal({ isOpen, onClose, onCreated }: CreateLinkModalProps) {
  if (!isOpen) return null;
  return <CreateLinkDialog onClose={onClose} onCreated={onCreated} />;
}

function CreateLinkDialog({ onClose, onCreated }: Omit<CreateLinkModalProps, 'isOpen'>) {
  const { isSuperAdmin, demoEditMode } = useAuth();
  const { showToast } = useToast();
  const { tr, tm } = useLanguage();
  const { usage } = useWorkspaceUsage();
  const { folders } = useFolders();

  const [values, setValues] = useState<LinkFormValues>(EMPTY_LINK_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<ClientLink | null>(null);
  const slugStatus = useSlugStatus(values.slug);

  const set = <K extends keyof LinkFormValues>(key: K, value: LinkFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const detectedApp = detectApp(values.destination_url);
  const linksQuota = quotaState(usage?.usage.activeLinks, usage?.limits.activeLinks);
  const deepLinkQuota = quotaState(usage?.usage.deepLinks, usage?.limits.deepLinks);
  const optionLabels = activeOptionLabels(values, tr);

  // Esc closes the dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Suggest opening in the app when a Telegram/Instagram/YouTube URL is first typed
  const handleDestinationChange = (value: string) => {
    const nextApp = detectApp(value);
    setValues((v) => ({ ...v, destination_url: value, open_in_app: nextApp && nextApp !== detectApp(v.destination_url) && !deepLinkQuota.reached ? true : v.open_in_app }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.destination_url.trim()) return;
    if (values.slug && slugStatus.available === false) {
      setError(slugStatus.message || tr('Ushbu slug band qilingan yoki yaroqsiz', 'Этот адрес занят или недопустим', 'This slug is taken or invalid'));
      setShowAdvanced(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // The server decides the owner from the session (and the admin's demo-edit mode)
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload(values)),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || tr('Havolani yaratishda xatolik yuz berdi', 'Не удалось создать ссылку', 'Couldn’t create the link'));
        return;
      }
      setCreated(data.link);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ['#6366f1', '#06b6d4', '#10b981'] });
      const url = shortUrl(data.link.slug);
      const copied = await copyToClipboard(url);
      showToast(copied ? 'copied' : 'success', copied ? tr(`${url} nusxalandi!`, `${url} скопировано!`, `${url} copied!`) : tr('Havola yaratildi!', 'Ссылка создана!', 'Link created!'));
      onCreated?.();
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setValues(EMPTY_LINK_FORM);
    setCreated(null);
    setError('');
    setShowAdvanced(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true" aria-label={tr('Yangi qisqa havola', 'Новая короткая ссылка', 'New short link')}>
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">{tr('Yangi qisqa havola', 'Новая короткая ссылка', 'New short link')}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                {isSuperAdmin && demoEditMode ? (
                  <span className="px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">{tr('Demo havolasi yaratilmoqda', 'Создаётся демо-ссылка', 'Creating a demo link')}</span>
                ) : usage ? (
                  <span className={linksQuota.reached ? 'text-rose-400' : 'text-zinc-500'}>{tr('Faol havolalar', 'Активные ссылки', 'Active links')}: {linksQuota.label}</span>
                ) : null}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title={tr('Yopish (Esc)', 'Закрыть (Esc)', 'Close (Esc)')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {created ? (
          <CreatedView link={created} onAnother={reset} onClose={onClose} />
        ) : (
          <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {linksQuota.reached && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">{tr(`Tarif limiti to‘lgan (${linksQuota.label} faol havola)`, `Лимит тарифа исчерпан (${linksQuota.label} активных ссылок)`, `Plan limit reached (${linksQuota.label} active links)`)}</p>
                    <p className="text-[11px] text-amber-200/80 mt-1">{tr('Yangi havola uchun eskilarini arxivlang yoki o‘chiring. Cheksiz havolalar Pro tarifda tez kunda chiqadi.', 'Архивируйте или удалите старые ссылки, чтобы создать новую. Безлимит скоро появится на тарифе Pro.', 'Archive or delete old links to add a new one. Unlimited links are coming soon with Pro.')}</p>
                  </div>
                </div>
              )}

              {/* The one required field */}
              <div>
                <label htmlFor="create-destination" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {tr('Qaysi havolani qisqartiramiz?', 'Какую ссылку сократить?', 'Which link should we shorten?')}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="create-destination"
                      type="text"
                      value={values.destination_url}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      placeholder={tr('https://t.me/kanal, instagram.com/post yoki sayt.uz/promo', 'https://t.me/kanal, instagram.com/post или sayt.uz/promo', 'https://t.me/channel, instagram.com/post or site.uz/promo')}
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-sm focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || linksQuota.reached || !values.destination_url.trim()}
                    className="px-5 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {tr('Qisqartirish', 'Сократить', 'Shorten')}
                  </button>
                </div>
                {detectedApp && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    {values.open_in_app ? tr(`${detectedApp} ilovasida ochiladi (Smart Deep Link yoqildi)`, `Откроется в ${detectedApp} (Smart Deep Link включён)`, `Opens in ${detectedApp} (Smart Deep Link on)`) : tr(`${detectedApp} aniqlandi — Smart Deep Link tavsiya etiladi`, `Обнаружен ${detectedApp} — рекомендуем Smart Deep Link`, `${detectedApp} detected — Smart Deep Link recommended`)}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {tm(error)}
                </div>
              )}

              {/* Everything optional */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  aria-expanded={showAdvanced}
                  className="w-full flex items-center justify-between gap-3 py-2 text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Settings2 className="w-3.5 h-3.5 text-zinc-500" /> {tr('Qo‘shimcha sozlamalar', 'Дополнительные настройки', 'More settings')}
                    <span className="font-normal text-zinc-500">{tr('(ixtiyoriy)', '(необязательно)', '(optional)')}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    {!showAdvanced &&
                      optionLabels.slice(0, 4).map((label) => (
                        <span key={label} className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono whitespace-nowrap">
                          {label}
                        </span>
                      ))}
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </span>
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pt-3 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SlugField values={values} set={set} />
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">{tr('Sarlavha (Eslatma)', 'Название (заметка)', 'Title (note)')}</label>
                        <input
                          type="text"
                          value={values.title}
                          onChange={(e) => set('title', e.target.value)}
                          placeholder={tr('Masalan: Telegram reklama posti', 'Например: рекламный пост в Telegram', 'e.g. Telegram ad post')}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <OrganizeFields values={values} set={set} folders={folders} />
                    <div className="space-y-3">
                      <DeepLinkSection values={values} set={set} usage={usage} />
                      <DeviceTargetingSection values={values} set={set} usage={usage} />
                      <ProtectionSection values={values} set={set} />
                      <UtmSection values={values} set={set} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CreatedView({ link, onAnother, onClose }: { link: ClientLink; onAnother: () => void; onClose: () => void }) {
  const { showToast } = useToast();
  const { tr } = useLanguage();
  const url = shortUrl(link.slug);

  return (
    <div className="p-8 text-center space-y-6 overflow-y-auto">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
        <Check className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{tr('Havolangiz tayyor!', 'Ссылка готова!', 'Your link is ready!')}</h3>
        <p className="text-xs text-zinc-400">{tr('Qisqa havola xotiraga nusxalandi', 'Короткая ссылка скопирована в буфер', 'The short link was copied to your clipboard')}</p>
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 max-w-lg mx-auto">
        <span className="text-base font-mono font-bold text-indigo-400 truncate">{url.replace(/^https?:\/\//, '')}</span>
        <button
          type="button"
          onClick={async () => (await copyToClipboard(url)) && showToast('copied', tr('Nusxalandi!', 'Скопировано!', 'Copied!'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shrink-0"
        >
          <Copy className="w-3.5 h-3.5" /> {tr('Nusxalash', 'Копировать', 'Copy')}
        </button>
      </div>

      <div className="inline-block">
        <QrCanvas url={url} size={180} fgColor="#09090b" bgColor="#ffffff" bodyShape="rounded" eyeFrameShape="rounded" showControls={false} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button type="button" onClick={onAnother} className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white">
          {tr('Yana yaratish', 'Создать ещё', 'Create another')}
        </button>
        <Link
          href={`/dashboard/links/${link.id}`}
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white"
        >
          {tr('Sozlash va QR', 'Настройки и QR', 'Settings & QR')}
        </Link>
        <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold">
          {tr('Tayyor', 'Готово', 'Done')}
        </button>
      </div>
    </div>
  );
}
