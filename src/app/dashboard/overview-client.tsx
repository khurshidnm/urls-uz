'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
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
  Plus,
  ArrowRight,
  Smartphone,
  MapPin,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { QrCanvas } from '@/components/ui/qr-canvas';
import CreateLinkModal from '@/components/dashboard/create-link-modal';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrLink, setActiveQrLink] = useState<any | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleCopy = async (id: string, slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statCards = [
    {
      title: t.totalClicks,
      value: formatNumber(analytics.totalClicks),
      change: '+18.4% bu hafta',
      icon: MousePointerClick,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: t.activeLinks,
      value: formatNumber(analytics.totalLinks),
      change: '100% faol holatda',
      icon: Link2,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: t.bioViews,
      value: formatNumber(analytics.totalBioViews || 2840),
      change: 'urls.uz/b/urls',
      icon: Layers,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Yo‘naltirish tezligi',
      value: '24 ms',
      change: 'Ultra High-speed',
      icon: Zap,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {locale === 'uz' ? 'Boshqaruv Paneli' : locale === 'ru' ? 'Панель управления' : 'Dashboard Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {locale === 'uz'
              ? 'Havolalaringiz, QR-kodlar va Bio sahifangizning umumiy holati'
              : locale === 'ru'
              ? 'Общая статистика по вашим ссылкам, QR-кодам и Bio страницам'
              : 'Real-time performance and analytics for all your links'}
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createNewLink}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">{card.value}</div>
              <div className="text-[11px] text-indigo-400 font-medium">{card.change}</div>
            </div>
          );
        })}
      </div>

      {/* Uzbekistan Regional Breakdown & Traffic Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Uzbekistan Regions List */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">{t.regionsUzbekistan}</h3>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Barcha viloyatlar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {analytics.regions && analytics.regions.length > 0 ? (
              analytics.regions.slice(0, 5).map((reg: any, idx: number) => {
                const maxCount = analytics.regions[0]?.count || 1;
                const percentage = Math.round((reg.count / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{reg.region}</span>
                      <span className="font-mono text-slate-400">{reg.count} bosish</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Maʼlumotlar to‘planmoqda...</p>
            )}
          </div>
        </div>

        {/* Top Traffic Sources */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white tracking-tight">{t.referrers}</h3>
            <span className="text-[11px] text-slate-500">Kanal turlari</span>
          </div>

          <div className="space-y-3">
            {analytics.referrers && analytics.referrers.map((ref: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-xs font-semibold text-white">{ref.referer}</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400">{ref.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Links Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{t.myLinks}</h3>
            <p className="text-xs text-slate-400">Eng ko‘p bosilgan va faol havolalaringiz</p>
          </div>
          <Link
            href="/dashboard/links"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Barchasini boshqarish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Havola nomi & Qisqa URL</th>
                <th className="pb-3 font-semibold">Asosiy manzil</th>
                <th className="pb-3 font-semibold text-center">Smart Deep Link</th>
                <th className="pb-3 font-semibold text-center">Bosishlar</th>
                <th className="pb-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {links.map((link) => {
                const shortUrl = `urls.uz/${link.slug}`;
                const isCopied = copiedId === link.id;

                return (
                  <tr key={link.id} className="group hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {link.title}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-indigo-400 text-[11px] mt-0.5">
                        <span>{shortUrl}</span>
                      </div>
                    </td>

                    <td className="py-3.5 pr-4 max-w-[220px] truncate text-slate-400">
                      {link.destination_url}
                    </td>

                    <td className="py-3.5 text-center">
                      {link.open_in_app ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Smartphone className="w-3 h-3" />
                          <span>Ilovada</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Brauzer</span>
                      )}
                    </td>

                    <td className="py-3.5 text-center font-mono font-bold text-white">
                      {formatNumber(link.click_count)}
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(link.id, link.slug)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title={t.copy}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setActiveQrLink(link)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="QR Kod"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setActiveQrLink(null)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 z-10 text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">{activeQrLink.title}</h3>
            <p className="text-xs text-slate-400 mb-4">urls.uz/{activeQrLink.slug}</p>
            <QrCanvas
              url={`${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${activeQrLink.slug}`}
              size={240}
              fgColor="#0f172a"
              bgColor="#ffffff"
              centerLogo={activeQrLink.open_in_app ? 'telegram' : 'none'}
              frameText={activeQrLink.title}
              frameStyle="bottom"
            />
            <button
              onClick={() => setActiveQrLink(null)}
              className="mt-4 px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Global Create Modal */}
      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
