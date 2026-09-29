'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Link2,
  QrCode,
  Layers,
  BarChart3,
  KeyRound,
  CreditCard,
  Settings,
  Sparkles,
  ExternalLink,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: locale === 'uz' ? 'Umumiy ko‘rinish' : locale === 'ru' ? 'Обзор' : 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      matchExact: true,
    },
    {
      name: t.myLinks,
      href: '/dashboard/links',
      icon: Link2,
    },
    {
      name: t.qrStudio,
      href: '/dashboard/qr',
      icon: QrCode,
    },
    {
      name: t.bioPages,
      href: '/dashboard/bio',
      icon: Layers,
    },
    {
      name: t.analytics,
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      name: 'API Kalitlar',
      href: '/dashboard/api-keys',
      icon: KeyRound,
    },
    {
      name: 'Tarif & To‘lov',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
    {
      name: t.settings,
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Link2 className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            urls<span className="text-indigo-400">.uz</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
            {user?.plan || 'pro'}
          </span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Public Bio Quick Link */}
      <div className="p-3 mx-3 mb-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-indigo-300">Shaxsiy Bio Sahifa</span>
          <ExternalLink className="w-3 h-3 text-indigo-400" />
        </div>
        <p className="text-[10px] text-slate-400 mb-2 truncate">urls.uz/b/urls</p>
        <Link
          href="/b/urls"
          target="_blank"
          className="block w-full py-1.5 text-center text-[11px] font-semibold text-white bg-indigo-600/80 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          Sahifani ko‘rish
        </Link>
      </div>

      {/* User Info Bar at Bottom */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover bg-slate-800 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Khurshid'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@urls.uz'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Chiqish"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
