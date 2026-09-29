'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  MapPin,
  Smartphone,
  Globe,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Plane,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { getCountryInfo } from '@/lib/geo';

interface Props {
  overview: any;
}

export default function AnalyticsViewClient({ overview }: Props) {
  const { t, locale } = useLanguage();
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
  };

  const totalClicks = overview.totalClicks || 1;

  return (
    <div className="space-y-8">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t.analytics}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            O‘zbekiston viloyatlari, chet el davlatlari (Global), trafik manbalari va qurilmalar tahlili
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === '7d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 kun
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === '30d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              30 kun
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi
            </button>
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Main Geographic Card with Tab Toggle */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Geolokatsiya & Hududlar statistikasi</h2>
              <p className="text-xs text-slate-400">O‘zbekiston ichki viloyatlari hamda xalqaro chet el bosishlari</p>
            </div>
          </div>

          {/* Toggle between Uzbekistan Regions and Global Countries */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setGeoTab('uzbekistan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                geoTab === 'uzbekistan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇺🇿</span>
              <span>O‘zbekiston Viloyatlari</span>
            </button>
            <button
              onClick={() => setGeoTab('global')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                geoTab === 'global'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌍</span>
              <span>Dunyo Davlatlari (Global)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Uzbekistan Regions */}
        {geoTab === 'uzbekistan' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">14 ta viloyat va Toshkent shahri</span>
              <span className="text-emerald-400 font-mono font-bold">Mahalliy trafik</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.regions && overview.regions.map((reg: any, idx: number) => {
                const percentage = Math.round((reg.count / totalClicks) * 100);

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                        <span className="font-semibold text-white">{reg.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">{reg.count}</span>
                        <span className="text-slate-500 text-[11px]">({percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Global Countries (Abroad / Chet el) */}
        {geoTab === 'global' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Chet el va xalqaro tashriflar</span>
              <span className="text-indigo-400 font-mono font-bold">Xalqaro trafik</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.countries && overview.countries.map((c: any, idx: number) => {
                const cInfo = getCountryInfo(c.country);
                const countryName = locale === 'ru' ? cInfo.nameRu : locale === 'en' ? cInfo.nameEn : cInfo.nameUz;
                const percentage = Math.round((c.count / totalClicks) * 100);

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{cInfo.flag}</span>
                        <span className="font-semibold text-white">{countryName}</span>
                        <span className="text-slate-500 font-mono text-[10px]">({c.country})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-400">{c.count}</span>
                        <span className="text-slate-500 text-[11px]">({percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Referrers & Devices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrers Box */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">{t.referrers}</h3>
          </div>

          <div className="space-y-3">
            {overview.referrers && overview.referrers.map((ref: any, idx: number) => {
              const perc = Math.round((ref.count / totalClicks) * 100);
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{ref.referer}</span>
                    <span className="font-mono text-cyan-400 font-bold">{ref.count} ({perc}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.max(perc, 5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Devices & OS Box */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">{t.devices}</h3>
          </div>

          <div className="space-y-3">
            {overview.devices && overview.devices.map((dev: any, idx: number) => {
              const perc = Math.round((dev.count / totalClicks) * 100);
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white capitalize">{dev.device_type}</span>
                    <span className="font-mono text-purple-400 font-bold">{dev.count} ({perc}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.max(perc, 5)}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Smart Deep Link konversiyasi:</span>
              <span className="text-emerald-400 font-bold">+34% tezroq o‘tish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
