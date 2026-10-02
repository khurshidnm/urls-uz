'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FolderOpen,
  Layers,
  Loader2,
  Lock,
  Shield,
  Smartphone,
  Tag,
  Target,
  X,
} from 'lucide-react';
import { isReservedSlug, isValidSlug } from '@/lib/utils';
import type { ClientFolder, WorkspaceUsage } from '@/lib/client-types';
import type { LinkFormValues } from './link-form-model';
import { quotaState } from './use-workspace-data';
import { SITE_HOST } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

/*
 * Sections of the link form, shared by the create drawer and the link
 * settings tab. Each section edits a slice of LinkFormValues.
 */

export type SetField = <K extends keyof LinkFormValues>(key: K, value: LinkFormValues[K]) => void;

interface SectionProps {
  values: LinkFormValues;
  set: SetField;
}

const inputClass =
  'w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600';

function Toggle({ checked, disabled, onChange, color }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div
        className={`w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${color} peer-disabled:opacity-40`}
      />
    </label>
  );
}

/** Card with an icon, title and either a toggle or an expand chevron. */
export function FeatureCard({
  icon,
  iconClass,
  title,
  description,
  badge,
  active,
  activeClass,
  toggle,
  expandable,
  footer,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
  active?: boolean;
  activeClass?: string;
  toggle?: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; color: string };
  expandable?: { open: boolean; onToggle: () => void };
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconClass}`}>{icon}</div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-white">{title}</h4>
            {badge}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {toggle && <Toggle {...toggle} />}
      {expandable && (expandable.open ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />)}
    </div>
  );

  const showBody = toggle ? toggle.checked : expandable?.open;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${active && activeClass ? activeClass : 'bg-zinc-900/40 border-zinc-800'}`}>
      {expandable ? (
        <div onClick={expandable.onToggle} className="cursor-pointer select-none">
          {header}
        </div>
      ) : (
        header
      )}
      {showBody && children && <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in">{children}</div>}
      {footer}
    </div>
  );
}

