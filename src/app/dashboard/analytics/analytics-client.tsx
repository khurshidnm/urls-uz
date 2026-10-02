'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Download,
  Activity,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Shield,
  Loader2,
  Settings2,
} from 'lucide-react';
import { formatNumber, formatDate, copyToClipboard } from '@/lib/utils';
import { getCountryInfo } from '@/lib/geo';
import { AnalyticsPanels, RangeSwitch, type AnalyticsRangeValue } from '@/components/analytics/analytics-panels';
import type { AnalyticsOverview, AnalyticsView, ClientLink, LinkAnalytics } from '@/lib/client-types';
import { SITE_URL, SITE_HOST } from '@/lib/site';

interface Props {
  overview: AnalyticsOverview;
  links?: ClientLink[];
  initialLinkId?: string | null;
  initialLinkAnalytics?: LinkAnalytics | null;
}

export default function AnalyticsViewClient({
  overview,
  links = [],
  initialLinkId = null,
  initialLinkAnalytics = null,
}: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [selectedLinkId, setSelectedLinkId] = useState<string>(initialLinkId || '');
  const [activeData, setActiveData] = useState<AnalyticsView>(initialLinkAnalytics || overview);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<AnalyticsRangeValue>('30d');
  const [copied, setCopied] = useState<boolean>(false);

  /** Loads the overview or one link's analytics for the given time window. */
  const loadAnalytics = async (linkId: string, range: AnalyticsRangeValue) => {
    const params = new URLSearchParams({ range });
    if (linkId) params.set('link_id', linkId);
    try {
      setIsLoading(true);
      const res = await fetch(`/api/analytics?${params}`);
      const data = await res.json();
      if (data.success) {
        setActiveData(data);
        window.history.replaceState(null, '', linkId ? `/dashboard/analytics?link_id=${linkId}` : '/dashboard/analytics');
      } else {
        showToast('error', data.error || 'Maʼlumotlarni yuklab bo‘lmadi');
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLink = (linkId: string) => {
    setSelectedLinkId(linkId);
    loadAnalytics(linkId, dateRange);
  };

  const handleRangeChange = (range: AnalyticsRangeValue) => {
    setDateRange(range);
    loadAnalytics(selectedLinkId, range);
  };

  const handleCopyShortUrl = async (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
    const fullUrl = `${origin}/${slug}`;
    const ok = await copyToClipboard(fullUrl);
    if (ok) {
      setCopied(true);
      showToast('success', 'Qisqa havola nusxalandi');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportCsv = () => {
    const specificLink = selectedLinkId ? activeData.link : undefined;
    let csv = specificLink
      ? `Havola Analitikasi: ${specificLink.title} (/${specificLink.slug})\nAsl manzil: ${specificLink.destination_url}\nJami bosishlar: ${activeData.totalClicks || 0}\n\n`
      : 'Barcha Havolalar Umumiy Analitikasi\n\n';

    csv += 'Type,Name,Clicks\n';
    if (activeData.regions) {
      activeData.regions.forEach((r) => {
        csv += `"Uzbekistan Region","${r.region}",${r.count}\n`;
      });
    }
    if (activeData.countries) {
      activeData.countries.forEach((c) => {
        const cInfo = getCountryInfo(c.country);
        csv += `"Country","${cInfo.nameUz} (${c.country})",${c.count}\n`;
      });
    }

    csv += '\nReferer,Clicks\n';
    if (activeData.referrers) {
      activeData.referrers.forEach((ref) => {
        csv += `"${ref.referer}",${ref.count}\n`;
      });
    }

    if (activeData.devices) {
      csv += '\nDevice Type,Clicks\n';
      activeData.devices.forEach((dev) => {
        csv += `"${dev.device_type}",${dev.count}\n`;
      });
    }

    if (specificLink && activeData.clicks && activeData.clicks.length > 0) {
      csv += '\n--- Oxirgi Tashriflar Jurnali ---\nDate,Region,Country,City,Device,OS,Browser,Referer\n';
      (activeData.clicks ?? []).forEach((clk) => {
        csv += `"${clk.created_at}","${clk.region || ''}","${clk.country || ''}","${clk.city || ''}","${clk.device_type || ''}","${clk.os || ''}","${clk.browser || ''}","${clk.referer || ''}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filenamePrefix = specificLink ? `link-${specificLink.slug}` : 'overview';
    link.download = `urls-uz-${filenamePrefix}-analytics-${Date.now()}.csv`;
    link.click();
    showToast('success', 'Analitika CSV formatda yuklab olindi');
  };

  // Narrowable reference to the selected link (undefined in the overview)
  const selectedLink = selectedLinkId ? activeData.link : undefined;
  const isLinkView = Boolean(selectedLink);
  const totalClicks = activeData.totalClicks || (selectedLink ? selectedLink.click_count : overview.totalClicks) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Title and Link Selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {selectedLink ? 'Havola Analitikasi' : t.analytics}
            </h1>
            {selectedLink && (
              <Badge variant="indigo" size="xs">
                /{selectedLink.slug}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {selectedLink
              ? `Tanlangan havola: "${selectedLink.title}" bo‘yicha batafsil telemetriya`
              : 'Viloyatlar, davlatlar, qurilmalar va trafik manbalari umumiy tahlili'}
          </p>
        </div>

        {/* Controls: Link Selector, Date Range, Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Link Picker Dropdown */}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <select
              value={selectedLinkId}
              onChange={(e) => handleSelectLink(e.target.value)}
              disabled={isLoading}
              className="w-full appearance-none px-3 py-2 pr-8 rounded-xl bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-white text-xs font-semibold border border-[var(--border-subtle)] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer truncate"
            >
              <option value="">🌐 Barcha havolalar (Jami)</option>
              {links.map((lnk) => (
                <option key={lnk.id} value={lnk.id}>
                  🔗 /{lnk.slug} — {lnk.title} ({lnk.click_count || 0})
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <span className="text-[10px]">▼</span>
              )}
            </div>
          </div>

          {/* Date Range Picker */}
          <RangeSwitch value={dateRange} onChange={handleRangeChange} />

          {/* Export CSV Button */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-200 text-xs font-semibold border border-[var(--border-subtle)] transition-colors shrink-0"
            title="CSV formatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Selected Individual Link Banner (Linear Obsidian Aesthetic) */}
      {selectedLink && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 animate-fade-in shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base text-white truncate">
                  {selectedLink.title}
                </span>
                {selectedLink.is_archived && (
                  <Badge variant="warning" size="xs">Arxivlangan</Badge>
                )}
                {selectedLink.open_in_app && (
                  <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>Deep Link</Badge>
                )}
                {selectedLink.has_password && (
                  <Badge variant="warning" size="xs" icon={<Shield className="w-3 h-3" />}>Parolli</Badge>
                )}
              </div>

              {/* URLs info */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="font-mono text-indigo-400 font-semibold">
                  {SITE_HOST}/{selectedLink.slug}
                </span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-zinc-400 truncate max-w-sm" title={selectedLink.destination_url}>
                  → {selectedLink.destination_url}
                </span>
              </div>
            </div>

            {/* Quick Actions for Link */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyShortUrl(selectedLink.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white hover:bg-zinc-200 text-zinc-950'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-mono">{copied ? 'Nusxalandi' : 'Nusxa olish'}</span>
              </button>

              <Link
                href={`/dashboard/links/${selectedLink.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs transition-colors"
                title="Havola sahifasi: sozlamalar, QR va tarix"
              >
                <Settings2 className="w-3 h-3" />
                <span className="hidden md:inline">Boshqarish</span>
              </Link>

              <a
                href={`/${selectedLink.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                title="Havolani yangi oynada ochish"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleSelectLink('')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs transition-colors"
                title="Barcha havolalarga qaytish"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden md:inline">Barchasi</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-850 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 font-mono">Jami bosishlar</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">
                {formatNumber(totalClicks)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 font-mono">Hududlar (Viloyat)</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {activeData.regions?.length || 0} ta
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 font-mono">Xalqaro davlatlar</div>
              <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                {activeData.countries?.length || 0} ta
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 font-mono">Yaratilgan sana</div>
              <div className="text-sm font-semibold text-zinc-300 font-mono mt-1">
                {formatDate(selectedLink.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Hero if no clicks yet */}
      {totalClicks === 0 && (
        <div className="p-8 sm:p-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 text-zinc-300" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">
              STATUS // AWAITING_TELEMETRY
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight">
              {isLinkView
                ? 'Ushbu havola bo‘yicha hali tashriflar qayd etilmagan'
                : 'Hali analitika maʼlumotlari mavjud emas'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isLinkView
                ? 'Havolangizni ijtimoiy tarmoqlar yoki messenjerlarda ulashing — foydalanuvchilar bosgan zahoti barcha telemetriya (viloyat, qurilma, brauzer, manba) ushbu sahifada paydo bo‘ladi.'
                : 'Qisqartirilgan havolalaringiz boʻyicha birorta ham bosish qayd etilmagan. Havolangizni ulashing yoki yangi havola yarating.'}
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/dashboard/links"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 transition-colors"
            >
              Havolalar ro‘yxatiga o‘tish
            </Link>
          </div>
        </div>
      )}

      <AnalyticsPanels
        data={activeData}
        totalClicks={totalClicks}
        timelineTitle={selectedLink ? `"${selectedLink.title}" bosishlar dinamikasi` : 'Bosishlar dinamikasi'}
      />
    </div>
  );
}
