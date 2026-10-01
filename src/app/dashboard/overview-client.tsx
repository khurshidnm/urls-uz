'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, ExternalLink, Globe, Layers, Link2, MapPin, MousePointerClick, Plus, QrCode, Smartphone, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { TimelineChart } from '@/components/analytics/analytics-panels';
import { copyToClipboard, formatNumber, shortUrl } from '@/lib/utils';
import type { AnalyticsOverview, ClientBioPage, ClientLink } from '@/lib/client-types';
import { SITE_HOST } from '@/lib/site';

interface OverviewClientProps {
  analytics: AnalyticsOverview;
  links: ClientLink[];
  bioPage: ClientBioPage | undefined;
}

const TOP_LINKS = 8;

const sum = (values: { count: number }[]) => values.reduce((total, v) => total + v.count, 0);

/** "+12%" / "−5%" for this week against the week before; null when there's nothing to compare. */
function weekOverWeek(timeline: { count: number }[]): { text: string; trend: 'up' | 'down' | 'flat' } | null {
  const thisWeek = sum(timeline.slice(-7));
  const previous = sum(timeline.slice(-14, -7));
  if (previous === 0) return null;
  const change = Math.round(((thisWeek - previous) / previous) * 100);
  return { text: `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)}%`, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
}

export default function DashboardOverviewClient({ analytics, links, bioPage }: OverviewClientProps) {
  const { t, locale } = useLanguage();
  const o = t.overview;
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const timeline = analytics.timeline ?? [];
  const change = weekOverWeek(timeline);
  const today = timeline.at(-1)?.count ?? 0;
  const yesterday = timeline.at(-2)?.count ?? 0;
  const activeLinks = links.filter((l) => l.is_active && !l.is_archived).length;
  const topLinks = [...links].sort((a, b) => b.click_count - a.click_count).slice(0, TOP_LINKS);

  const handleCopy = async (link: ClientLink) => {
    const url = shortUrl(link.slug);
    if (!(await copyToClipboard(url))) return;
    setCopiedId(link.id);
    showToast('copied', `${o.copiedToast}: ${url.replace(/^https?:\/\//, '')}`);
    setTimeout(() => setCopiedId((current) => (current === link.id ? null : current)), 2000);
  };

  const statCards = [
    {
      title: t.totalClicks,
      value: formatNumber(analytics.totalClicks),
      note: change ? (
        <>
          <span className={`font-bold ${change.trend === 'up' ? 'text-emerald-400' : change.trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>{change.text}</span>{' '}
          {o.vsPrevWeek}
        </>
      ) : (
        o.last30Days
      ),
      icon: MousePointerClick,
      tone: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15',
    },
    {
      title: t.activeLinks,
      value: formatNumber(activeLinks),
      note: o.totalLinks.replace('{n}', formatNumber(links.length)),
      icon: Link2,
      tone: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
    },
    {
      title: t.bioViews,
      value: bioPage ? formatNumber(analytics.totalBioViews) : '—',
      note: bioPage ? `${SITE_HOST}/b/${bioPage.handle}` : o.noBioPage,
      icon: Layers,
      tone: 'text-purple-400 bg-purple-500/10 border-purple-500/15',
    },
    {
      title: o.todayClicks,
      value: formatNumber(today),
      note: o.yesterday.replace('{n}', formatNumber(yesterday)),
      icon: TrendingUp,
      tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    },
  ];

  const maxRegion = analytics.regions[0]?.count || 1;
  const iconButton = 'p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-slate-400 hover:text-white transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{o.title}</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{o.subtitle}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-card-static p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider leading-tight">{card.title}</span>
                <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center border ${card.tone}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">{card.value}</div>
              <div className="mt-1.5 text-[11px] text-[var(--foreground-faint)] leading-snug line-clamp-2 break-words">{card.note}</div>
            </div>
          );
        })}
      </div>

      {/* Daily clicks and regions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 min-w-0">
          <TimelineChart timeline={timeline} title={o.dailyClicks} countLabel={o.clicksUnit} emptyLabel={o.collecting} locale={locale} />
        </div>

        <div className="lg:col-span-5 min-w-0 glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-bold text-white truncate">{t.regionsUzbekistan}</h3>
            </div>
            <Link href="/dashboard/analytics" className="shrink-0 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors">
              <span>{o.seeAll}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {analytics.regions.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.regions.slice(0, 5).map((reg, idx) => (
                <div key={reg.region} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-slate-600 font-mono w-4">#{idx + 1}</span>
                      <span className="font-semibold text-slate-200 truncate">{reg.region}</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px] font-bold">{formatNumber(reg.count)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((reg.count / maxRegion) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 py-6 text-center">{o.collecting}</p>
          )}
        </div>
      </div>

      {/* Traffic sources */}
      {analytics.referrers.length > 0 && (
        <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">{t.referrers}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {analytics.referrers.map((ref) => (
              <div
                key={ref.referer}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">{ref.referer}</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">{formatNumber(ref.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top links */}
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">{o.topLinks}</h3>
            <p className="text-[11px] text-[var(--foreground-faint)] mt-0.5">{o.topLinksNote}</p>
          </div>
          <Link href="/dashboard/links" className="shrink-0 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            <span>{o.manageAll}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {topLinks.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-xs text-slate-500">{o.noLinks}</p>
            <Link
              href="/dashboard/links"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> {o.createFirst}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono uppercase text-slate-500 border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-2.5 pl-5 pr-3 font-medium">{o.colLink}</th>
                  <th className="py-2.5 px-3 font-medium hidden md:table-cell">{o.colDestination}</th>
                  <th className="py-2.5 px-3 font-medium hidden sm:table-cell">{o.colType}</th>
                  <th className="py-2.5 px-3 font-medium text-right">{o.colClicks}</th>
                  <th className="py-2.5 pl-3 pr-5 font-medium text-right">{o.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {topLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-[var(--surface-1)] transition-colors">
                    <td className="py-3 pl-5 pr-3 max-w-[280px]">
                      <Link href={`/dashboard/links/${link.id}`} className="block font-semibold text-white hover:text-indigo-300 truncate transition-colors">
                        {link.title}
                      </Link>
                      <div className="font-mono text-indigo-400 text-[11px] mt-0.5 truncate">{shortUrl(link.slug).replace(/^https?:\/\//, '')}</div>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell max-w-[260px]">
                      <span className="block truncate text-slate-400" title={link.destination_url}>
                        {link.destination_url}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell whitespace-nowrap">
                      {link.source === 'bio' ? (
                        <Badge variant="indigo" size="xs">{o.typeBio}</Badge>
                      ) : link.source === 'qr' ? (
                        <Badge variant="indigo" size="xs" icon={<QrCode className="w-3 h-3" />}>{o.typeQr}</Badge>
                      ) : link.open_in_app ? (
                        <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>{o.typeDeepLink}</Badge>
                      ) : (
                        <Badge variant="default" size="xs">{o.typeBrowser}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white text-sm tabular-nums">{formatNumber(link.click_count)}</td>
                    <td className="py-3 pl-3 pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => handleCopy(link)} className={iconButton} title={t.copy} aria-label={t.copy}>
                          {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <Link href={`/dashboard/links/${link.id}?tab=qr`} className={iconButton} title={o.qrCode} aria-label={o.qrCode}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Link>
                        <a href={`/${link.slug}`} target="_blank" rel="noopener noreferrer" className={iconButton} title={o.open} aria-label={o.open}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
