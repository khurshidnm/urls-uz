'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  MousePointerClick,
  Layers,
  Zap,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Smartphone,
  MapPin,
  BarChart3,
  Globe,
  Activity,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { QrCanvas } from '@/components/ui/qr-canvas';

interface OverviewClientProps {
  analytics: any;
  links: any[];
  bioPage: any;
}

export default function DashboardOverviewClient({
  analytics,
  links,
  bioPage,
}: OverviewClientProps) {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrLink, setActiveQrLink] = useState<any | null>(null);

  const handleCopy = async (id: string, slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast('copied', `${url} nusxalandi!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(id);
      showToast('copied', 'Nusxalandi!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const statCards = [
    {
      title: t.totalClicks,
      value: formatNumber(analytics.totalClicks),
      change: '+18.4%',
      changeLabel: 'bu hafta',
      icon: MousePointerClick,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/15',
    },
    {
      title: t.activeLinks,
      value: formatNumber(analytics.totalLinks),
      change: '100%',
      changeLabel: 'faol',
      icon: Link2,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/15',
    },
    {
      title: t.bioViews,
      value: formatNumber(analytics.totalBioViews || 2840),
      change: '+12%',
      changeLabel: "o'sish",
      icon: Layers,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/15',
    },
    {
      title: 'Tezlik',
      value: '24ms',
      change: '99.99%',
      changeLabel: 'uptime',
      icon: Zap,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/15',
    },
  ];

  // Build simple bar chart data from timeline
  const timeline = analytics.timeline || [];
  const maxTimelineCount = Math.max(...timeline.map((t: any) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {locale === 'uz' ? 'Boshqaruv Paneli' : locale === 'ru' ? 'Панель управления' : 'Dashboard'}
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {locale === 'uz'
              ? 'Havolalar, QR-kodlar va Bio sahifangiz statistikasi'
              : locale === 'ru'
              ? 'Статистика ваших ссылок, QR-кодов и Bio страниц'
              : 'Real-time stats for all your links and assets'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-card-static p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">{card.title}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.bgColor} ${card.borderColor} border`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">{card.value}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[11px] font-bold text-emerald-400">{card.change}</span>
                <span className="text-[10px] text-[var(--foreground-faint)]">{card.changeLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart & Regions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Activity Timeline */}
        <div className="lg:col-span-7 glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Kunlik bosishlar</h3>
            </div>
            <Badge variant="indigo" size="xs" dot pulse>
              Real-time
            </Badge>
          </div>

          {/* CSS Bar Chart */}
          {timeline.length > 0 ? (
            <div className="flex items-end gap-1.5 h-36">
              {timeline.map((t: any, idx: number) => {
                const height = Math.max((t.count / maxTimelineCount) * 100, 8);
                const date = new Date(t.date);
                const dayLabel = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <span className="text-[9px] text-indigo-300 font-mono font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {t.count}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 chart-bar cursor-pointer group-hover/bar:from-indigo-500 group-hover/bar:to-indigo-300 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] text-slate-500 mt-0.5 truncate w-full text-center">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-slate-500">
              <BarChart3 className="w-8 h-8 text-slate-700 mr-2" />
              Maʼlumotlar to'planmoqda...
            </div>
          )}
        </div>

        {/* Top Regions */}
        <div className="lg:col-span-5 glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">{t.regionsUzbekistan}</h3>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Barchasi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {analytics.regions && analytics.regions.length > 0 ? (
              analytics.regions.slice(0, 5).map((reg: any, idx: number) => {
                const maxCount = analytics.regions[0]?.count || 1;
                const percentage = Math.round((reg.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-mono w-4">#{idx + 1}</span>
                        <span className="font-semibold text-slate-200">{reg.region}</span>
                      </div>
                      <span className="font-mono text-emerald-400 text-[11px] font-bold">{reg.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-600 py-6 text-center">Maʼlumotlar to'planmoqda...</p>
            )}
          </div>
        </div>
      </div>

      {/* Referrers Row */}
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">{t.referrers}</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {analytics.referrers && analytics.referrers.map((ref: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-xs font-semibold text-white">{ref.referer}</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">{ref.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links Table */}
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">{t.myLinks}</h3>
            <p className="text-[11px] text-[var(--foreground-faint)] mt-0.5">Eng faol havolalaringiz</p>
          </div>
          <Link
            href="/dashboard/links"
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>Barchasini boshqarish</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table">
            <thead>
              <tr>
                <th className="pl-5">Havola</th>
                <th>Manzil</th>
                <th className="text-center">Turi</th>
                <th className="text-center">Bosishlar</th>
                <th className="text-right pr-5">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const shortUrl = `urls.uz/${link.slug}`;
                const isCopied = copiedId === link.id;

                return (
                  <tr key={link.id} className="interactive-row">
                    <td className="pl-5">
                      <div className="font-semibold text-white text-xs">{link.title}</div>
                      <div className="font-mono text-indigo-400 text-[11px] mt-0.5">{shortUrl}</div>
                    </td>
                    <td className="max-w-[200px] truncate text-slate-400 text-xs">
                      {link.destination_url}
                    </td>
                    <td className="text-center">
                      {link.open_in_app ? (
                        <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>
                          Deep Link
                        </Badge>
                      ) : (
                        <Badge variant="default" size="xs">Brauzer</Badge>
                      )}
                    </td>
                    <td className="text-center font-mono font-bold text-white text-sm">
                      {formatNumber(link.click_count)}
                    </td>
                    <td className="pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopy(link.id, link.slug)}
                          className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-400 hover:text-white transition-all"
                          title={t.copy}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setActiveQrLink(link)}
                          className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-400 hover:text-white transition-all"
                          title="QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-400 hover:text-white transition-all"
                          title="Ochish"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      {activeQrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveQrLink(null)} />
          <div className="relative w-full max-w-sm bg-[var(--surface-0)] border border-[var(--border-default)] rounded-2xl p-6 z-10 text-center shadow-2xl animate-scale-in">
            <h3 className="text-base font-bold text-white mb-1">{activeQrLink.title}</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">urls.uz/{activeQrLink.slug}</p>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <QrCanvas
                url={`${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${activeQrLink.slug}`}
                size={220}
                fgColor="#0f172a"
                bgColor="#ffffff"
                centerLogo={activeQrLink.open_in_app ? 'telegram' : 'none'}
                frameText={activeQrLink.title}
                frameStyle="bottom"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/${activeQrLink.slug}`;
                  await navigator.clipboard.writeText(url);
                  showToast('copied', 'Havola nusxalandi!');
                }}
                className="flex-1 py-2 text-xs font-semibold text-indigo-300 bg-indigo-600/15 hover:bg-indigo-600/25 rounded-xl border border-indigo-500/20 transition-colors"
              >
                Havolani nusxalash
              </button>
              <button
                onClick={() => setActiveQrLink(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
