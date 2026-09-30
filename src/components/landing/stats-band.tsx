import { ArrowUpRight, Radio } from 'lucide-react';
import { getCountryInfo } from '@/lib/geo';
import { formatNumber } from '@/lib/utils';

export interface PublicStats {
  totalRedirects: number;
  redirectsLast7Days: number;
  totalLinks: number;
  linksLast7Days: number;
  totalUsers: number;
  totalBioPages: number;
  recentClicks: { country: string; region: string; os: string; browser: string; created_at: Date }[];
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/** Live platform numbers. Every value here comes from the database. */
export default function StatsBand({ stats }: { stats: PublicStats }) {
  const metrics = [
    {
      label: 'TOTAL REDIRECTS',
      value: formatNumber(stats.totalRedirects),
      change: `+${formatNumber(stats.redirectsLast7Days)} in the last 7 days`,
    },
    {
      label: 'SHORT LINKS',
      value: formatNumber(stats.totalLinks),
      change: `+${formatNumber(stats.linksLast7Days)} in the last 7 days`,
    },
    {
      label: 'USERS',
      value: formatNumber(stats.totalUsers),
      change: 'Telegram & Google accounts',
    },
    {
      label: 'BIO PAGES',
      value: formatNumber(stats.totalBioPages),
      change: 'urls.uz/b/@handle',
    },
  ];

  return (
    <section className="border-b border-zinc-800/80 bg-zinc-950 py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Top 4 Precision Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-zinc-700/80 transition-colors"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center justify-between">
                <span>{item.label}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-mono tabular-nums mb-1">
                {item.value}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{item.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent redirects: anonymized, no URLs or slugs */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-semibold text-zinc-200">RECENT REDIRECTS</span>
              <span className="text-zinc-600 hidden sm:inline">·</span>
              <span className="text-zinc-500 hidden sm:inline text-[11px]">Anonymized · updates every minute</span>
            </div>
          </div>

          {stats.recentClicks.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs font-mono text-zinc-500">
              No redirects yet — shorten your first link above.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 font-mono text-xs overflow-x-auto">
              {stats.recentClicks.map((evt, idx) => {
                const country = getCountryInfo(evt.country);
                const region = evt.region !== 'Unknown' ? evt.region : country.nameEn;
                return (
                  <div
                    key={idx}
                    className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 text-zinc-300 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0" />
                      <span>{country.flag}</span>
                      <span className="truncate">{region}</span>
                    </div>
                    <div className="w-40 shrink-0 text-zinc-500 text-[11px] truncate">
                      {evt.os} · {evt.browser}
                    </div>
                    <div className="w-20 text-right shrink-0 text-zinc-500 text-[11px] tabular-nums">
                      {timeAgo(evt.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
