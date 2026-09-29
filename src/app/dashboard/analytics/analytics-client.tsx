'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Smartphone,
  Globe,
  Download,
  Activity,
  Monitor,
  Tablet,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { getCountryInfo } from '@/lib/geo';

interface Props {
  overview: any;
}

export default function AnalyticsViewClient({ overview }: Props) {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [geoTab, setGeoTab] = useState<'uzbekistan' | 'global'>('uzbekistan');

  const exportCsv = () => {
    let csv = 'Type,Name,Clicks\n';
    if (overview.regions) {
      overview.regions.forEach((r: any) => {
        csv += `"Uzbekistan Region","${r.region}",${r.count}\n`;
      });
    }
    if (overview.countries) {
      overview.countries.forEach((c: any) => {
        const cInfo = getCountryInfo(c.country);
        csv += `"Country","${cInfo.nameUz} (${c.country})",${c.count}\n`;
      });
    }
    csv += '\nReferer,Clicks\n';
    overview.referrers.forEach((ref: any) => {
      csv += `"${ref.referer}",${ref.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urls-uz-analytics-${dateRange}-${Date.now()}.csv`;
    link.click();
    showToast('success', 'Analitika CSV formatda yuklab olindi');
  };

  const totalClicks = overview.totalClicks || 1;
  const timeline = overview.timeline || [];
  const maxTimelineCount = Math.max(...timeline.map((t: any) => t.count), 1);

  // Device icon helper
  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Device color helper
  const getDeviceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15';
      case 'tablet': return 'text-purple-400 bg-purple-500/10 border-purple-500/15';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{t.analytics}</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Viloyatlar, davlatlar, qurilmalar va trafik manbalari tahlili
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Date Range Picker */}
          <div className="flex bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-0.5 text-xs">
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

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-200 text-xs font-semibold border border-[var(--border-subtle)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Empty State Hero if no clicks yet */}
      {(!overview.totalClicks || overview.totalClicks === 0) && (
        <div className="p-8 sm:p-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 text-zinc-300" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">
              STATUS // AWAITING_TELEMETRY
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight">Hali analitika maʼlumotlari mavjud emas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Qisqartirilgan havolalaringiz boʻyicha birorta ham bosish qayd etilmagan. Havolangizni ulashing yoki yangi havola yarating — har bir tashrif (qurilma turi, viloyat, manba) real vaqtda ushbu paneldan oʻrin oladi.
            </p>
          </div>
          <div className="pt-1">
            <a
              href="/dashboard/links"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 transition-colors"
            >
              Havola yaratish
            </a>
          </div>
        </div>
      )}

      {/* Activity Timeline Chart */}
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Bosishlar dinamikasi</h3>
          </div>
          <Badge variant="indigo" size="xs" dot pulse>Live</Badge>
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
          overview.regions && overview.regions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {overview.regions.map((reg: any, idx: number) => {
                const percentage = Math.round((reg.count / totalClicks) * 100);
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
          overview.countries && overview.countries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {overview.countries.map((c: any, idx: number) => {
                const cInfo = getCountryInfo(c.country);
                const countryName = locale === 'ru' ? cInfo.nameRu : locale === 'en' ? cInfo.nameEn : cInfo.nameUz;
                const percentage = Math.round((c.count / totalClicks) * 100);
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
          {overview.referrers && overview.referrers.length > 0 ? (
            <div className="space-y-2.5">
              {overview.referrers.map((ref: any, idx: number) => {
                const perc = Math.round((ref.count / totalClicks) * 100);
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
          {overview.devices && overview.devices.length > 0 ? (
            <div className="space-y-2.5">
              {overview.devices.map((dev: any, idx: number) => {
                const perc = Math.round((dev.count / totalClicks) * 100);
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
          {overview.os && overview.os.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2.5">Operatsion tizimlar</div>
              <div className="flex flex-wrap gap-2">
                {overview.os.map((os: any, idx: number) => (
                  <Badge key={idx} variant="default" size="sm">
                    {os.os}: <span className="font-mono font-bold ml-1">{os.count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
