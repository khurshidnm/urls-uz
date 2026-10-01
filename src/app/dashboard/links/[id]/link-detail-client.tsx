'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Check, Copy, ExternalLink, History, QrCode, Settings2, Shield, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { copyToClipboard, formatDate, formatNumber, shortUrl } from '@/lib/utils';
import type { ClientFolder, ClientLink, LinkAnalytics, LinkEvent } from '@/lib/client-types';
import AnalyticsTab from './analytics-tab';
import QrTab from './qr-tab';
import SettingsTab from './settings-tab';
import HistoryTab from './history-tab';

export type LinkTab = 'analytics' | 'qr' | 'settings' | 'history';

const TAB_META: Record<LinkTab, { label: string; icon: React.ReactNode }> = {
  analytics: { label: 'Analitika', icon: <Activity className="w-3.5 h-3.5" /> },
  qr: { label: 'QR kod', icon: <QrCode className="w-3.5 h-3.5" /> },
  settings: { label: 'Sozlamalar', icon: <Settings2 className="w-3.5 h-3.5" /> },
  history: { label: 'Tarix', icon: <History className="w-3.5 h-3.5" /> },
};

interface Props {
  initialTab: LinkTab;
  link: ClientLink;
  analytics: LinkAnalytics;
  events: LinkEvent[];
  folders: ClientFolder[];
  canWrite: boolean;
  /** The saved QR code this link belongs to; its content and design are edited in the QR studio. */
  qrCodeId: string | null;
}

export default function LinkDetailClient({ initialTab, link: initialLink, analytics, events, folders, canWrite, qrCodeId }: Props) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<LinkTab>(initialTab);
  const [link, setLink] = useState(initialLink);
  const [copied, setCopied] = useState(false);

  const url = shortUrl(link.slug);
  const folder = folders.find((f) => f.id === link.folder_id);

  const selectTab = (next: LinkTab) => {
    setTab(next);
    window.history.replaceState(null, '', next === 'analytics' ? `/dashboard/links/${link.id}` : `/dashboard/links/${link.id}?tab=${next}`);
  };

  const copy = async () => {
    if (await copyToClipboard(url)) {
      setCopied(true);
      showToast('copied', `${url} nusxalandi!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/links" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Havolalar
      </Link>

      {/* Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg text-white truncate">{link.title}</h1>
              {!link.is_active && <Badge variant="danger" size="xs">O‘chirilgan</Badge>}
              {link.is_archived && <Badge variant="warning" size="xs">Arxivlangan</Badge>}
              {link.open_in_app && <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>Deep Link</Badge>}
              {link.has_password && <Badge variant="warning" size="xs" icon={<Shield className="w-3 h-3" />}>Parolli</Badge>}
              {folder && <Badge variant="default" size="xs">📁 {folder.name}</Badge>}
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="font-mono text-indigo-400 font-semibold">{url.replace(/^https?:\/\//, '')}</span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-400 truncate max-w-md" title={link.destination_url}>→ {link.destination_url}</span>
            </div>
            {link.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {link.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono">#{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-white hover:bg-zinc-200 text-zinc-950'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="font-mono">{copied ? 'Nusxalandi' : 'Nusxa olish'}</span>
            </button>
            <a
              href={`/${link.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              title="Havolani yangi oynada ochish"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-850 text-xs">
          <Metric label="Jami bosishlar" value={formatNumber(link.click_count)} />
          <Metric label="Bosishlar limiti" value={link.click_limit ? formatNumber(link.click_limit) : 'Cheksiz'} />
          <Metric label="Amal qilish muddati" value={link.expires_at ? formatDate(link.expires_at) : 'Muddatsiz'} />
          <Metric label="Yaratilgan sana" value={formatDate(link.created_at)} />
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl w-full sm:w-fit overflow-x-auto">
        {(Object.keys(TAB_META) as LinkTab[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => selectTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {TAB_META[key].icon}
            {TAB_META[key].label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab link={link} initialData={analytics} />}
      {tab === 'qr' && (qrCodeId ? <QrCodeNotice qrCodeId={qrCodeId} /> : <QrTab link={link} canWrite={canWrite} onSaved={setLink} />)}
      {tab === 'settings' && <SettingsTab link={link} folders={folders} canWrite={canWrite} onSaved={setLink} qrCodeId={qrCodeId} />}
      {tab === 'history' && <HistoryTab linkId={link.id} initialEvents={events} folders={folders} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
      <div className="text-[11px] text-zinc-500 font-mono">{label}</div>
      <div className="text-sm font-bold text-white font-mono mt-0.5">{value}</div>
    </div>
  );
}

/** A dynamic QR code's link: the QR itself is edited in the studio. */
function QrCodeNotice({ qrCodeId }: { qrCodeId: string }) {
  return (
    <div className="glass-card-static p-6 rounded-2xl border border-[var(--border-subtle)] text-center space-y-3">
      <QrCode className="w-8 h-8 text-indigo-400 mx-auto" />
      <p className="text-sm text-zinc-300">Bu havola saqlangan dinamik QR kodga tegishli.</p>
      <p className="text-xs text-zinc-500">QR kodning tarkibi va dizayni QR studiyada tahrirlanadi.</p>
      <Link
        href={`/dashboard/qr/${qrCodeId}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
      >
        QR kodni tahrirlash
      </Link>
    </div>
  );
}
