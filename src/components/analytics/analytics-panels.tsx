'use client';

import React, { useState } from 'react';
import { Activity, Clock, Globe, Monitor, Navigation, Smartphone, Tablet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/language-context';
import { getCountryInfo } from '@/lib/geo';
import { formatDateTime, formatDay } from '@/lib/utils';
import type { AnalyticsView, ClickRow } from '@/lib/client-types';

/*
 * Analytics building blocks shared by the analytics page and the link
 * detail page. They only render what they're given.
 */

export type AnalyticsRangeValue = '7d' | '30d' | 'all';

export const RANGE_LABELS: Record<AnalyticsRangeValue, string> = { '7d': '7 kun', '30d': '30 kun', all: 'Barchasi' };

export function RangeSwitch({ value, onChange }: { value: AnalyticsRangeValue; onChange: (range: AnalyticsRangeValue) => void }) {
  return (
    <div className="flex bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-0.5 text-xs shrink-0">
      {(['7d', '30d', 'all'] as const).map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            value === range ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          {RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}

export function TimelineChart({
  timeline,
  title,
  countLabel = 'bosish',
  emptyLabel = 'Maʼlumotlar to‘planmoqda...',
  locale = 'uz',
}: {
  timeline: AnalyticsView['timeline'];
  title: string;
  /** "12 bosish" in the hover label. */
  countLabel?: string;
  emptyLabel?: string;
  locale?: 'uz' | 'ru' | 'en';
}) {
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);
  // Label about ten bars so 30- and 90-day ranges stay readable
  const labelEvery = Math.max(1, Math.ceil(timeline.length / 10));

  return (
    <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
      </div>

      {timeline.length > 0 ? (
        <div className="flex items-end gap-1 h-44">
          {timeline.map((t, idx) => {
            const height = t.count === 0 ? 2 : Math.max((t.count / maxCount) * 100, 6);
            const dayLabel = formatDay(t.date, locale);
            const isLatest = idx === timeline.length - 1;

            return (
              // min-w-0: date labels must not widen the columns (they'd push the chart out of its card)
              <div key={t.date} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end group/bar relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-white font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">
                  {t.count} {countLabel} · {dayLabel}
                </div>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer ${
                    isLatest
                      ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm shadow-indigo-500/30'
                      : 'bg-gradient-to-t from-indigo-600/60 to-indigo-400/60 group-hover/bar:from-indigo-500 group-hover/bar:to-indigo-300'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="relative w-full h-3 mt-1.5">
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 text-[8px] whitespace-nowrap ${isLatest ? 'text-indigo-400 font-bold' : 'text-slate-600'} ${(timeline.length - 1 - idx) % labelEvery === 0 ? '' : 'invisible'}`}
                  >
                    {dayLabel}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-44 flex items-center justify-center text-xs text-slate-600">{emptyLabel}</div>
      )}
    </div>
  );
}

function ShareBar({ label, count, total, color, extra }: { label: React.ReactNode; count: number; total: number; color: string; extra?: React.ReactNode }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] transition-all space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">{label}</div>
        <div className="flex items-center gap-1.5">
          {extra}
          <span className="font-mono font-bold text-white">{count}</span>
          <span className="text-slate-600 text-[10px]">({percentage}%)</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(percentage, 3)}%` }} />
      </div>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-8 text-center text-xs text-zinc-500 font-mono bg-zinc-950/40 rounded-xl border border-zinc-850">{children}</div>
  );
}

export function GeoPanel({ data, totalClicks }: { data: Pick<AnalyticsView, 'regions' | 'countries'>; totalClicks: number }) {
  const { locale } = useLanguage();
  const [tab, setTab] = useState<'uzbekistan' | 'global'>('uzbekistan');

  return (
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

        <div className="inline-flex items-center p-0.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl">
          <button
            type="button"
            onClick={() => setTab('uzbekistan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'uzbekistan' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇺🇿 Viloyatlar
          </button>
          <button
            type="button"
            onClick={() => setTab('global')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'global' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌍 Global
          </button>
        </div>
      </div>

      {tab === 'uzbekistan' &&
        (data.regions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            {data.regions.map((reg, idx) => (
              <ShareBar
                key={reg.region}
                count={reg.count}
                total={totalClicks}
                color="bg-gradient-to-r from-emerald-500 to-teal-400"
                label={
                  <>
                    <span className="text-[10px] text-slate-600 font-mono w-5">#{idx + 1}</span>
                    <span className="font-semibold text-white truncate">{reg.region}</span>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyNote>Oʻzbekiston viloyatlari boʻyicha bosishlar hali qayd etilmagan</EmptyNote>
        ))}

      {tab === 'global' &&
        (data.countries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            {data.countries.map((c) => {
              const info = getCountryInfo(c.country);
              const name = locale === 'ru' ? info.nameRu : locale === 'en' ? info.nameEn : info.nameUz;
              return (
                <ShareBar
                  key={c.country}
                  count={c.count}
                  total={totalClicks}
                  color="bg-gradient-to-r from-indigo-500 to-purple-500"
                  label={
                    <>
                      <span className="text-lg">{info.flag}</span>
                      <span className="font-semibold text-white truncate">{name}</span>
                      <span className="text-slate-600 font-mono text-[10px]">{c.country}</span>
                    </>
                  }
                />
              );
            })}
          </div>
        ) : (
          <EmptyNote>Xalqaro davlatlar boʻyicha bosishlar hali qayd etilmagan</EmptyNote>
        ))}
    </div>
  );
}

const DEVICE_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  mobile: { icon: <Smartphone className="w-4 h-4" />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15' },
  tablet: { icon: <Tablet className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/15' },
};
const DESKTOP_STYLE = { icon: <Monitor className="w-4 h-4" />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15' };

export function SourcesAndDevices({
  data,
  totalClicks,
}: {
  data: Pick<AnalyticsView, 'referrers' | 'devices' | 'os'>;
  totalClicks: number;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">{t.referrers}</h3>
        </div>
        {data.referrers.length > 0 ? (
          <div className="space-y-2.5">
            {data.referrers.map((ref) => (
              <ShareBar
                key={ref.referer}
                count={ref.count}
                total={totalClicks}
                color="bg-gradient-to-r from-cyan-500 to-sky-400"
                label={<span className="font-semibold text-white">{ref.referer}</span>}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500 font-mono">Trafik manbalari hali qayd etilmagan</div>
        )}
      </div>

      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">{t.devices}</h3>
        </div>
        {data.devices.length > 0 ? (
          <div className="space-y-2.5">
            {data.devices.map((dev) => {
              const perc = totalClicks > 0 ? Math.round((dev.count / totalClicks) * 100) : 0;
              const style = DEVICE_STYLES[(dev.device_type || '').toLowerCase()] ?? DESKTOP_STYLE;
              return (
                <div key={dev.device_type} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${style.color}`}>{style.icon}</div>
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
          <div className="py-8 text-center text-xs text-zinc-500 font-mono">Qurilmalar statistikasi hali qayd etilmagan</div>
        )}

        {data.os.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2.5">Operatsion tizimlar</div>
            <div className="flex flex-wrap gap-2">
              {data.os.map((os) => (
                <Badge key={os.os} variant="default" size="sm">
                  {os.os}: <span className="font-mono font-bold ml-1">{os.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function VisitsLog({ clicks }: { clicks: ClickRow[] }) {
  if (clicks.length === 0) return null;

  return (
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
        <span className="text-xs font-mono text-zinc-400">{clicks.length} ta yozuv</span>
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
            {clicks.slice(0, 25).map((click) => {
              const country = getCountryInfo(click.country || 'Unknown');
              return (
                <tr key={click.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{formatDateTime(click.created_at)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <span>{country.flag}</span>
                      <span>{click.region !== 'Unknown' ? click.region : country.nameUz}</span>
                      {click.city && click.city !== 'Unknown' && <span className="text-zinc-500 font-normal">({click.city})</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="capitalize text-zinc-200">{click.device_type}</span>
                    <span className="text-zinc-600"> / </span>
                    <span className="text-zinc-400 text-[11px]">{click.os}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400">{click.browser}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-cyan-400 max-w-xs truncate">{click.referer}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Timeline, geography, sources/devices and (for a single link) the visit log. */
export function AnalyticsPanels({ data, totalClicks, timelineTitle }: { data: AnalyticsView; totalClicks: number; timelineTitle: string }) {
  return (
    <>
      <TimelineChart timeline={data.timeline} title={timelineTitle} />
      <GeoPanel data={data} totalClicks={totalClicks} />
      <SourcesAndDevices data={data} totalClicks={totalClicks} />
      {data.clicks && <VisitsLog clicks={data.clicks} />}
    </>
  );
}
