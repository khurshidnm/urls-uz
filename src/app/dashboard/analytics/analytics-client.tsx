'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Globe,
  Download,
  Activity,
  Monitor,
  Tablet,
  Link2,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Shield,
  Loader2,
  Clock,
  Navigation,
} from 'lucide-react';
import { formatNumber, formatDate, copyToClipboard } from '@/lib/utils';
import { getCountryInfo } from '@/lib/geo';

interface Props {
  overview: any;
  links?: any[];
  initialLinkId?: string | null;
  initialLinkAnalytics?: any;
}

export default function AnalyticsViewClient({
  overview,
  links = [],
  initialLinkId = null,
  initialLinkAnalytics = null,
}: Props) {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [selectedLinkId, setSelectedLinkId] = useState<string>(initialLinkId || '');
  const [activeData, setActiveData] = useState<any>(initialLinkAnalytics || overview);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [geoTab, setGeoTab] = useState<'uzbekistan' | 'global'>('uzbekistan');
  const [copied, setCopied] = useState<boolean>(false);

  // Link selection change handler
  const handleSelectLink = async (linkId: string) => {
    setSelectedLinkId(linkId);

    if (!linkId) {
      setActiveData(overview);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/dashboard/analytics');
      }
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/analytics?link_id=${linkId}`);
      const data = await res.json();
      if (data.success) {
        setActiveData(data);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/dashboard/analytics?link_id=${linkId}`);
        }
      } else {
        showToast('error', data.error || 'Maʼlumotlarni yuklab bo‘lmadi');
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyShortUrl = async (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz';
    const fullUrl = `${origin}/${slug}`;
    const ok = await copyToClipboard(fullUrl);
    if (ok) {
      setCopied(true);
      showToast('success', 'Qisqa havola nusxalandi');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportCsv = () => {
    const isSpecificLink = Boolean(selectedLinkId && activeData.link);
    let csv = isSpecificLink
      ? `Havola Analitikasi: ${activeData.link.title} (/${activeData.link.slug})\nAsl manzil: ${activeData.link.destination_url}\nJami bosishlar: ${activeData.totalClicks || 0}\n\n`
      : 'Barcha Havolalar Umumiy Analitikasi\n\n';

    csv += 'Type,Name,Clicks\n';
    if (activeData.regions) {
      activeData.regions.forEach((r: any) => {
        csv += `"Uzbekistan Region","${r.region}",${r.count}\n`;
      });
    }
    if (activeData.countries) {
      activeData.countries.forEach((c: any) => {
        const cInfo = getCountryInfo(c.country);
        csv += `"Country","${cInfo.nameUz} (${c.country})",${c.count}\n`;
      });
    }

    csv += '\nReferer,Clicks\n';
    if (activeData.referrers) {
      activeData.referrers.forEach((ref: any) => {
        csv += `"${ref.referer}",${ref.count}\n`;
      });
    }

    if (activeData.devices) {
      csv += '\nDevice Type,Clicks\n';
      activeData.devices.forEach((dev: any) => {
        csv += `"${dev.device_type}",${dev.count}\n`;
      });
    }

    if (isSpecificLink && activeData.clicks && activeData.clicks.length > 0) {
      csv += '\n--- Oxirgi Tashriflar Jurnali ---\nDate,Region,Country,City,Device,OS,Browser,Referer\n';
      activeData.clicks.forEach((clk: any) => {
        csv += `"${clk.created_at}","${clk.region || ''}","${clk.country || ''}","${clk.city || ''}","${clk.device_type || ''}","${clk.os || ''}","${clk.browser || ''}","${clk.referer || ''}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filenamePrefix = isSpecificLink ? `link-${activeData.link.slug}` : 'overview';
    link.download = `urls-uz-${filenamePrefix}-analytics-${Date.now()}.csv`;
    link.click();
    showToast('success', 'Analitika CSV formatda yuklab olindi');
  };

  const isLinkView = Boolean(selectedLinkId && activeData.link);
  const totalClicks = activeData.totalClicks || (isLinkView ? activeData.link?.click_count : overview.totalClicks) || 0;
  const timeline = activeData.timeline || [];
  const maxTimelineCount = Math.max(...timeline.map((t: any) => t.count), 1);

  // Device icon helper
  const getDeviceIcon = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Device color helper
  const getDeviceColor = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'mobile': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15';
      case 'tablet': return 'text-purple-400 bg-purple-500/10 border-purple-500/15';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Link Selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isLinkView ? 'Havola Analitikasi' : t.analytics}
            </h1>
            {isLinkView && (
              <Badge variant="indigo" size="xs">
                /{activeData.link.slug}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {isLinkView
              ? `Tanlangan havola: "${activeData.link.title}" bo‘yicha batafsil telemetriya`
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
          <div className="flex bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-0.5 text-xs shrink-0">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 kun' : range === '30d' ? '30 kun' : 'Barchasi'}
              </button>
            ))}
          </div>

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
      {isLinkView && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 animate-fade-in shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base text-white truncate">
                  {activeData.link.title}
                </span>
                {activeData.link.is_archived === 1 && (
                  <Badge variant="warning" size="xs">Arxivlangan</Badge>
                )}
                {activeData.link.open_in_app === 1 && (
                  <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>Deep Link</Badge>
                )}
                {activeData.link.has_password && (
                  <Badge variant="warning" size="xs" icon={<Shield className="w-3 h-3" />}>Parolli</Badge>
                )}
              </div>

              {/* URLs info */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="font-mono text-indigo-400 font-semibold">
                  urls.uz/{activeData.link.slug}
                </span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-zinc-400 truncate max-w-sm" title={activeData.link.destination_url}>
                  → {activeData.link.destination_url}
                </span>
              </div>
            </div>

            {/* Quick Actions for Link */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyShortUrl(activeData.link.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white hover:bg-zinc-200 text-zinc-950'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-mono">{copied ? 'Nusxalandi' : 'Nusxa olish'}</span>
              </button>

              <a
                href={`/${activeData.link.slug}`}
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
                {formatDate(activeData.link.created_at)}
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
            <a
              href="/dashboard/links"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 transition-colors"
            >
              Havolalar ro‘yxatiga o‘tish
            </a>
          </div>
        </div>
      )}

      {/* Activity Timeline Chart */}
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {isLinkView ? `"${activeData.link.title}" bosishlar dinamikasi` : 'Bosishlar dinamikasi'}
            </h3>
          </div>
          <Badge variant="indigo" size="xs" dot pulse>Live Telemetry</Badge>
        </div>

        {timeline.length > 0 ? (
          <div className="space-y-2">
            {/* Area Chart (CSS-based) */}
            <div className="flex items-end gap-1 h-44">
              {timeline.map((t: any, idx: number) => {
                const height = Math.max((t.count / maxTimelineCount) * 100, 6);
                const date = new Date(t.date);
                const dayLabel = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
                const isToday = idx === timeline.length - 1;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group/bar relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-white font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">
                      {t.count} bosish · {dayLabel}
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm shadow-indigo-500/30'
                          : 'bg-gradient-to-t from-indigo-600/60 to-indigo-400/60 group-hover/bar:from-indigo-500 group-hover/bar:to-indigo-300'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`text-[8px] mt-1.5 ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-xs text-slate-600">
            Maʼlumotlar to'planmoqda...
          </div>
        )}
      </div>

      {/* Geographic Distribution */}
      <div className="glass-card-static p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/15">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Geolokatsiya</h2>
              <p className="text-[11px] text-slate-500">Viloyatlar va xalqaro bosishlar</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="inline-flex items-center p-0.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl">
            <button
              onClick={() => setGeoTab('uzbekistan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                geoTab === 'uzbekistan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇺🇿 Viloyatlar
            </button>
            <button
              onClick={() => setGeoTab('global')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                geoTab === 'global'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌍 Global
            </button>
          </div>
        </div>

        {/* Uzbekistan Regions */}
        {geoTab === 'uzbekistan' && (
          activeData.regions && activeData.regions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {activeData.regions.map((reg: any, idx: number) => {
                const percentage = totalClicks > 0 ? Math.round((reg.count / totalClicks) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-emerald-500/25 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-mono w-5">#{idx + 1}</span>
                        <span className="font-semibold text-white">{reg.region}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-400">{reg.count}</span>
                        <span className="text-slate-600 text-[10px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono bg-zinc-950/40 rounded-xl border border-zinc-850">
              Oʻzbekiston viloyatlari boʻyicha bosishlar hali qayd etilmagan
            </div>
          )
        )}

        {/* Global Countries */}
        {geoTab === 'global' && (
          activeData.countries && activeData.countries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {activeData.countries.map((c: any, idx: number) => {
                const cInfo = getCountryInfo(c.country);
                const countryName = locale === 'ru' ? cInfo.nameRu : locale === 'en' ? cInfo.nameEn : cInfo.nameUz;
                const percentage = totalClicks > 0 ? Math.round((c.count / totalClicks) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-indigo-500/25 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{cInfo.flag}</span>
                        <span className="font-semibold text-white">{countryName}</span>
                        <span className="text-slate-600 font-mono text-[10px]">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-400">{c.count}</span>
                        <span className="text-slate-600 text-[10px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono bg-zinc-950/40 rounded-xl border border-zinc-850">
              Xalqaro davlatlar boʻyicha bosishlar hali qayd etilmagan
            </div>
          )
        )}
      </div>

      {/* Referrers & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referrers */}
        <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">{t.referrers}</h3>
          </div>
          {activeData.referrers && activeData.referrers.length > 0 ? (
            <div className="space-y-2.5">
              {activeData.referrers.map((ref: any, idx: number) => {
                const perc = totalClicks > 0 ? Math.round((ref.count / totalClicks) * 100) : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{ref.referer}</span>
                      <span className="font-mono text-cyan-400 font-bold">{ref.count} <span className="text-slate-600">({perc}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full" style={{ width: `${Math.max(perc, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              Trafik manbalari hali qayd etilmagan
            </div>
          )}
        </div>

        {/* Devices & OS */}
        <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">{t.devices}</h3>
          </div>
          {activeData.devices && activeData.devices.length > 0 ? (
            <div className="space-y-2.5">
              {activeData.devices.map((dev: any, idx: number) => {
                const perc = totalClicks > 0 ? Math.round((dev.count / totalClicks) * 100) : 0;
                const colorClass = getDeviceColor(dev.device_type);
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorClass}`}>
                      {getDeviceIcon(dev.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white capitalize">{dev.device_type}</span>
                        <span className="font-mono font-bold text-slate-300">{perc}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.max(perc, 4)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0">{dev.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              Qurilmalar statistikasi hali qayd etilmagan
            </div>
          )}

          {/* OS Breakdown */}
          {activeData.os && activeData.os.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2.5">Operatsion tizimlar</div>
              <div className="flex flex-wrap gap-2">
                {activeData.os.map((os: any, idx: number) => (
                  <Badge key={idx} variant="default" size="sm">
                    {os.os}: <span className="font-mono font-bold ml-1">{os.count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Granular Individual Visits Log (Visible when a specific link is selected) */}
      {isLinkView && activeData.clicks && activeData.clicks.length > 0 && (
        <div className="glass-card-static p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Oxirgi tashriflar telemetriyasi</h3>
                <p className="text-[11px] text-zinc-400">Ushbu havolaga oxirgi 100 ta real-vaqt bosishlar jurnali</p>
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {activeData.clicks.length} ta yozuv
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Vaqt</th>
                  <th className="py-2.5 px-3">Geolokatsiya</th>
                  <th className="py-2.5 px-3">Qurilma / OS</th>
                  <th className="py-2.5 px-3">Brauzer</th>
                  <th className="py-2.5 px-3">Trafik Manbasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 font-mono text-zinc-300">
                {activeData.clicks.slice(0, 25).map((click: any, idx: number) => {
                  const countryInfo = getCountryInfo(click.country || 'UZ');
                  return (
                    <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{click.created_at}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <span>{countryInfo.flag}</span>
                          <span>{click.region || countryInfo.nameUz}</span>
                          {click.city && (
                            <span className="text-zinc-500 font-normal">({click.city})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize text-zinc-200">{click.device_type || 'Desktop'}</span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-zinc-400 text-[11px]">{click.os || 'Nomaʼlum'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400">
                        {click.browser || 'Web'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-cyan-400 max-w-xs truncate">
                        {click.referer || 'Direct (To‘g‘ridan-to‘g‘ri)'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
