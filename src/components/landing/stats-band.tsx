'use client';

import React from 'react';
import { ArrowUpRight, Radio } from 'lucide-react';

export default function StatsBand() {

  const metrics = [
    {
      label: 'TOTAL REDIRECTS',
      value: '40,698,620',
      change: '+14.2% vs last month',
      status: 'positive',
    },
    {
      label: 'P99 EDGE LATENCY',
      value: '11.8ms',
      change: 'Sub-15ms Anycast DNS',
      status: 'neutral',
    },
    {
      label: 'SYSTEM AVAILABILITY',
      value: '99.995%',
      change: 'Zero downtime last 90d',
      status: 'positive',
    },
    {
      label: 'SHORTCODE SLUGS',
      value: '428,190',
      change: '5-char Base62 Engine',
      status: 'neutral',
    },
  ];

  const liveEvents = [
    {
      slug: 'urls.uz/K1XeQ',
      target: 'https://t.me/urlsuzbot',
      region: 'Toshkent, UZ',
      flag: '🇺🇿',
      client: 'Telegram iOS',
      latency: '11.2ms',
      time: '14s ago',
    },
    {
      slug: 'urls.uz/9mF2a',
      target: 'https://instagram.com/reels/...',
      region: 'Samarqand, UZ',
      flag: '🇺🇿',
      client: 'Instagram Android',
      latency: '14.8ms',
      time: '38s ago',
    },
    {
      slug: 'urls.uz/v8P0c',
      target: 'https://github.com/khurshidnm/...',
      region: 'Toshkent, UZ',
      flag: '🇺🇿',
      client: 'macOS Safari',
      latency: '10.9ms',
      time: '1m ago',
    },
    {
      slug: 'urls.uz/7xN1e',
      target: 'https://youtube.com/watch?v=...',
      region: 'Farg‘ona, UZ',
      flag: '🇺🇿',
      client: 'Windows Edge',
      latency: '15.4ms',
      time: '2m ago',
    },
  ];

  return (
    <section className="border-b border-zinc-800/80 bg-zinc-950 py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top 4 Precision Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((item, idx) => (
            <div
              key={idx}
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

        {/* Live Real-time Telemetry Event Feed (Engineering Spec) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-semibold text-zinc-200">REAL-TIME ROUTING TELEMETRY</span>
              <span className="text-zinc-600 hidden sm:inline">·</span>
              <span className="text-zinc-500 hidden sm:inline text-[11px]">Live Global Edge Inspection</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              Protocol: <span className="text-zinc-300">HTTP/3 Anycast</span>
            </div>
          </div>

          {/* Table Rows (44px height, high density, tabular nums) */}
          <div className="divide-y divide-zinc-800/60 font-mono text-xs overflow-x-auto">
            {liveEvents.map((evt, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors whitespace-nowrap min-w-[640px]"
              >
                {/* Short link */}
                <div className="flex items-center gap-2 w-44 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                  <span className="font-medium text-zinc-100">{evt.slug}</span>
                </div>

                {/* Arrow & Target URL */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 text-zinc-400 truncate">
                  <span className="text-zinc-600">→</span>
                  <span className="truncate max-w-[280px]">{evt.target}</span>
                </div>

                {/* Region & Flag */}
                <div className="flex items-center gap-1.5 w-36 shrink-0 text-zinc-300 text-[11px]">
                  <span>{evt.flag}</span>
                  <span>{evt.region}</span>
                </div>

                {/* Client / User Agent */}
                <div className="w-32 shrink-0 text-zinc-500 text-[11px]">
                  {evt.client}
                </div>

                {/* Latency */}
                <div className="w-20 text-right shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-emerald-400 text-[10px] tabular-nums">
                    {evt.latency}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="w-20 text-right shrink-0 text-zinc-500 text-[11px] tabular-nums">
                  {evt.time}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
