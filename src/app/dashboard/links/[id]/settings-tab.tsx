'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Archive, ArchiveRestore, Link2, Loader2, Power, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/lib/language-context';
import { formFromLink, updatePayload, type LinkFormValues } from '@/components/links/link-form-model';
import {
  DeepLinkSection,
  DeviceTargetingSection,
  OrganizeFields,
  ProtectionSection,
  SlugField,
  UtmSection,
} from '@/components/links/link-form-sections';
import { useWorkspaceUsage } from '@/components/links/use-workspace-data';
import type { ClientFolder, ClientLink } from '@/lib/client-types';

interface Props {
  link: ClientLink;
  folders: ClientFolder[];
  canWrite: boolean;
  onSaved: (link: ClientLink) => void;
  /** Set for a dynamic QR code's link, whose destination follows the QR's content. */
  qrCodeId: string | null;
}

export default function SettingsTab({ link, folders, canWrite, onSaved, qrCodeId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { tr, tm } = useLanguage();
  const { usage, reload: reloadUsage } = useWorkspaceUsage();

  const original = useMemo(() => formFromLink(link), [link]);
  const [values, setValues] = useState<LinkFormValues>(original);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  const set = <K extends keyof LinkFormValues>(key: K, value: LinkFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const changes = updatePayload(values, original);
  const dirty = Object.keys(changes).length > 0;

  const patch = async (body: Record<string, unknown>, successMessage: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || tr('Saqlashda xatolik', 'Ошибка сохранения', 'Couldn’t save'));
        return;
      }
      onSaved(data.link);
      setValues(formFromLink(data.link));
      reloadUsage();
      router.refresh();
      showToast('success', successMessage);
    } catch {
      setError('Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('info', tr('Havola o‘chirildi', 'Ссылка удалена', 'Link deleted'));
        router.push('/dashboard/links');
        router.refresh();
      } else {
        setError(data.error || tr('O‘chirishda xatolik', 'Ошибка удаления', 'Couldn’t delete'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-400">
        {tr('Demo rejimida havola sozlamalarini o‘zgartirib bo‘lmaydi. Bepul ro‘yxatdan o‘ting va o‘z havolalaringizni yarating.', 'В демо-режиме настройки ссылки менять нельзя. Зарегистрируйтесь бесплатно и создавайте свои ссылки.', 'Link settings can’t be changed in demo mode. Sign up for free and create your own links.')}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty) patch(changes, tr('O‘zgarishlar saqlandi', 'Изменения сохранены', 'Changes saved'));
      }}
      className="space-y-5"
    >
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">{tr('Asl havola manzili (Destination URL)', 'Целевой адрес (Destination URL)', 'Destination URL')}</label>
          <div className="relative">
            <Link2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={values.destination_url}
              onChange={(e) => set('destination_url', e.target.value)}
              required
              readOnly={Boolean(qrCodeId)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-sm focus:outline-none transition-colors read-only:text-zinc-500"
            />
          </div>
          {qrCodeId && (
            <p className="mt-1.5 text-[11px] text-zinc-500">
              {tr('Bu havola QR kodga tegishli: manzil', 'Эта ссылка принадлежит QR-коду: адрес меняется', 'This link belongs to a QR code: change the address')}{' '}
              <Link href={`/dashboard/qr/${qrCodeId}`} className="text-indigo-400 hover:text-indigo-300">
                {tr('QR studiyada', 'в QR-студии', 'in the QR studio')}
              </Link>
              {tr(' o‘zgartiriladi.', '.', '.')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SlugField values={values} set={set} currentSlug={link.slug} />
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">{tr('Sarlavha (Eslatma)', 'Название (заметка)', 'Title (note)')}</label>
            <input
              type="text"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none transition-colors"
            />
          </div>
        </div>

        <OrganizeFields values={values} set={set} folders={folders} />
      </div>

      <div className="space-y-3">
        <DeepLinkSection values={values} set={set} usage={usage} alreadyUsing={link.open_in_app && !link.is_archived} />
        <DeviceTargetingSection values={values} set={set} usage={usage} alreadyUsing={original.device_targeting && !link.is_archived} />
        <ProtectionSection values={values} set={set} hasPassword={link.has_password} defaultOpen={Boolean(link.has_password || link.expires_at || link.click_limit)} />
        <UtmSection values={values} set={set} defaultOpen={Boolean(link.utm_source || link.utm_medium || link.utm_campaign)} />
      </div>

      <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-[var(--background)]/90 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80">
        {error ? (
          <div className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {tm(error)}
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500 font-mono">{dirty ? tr(`${Object.keys(changes).length} ta o‘zgarish saqlanmagan`, `Несохранённых изменений: ${Object.keys(changes).length}`, `${Object.keys(changes).length} unsaved changes`) : tr('Barcha o‘zgarishlar saqlangan', 'Все изменения сохранены', 'All changes saved')}</span>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => setValues(original)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            {tr('Bekor qilish', 'Отмена', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={!dirty || saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {tr('Saqlash', 'Сохранить', 'Save')}
          </button>
        </div>
      </div>

      {/* Status and danger zone */}
      <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 space-y-4">
        <h3 className="text-sm font-bold text-white">{tr('Holat', 'Статус', 'Status')}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => patch({ is_active: !link.is_active }, link.is_active ? tr('Havola o‘chirildi (vaqtincha)', 'Ссылка отключена (временно)', 'Link turned off (temporarily)') : tr('Havola yoqildi', 'Ссылка включена', 'Link turned on'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200"
          >
            <Power className="w-3.5 h-3.5" /> {link.is_active ? tr('Vaqtincha o‘chirish', 'Временно отключить', 'Turn off for now') : tr('Yoqish', 'Включить', 'Turn on')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => patch({ is_archived: !link.is_archived }, link.is_archived ? tr('Havola arxivdan chiqarildi', 'Ссылка возвращена из архива', 'Link unarchived') : tr('Havola arxivlandi', 'Ссылка в архиве', 'Link archived'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200"
          >
            {link.is_archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {link.is_archived ? tr('Arxivdan chiqarish', 'Из архива', 'Unarchive') : tr('Arxivlash', 'В архив', 'Archive')}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          {tr('Vaqtincha o‘chirilgan havola ochilmaydi, lekin sozlamalari saqlanadi. Arxivlangan havola ishlashda davom etadi, faqat tarif limitiga hisoblanmaydi.', 'Отключённая ссылка не открывается, но её настройки сохраняются. Архивная ссылка продолжает работать и не учитывается в лимите тарифа.', 'A turned-off link doesn’t open but keeps its settings. An archived link keeps working and doesn’t count toward your plan’s limit.')}
        </p>

        <div className="pt-4 border-t border-rose-500/20 space-y-2">
          <p className="text-xs text-rose-300">
            {tr(
              'Havolani butunlay o‘chirish qaytarib bo‘lmaydi: statistika va tarix ham o‘chadi. Tasdiqlash uchun quyidagini yozing:',
              'Удаление ссылки необратимо: статистика и история тоже удалятся. Для подтверждения введите:',
              'Deleting the link can’t be undone: its stats and history go too. To confirm, type:'
            )}{' '}
            <span className="font-mono font-bold">{link.slug}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder={link.slug}
              className="flex-1 px-3 py-2 bg-zinc-950 border border-rose-500/30 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-rose-500"
            />
            <button
              type="button"
              disabled={confirmDelete !== link.slug || saving}
              onClick={remove}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> {tr('Butunlay o‘chirish', 'Удалить навсегда', 'Delete for good')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