function QuotaBadge({ label, reached }: { label: string; reached: boolean }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
        reached ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      }`}
    >
      {label}
    </span>
  );
}

function QuotaNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] font-mono text-amber-300/80 flex items-center gap-1.5">
      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slug
// ---------------------------------------------------------------------------

/** Live slug validation: format rules locally, availability on the server. `currentSlug` is always available. */
export function useSlugStatus(slug: string, currentSlug?: string) {
  const { tr } = useLanguage();
  const trimmed = slug.trim().toLowerCase();
  const unchanged = Boolean(currentSlug) && trimmed === currentSlug;
  const localError = !trimmed || unchanged
    ? null
    : isReservedSlug(trimmed)
      ? tr('Ushbu slug tizim tomonidan band qilingan', 'Этот адрес зарезервирован системой', 'This slug is reserved by the system')
      : !isValidSlug(trimmed)
        ? tr('Slug 3–50 ta belgi (faqat harf, raqam, tire yoki tagchiziq) bo‘lishi lozim', 'Адрес — 3–50 символов (буквы, цифры, дефис или подчёркивание)', 'The slug must be 3–50 characters (letters, digits, dashes or underscores)')
        : null;

  const [remote, setRemote] = useState<{ slug: string; available?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (!trimmed || unchanged || localError) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-slug?slug=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setRemote({ slug: trimmed, available: data.available, message: data.message });
      } catch {
        setRemote({ slug: trimmed });
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [trimmed, unchanged, localError]);

  if (!trimmed || unchanged) return { checking: false, available: unchanged ? true : undefined } as const;
  if (localError) return { checking: false, available: false, message: localError } as const;
  if (remote?.slug === trimmed) return { checking: false, available: remote.available, message: remote.message } as const;
  return { checking: true } as const;
}

export function SlugField({ values, set, currentSlug }: SectionProps & { currentSlug?: string }) {
  const { tr, tm } = useLanguage();
  const status = useSlugStatus(values.slug, currentSlug);
  const edited = values.slug && values.slug !== currentSlug;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-zinc-300">{tr('Maxsus Qisqa Nom (Slug)', 'Свой короткий адрес (slug)', 'Custom slug')}</label>
        {!currentSlug && <span className="text-[10px] font-mono text-zinc-500">{tr('Ixtiyoriy', 'Необязательно', 'Optional')}</span>}
      </div>
      <div
        className={`flex items-center rounded-xl bg-zinc-900 border px-3 py-2 text-xs font-mono transition-colors ${
          edited && status.available === true
            ? 'border-emerald-500/60'
            : edited && status.available === false
              ? 'border-rose-500/60'
              : 'border-zinc-800 focus-within:border-zinc-600'
        }`}
      >
        <span className="text-zinc-500 shrink-0 select-none">{SITE_HOST}/</span>
        <input
          type="text"
          value={values.slug}
          onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
          placeholder="promo-2026"
          className="w-full bg-transparent text-white focus:outline-none pl-0.5"
        />
        {status.checking && <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin shrink-0" />}
        {!status.checking && edited && status.available === true && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
      </div>
      {edited ? (
        <div className="mt-1 text-[11px] font-mono">
          {status.available === true && <span className="text-emerald-400">{tr('✓ Ushbu slug bo‘sh va foydalanishga tayyor', '✓ Адрес свободен', '✓ This slug is available')}</span>}
          {status.available === false && <span className="text-rose-400">{tm(status.message) || tr('Band qilingan', 'Занят', 'Taken')}</span>}
        </div>
      ) : (
        !currentSlug && <span className="text-[10px] text-zinc-500 mt-1 block font-mono">{tr('Bo‘sh qolsa: avtomatik 5-belgili ID beriladi', 'Если пусто — будет выдан ID из 5 символов', 'Leave empty for an automatic 5-character ID')}</span>
      )}
      {currentSlug && edited && (
        <span className="text-[10px] text-amber-300/80 mt-1 block font-mono">
          {tr(
            `Diqqat: eski havola (${SITE_HOST}/${currentSlug}) ishlamay qoladi.`,
            `Внимание: старая ссылка (${SITE_HOST}/${currentSlug}) перестанет работать.`,
            `Note: the old link (${SITE_HOST}/${currentSlug}) will stop working.`
          )}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organize: tags and folder
// ---------------------------------------------------------------------------

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const { tr } = useLanguage();
  const [draft, setDraft] = useState('');

  const add = () => {
    const tag = draft.trim().replace(/,/g, '');
    if (tag && !tags.some((t) => t.toLowerCase() === tag.toLowerCase()) && tags.length < 20) onChange([...tags, tag]);
    setDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus-within:border-zinc-600">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
          #{tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-zinc-500 hover:text-white" aria-label={tr(`${tag} tegini olib tashlash`, `Убрать тег ${tag}`, `Remove tag ${tag}`)}>
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={tags.length ? '' : 'promo, telegram...'}
        maxLength={40}
        className="flex-1 min-w-[80px] bg-transparent text-white text-xs focus:outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

export function OrganizeFields({ values, set, folders }: SectionProps & { folders: ClientFolder[] }) {
  const { tr } = useLanguage();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
          <Tag className="w-3.5 h-3.5 text-zinc-500" /> {tr('Teglar', 'Теги', 'Tags')}
        </label>
        <TagInput tags={values.tags} onChange={(tags) => set('tags', tags)} />
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-zinc-500" /> {tr('Papka', 'Папка', 'Folder')}
        </label>
        <select
          value={values.folder_id}
          onChange={(e) => set('folder_id', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
        >
          <option value="">{tr('Papkasiz', 'Без папки', 'No folder')}</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature sections
// ---------------------------------------------------------------------------

export function DeepLinkSection({
  values,
  set,
  usage,
  alreadyUsing = false,
}: SectionProps & { usage: WorkspaceUsage | null; alreadyUsing?: boolean }) {
  const { tr } = useLanguage();
  const quota = quotaState(usage?.usage.deepLinks, usage?.limits.deepLinks, alreadyUsing);
  const locked = quota.reached && !values.open_in_app;

  return (
    <FeatureCard
      icon={<Smartphone className="w-4 h-4" />}
      iconClass="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      title="Smart Deep Link"
      description={tr('Telegram yoki Instagram havolasini smartfon ilovasida to‘g‘ridan-to‘g‘ri ochadi', 'Открывает ссылку на Telegram или Instagram прямо в приложении на смартфоне', 'Opens Telegram or Instagram links straight in the phone app')}
      badge={usage && <QuotaBadge label={quota.label} reached={locked} />}
      active={values.open_in_app}
      activeClass="bg-indigo-950/20 border-indigo-500/40"
      toggle={{ checked: values.open_in_app, disabled: locked, onChange: (v) => set('open_in_app', v), color: 'peer-checked:bg-indigo-600' }}
      footer={locked && <QuotaNote>{tr(`Tarifingizdagi Deep Link limiti to‘lgan (${quota.label}). Pro tarifda cheksiz bo‘ladi.`, `Лимит Deep Link на вашем тарифе исчерпан (${quota.label}). На Pro — без ограничений.`, `You’ve used all Deep Links on your plan (${quota.label}). Pro has no limit.`)}</QuotaNote>}
    />
  );
}

export function DeviceTargetingSection({
  values,
  set,
  usage,
  alreadyUsing = false,
}: SectionProps & { usage: WorkspaceUsage | null; alreadyUsing?: boolean }) {
  const { tr } = useLanguage();
  const quota = quotaState(usage?.usage.deviceTargeting, usage?.limits.deviceTargeting, alreadyUsing);
  const locked = quota.reached && !values.device_targeting;

  const deviceInput = (key: 'ios_url' | 'android_url' | 'huawei_url' | 'desktop_url', label: string, placeholder: string) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] text-zinc-300 font-medium">{label}</label>
        <span className="text-[9px] text-zinc-500">{tr('Bo‘sh qolsa: asosiy URL', 'Если пусто — основной URL', 'Empty: main URL')}</span>
      </div>
      <input
        type="text"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
      />
    </div>
  );

  return (
    <FeatureCard
      icon={<Target className="w-4 h-4" />}
      iconClass="bg-purple-500/10 text-purple-400 border-purple-500/20"
      title={tr('Qurilmalar Bo‘yicha Yo‘naltirish', 'Переадресация по устройству', 'Routing by device')}
      description={tr('iPhone (iOS), Android, HarmonyOS (Huawei) va Kompyuterlarni turli do‘kon va ilovalarga yo‘naltirish', 'Отправляет iPhone (iOS), Android, HarmonyOS (Huawei) и компьютеры в разные магазины и приложения', 'Sends iPhone (iOS), Android, HarmonyOS (Huawei) and computers to different stores and apps')}
      badge={usage && <QuotaBadge label={quota.label} reached={locked} />}
      active={values.device_targeting}
      activeClass="bg-purple-950/20 border-purple-500/40"
      toggle={{ checked: values.device_targeting, disabled: locked, onChange: (v) => set('device_targeting', v), color: 'peer-checked:bg-purple-600' }}
      footer={locked && <QuotaNote>{tr(`Tarifingizdagi qurilmalar bo‘yicha yo‘naltirish limiti to‘lgan (${quota.label}).`, `Лимит переадресации по устройству на вашем тарифе исчерпан (${quota.label}).`, `You’ve used all device-routed links on your plan (${quota.label}).`)}</QuotaNote>}
    >
      <div className="space-y-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-zinc-950/90 border border-indigo-500/30 text-[10px] text-zinc-400 leading-relaxed font-sans">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 mb-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> {tr('Asosiy URL — zaxira havola', 'Основной URL — запасной адрес', 'Main URL is the fallback')}
          </span>
          {tr('Qurilma uchun alohida havola kiritilmagan bo‘lsa, asosiy URL ochiladi:', 'Если для устройства нет своей ссылки, откроется основной URL:', 'Devices without their own link open the main URL:')} <span className="font-mono text-zinc-300 break-all">{values.destination_url || '—'}</span>
        </div>
        {deviceInput('ios_url', tr('🍎 Apple iOS (App Store yoki Universal Link)', '🍎 Apple iOS (App Store или Universal Link)', '🍎 Apple iOS (App Store or Universal Link)'), 'https://apps.apple.com/app/id...')}
        {deviceInput('android_url', tr('🤖 Google Android (Play Store yoki App Link)', '🤖 Google Android (Play Store или App Link)', '🤖 Google Android (Play Store or App Link)'), 'https://play.google.com/store/apps/...')}
        {deviceInput('huawei_url', '🔴 Huawei / HarmonyOS (AppGallery)', 'https://appgallery.huawei.com/app/C...')}
        {deviceInput('desktop_url', tr('💻 Kompyuter (Desktop Web — ixtiyoriy)', '💻 Компьютер (сайт — необязательно)', '💻 Computer (website — optional)'), 'https://sayt.uz/desktop')}
      </div>
    </FeatureCard>
  );
}

export function ProtectionSection({
  values,
  set,
  hasPassword = false,
  defaultOpen = false,
}: SectionProps & { hasPassword?: boolean; defaultOpen?: boolean }) {
  const { tr } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FeatureCard
      icon={<Shield className="w-4 h-4" />}
      iconClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
      title={tr('Xavfsizlik & Muddat', 'Защита и срок', 'Security & expiry')}
      description={tr('Parol, amal qilish muddati va bosishlar limiti', 'Пароль, срок действия и лимит переходов', 'Password, expiry date and click limit')}
      expandable={{ open, onToggle: () => setOpen(!open) }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
            {hasPassword ? tr('Yangi parol', 'Новый пароль', 'New password') : tr('Parol bilan himoyalash', 'Защита паролем', 'Password protection')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              disabled={values.remove_password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={hasPassword ? tr('•••••• (o‘zgarmaydi)', '•••••• (не меняется)', '•••••• (unchanged)') : tr('Maxfiy kod...', 'Секретный код...', 'Secret code...')}
              className={`${inputClass} pr-8 disabled:opacity-40`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {hasPassword && (
            <label className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={values.remove_password} onChange={(e) => set('remove_password', e.target.checked)} />
              {tr('Parolni olib tashlash', 'Убрать пароль', 'Remove password')}
            </label>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">{tr('Amal qilish muddati', 'Срок действия', 'Expiry date')}</label>
          <input
            type="datetime-local"
            value={values.expires_at}
            onChange={(e) => set('expires_at', e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 mb-1">{tr('Bosishlar limiti', 'Лимит переходов', 'Click limit')}</label>
          <input
            type="number"
            min={1}
            value={values.click_limit}
            onChange={(e) => set('click_limit', e.target.value)}
            placeholder={tr('Cheksiz', 'Без лимита', 'Unlimited')}
            className={inputClass}
          />
        </div>
      </div>
    </FeatureCard>
  );
}

const UTM_PRESETS = [
  { l: '⚡ Google Ads', s: 'google', m: 'cpc', c: 'search' },
  { l: '📢 Telegram', s: 'telegram', m: 'channel', c: 'post' },
  { l: '📸 Instagram', s: 'instagram', m: 'story', c: 'bio' },
  { l: '🎵 TikTok', s: 'tiktok', m: 'video', c: 'promo' },
];

export function UtmSection({ values, set, defaultOpen = false }: SectionProps & { defaultOpen?: boolean }) {
  const { tr } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <FeatureCard
      icon={<Layers className="w-4 h-4" />}
      iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      title={tr('Marketing & UTM Teglar', 'Маркетинг и UTM-метки', 'Marketing & UTM tags')}
      description={tr('Google Ads, Telegram va Instagram reklama kampaniyalari uchun parametrlar', 'Параметры для рекламных кампаний Google Ads, Telegram и Instagram', 'Parameters for Google Ads, Telegram and Instagram campaigns')}
      expandable={{ open, onToggle: () => setOpen(!open) }}
    >
      <div className="space-y-3 font-mono text-xs">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-zinc-500 py-1">{tr('Shablonlar:', 'Шаблоны:', 'Presets:')}</span>
          {UTM_PRESETS.map((p) => (
            <button
              key={p.l}
              type="button"
              onClick={() => {
                set('utm_source', p.s);
                set('utm_medium', p.m);
                set('utm_campaign', p.c);
              }}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
            >
              {p.l}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const).map((key) => (
            <input
              key={key}
              type="text"
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={key}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-[11px] focus:outline-none"
            />
          ))}
        </div>
      </div>
    </FeatureCard>
  );
}
