'use client';

import React, { useState } from 'react';
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
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  onCreateLink?: () => void;
}

export default function Sidebar({ onCreateLink }: SidebarProps) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const { user, logout, openAuthModal, isSuperAdmin, demoEditMode, setDemoEditMode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    {
      name: locale === 'uz' ? "Umumiy ko'rinish" : locale === 'ru' ? 'Обзор' : 'Overview',
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
      name: "Tarif & To'lov",
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
    <aside
      className={`${
        collapsed ? 'w-[64px]' : 'w-60'
      } bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0 select-none transition-all duration-150 ease-out hidden md:flex`}
    >
      {/* Brand Header */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors shrink-0">
            <Link2 className="w-3 h-3 text-zinc-300" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight text-white font-mono flex items-center gap-1.5">
              urls<span className="text-zinc-500">.uz</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                  !user
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {!user ? 'demo' : (user.plan || 'free')}
              </span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
          title={collapsed ? 'Kengaytirish' : "Yig'ish"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-2.5'} py-2 space-y-0.5 overflow-y-auto`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${
                collapsed ? 'justify-center' : ''
              } gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-850 bg-zinc-800/80 text-white border border-zinc-700/60 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Quick Bio Link Footnote */}
      {!collapsed && (
        <div className="p-2.5 mx-2.5 mb-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-zinc-400">
            <span>Bio Portal</span>
            <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
          </div>
          <p className="text-[10px] text-zinc-500 mb-1.5 truncate font-mono">urls.uz/b/apextech</p>
          <Link
            href="/b/apextech"
            target="_blank"
            className="block w-full py-1 text-center text-[10px] font-mono font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            Ochish →
          </Link>
        </div>
      )}

      {/* Super Admin Demo Switcher */}
      {!collapsed && isSuperAdmin && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setDemoEditMode(!demoEditMode)}
            className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
              demoEditMode
                ? 'bg-purple-900/40 border-purple-500/60 text-purple-200 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Demo Tahrirlash</span>
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                demoEditMode ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {demoEditMode ? 'FAOL' : 'O‘CHIK'}
            </span>
          </button>
        </div>
      )}

      {/* User Info Bar */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} py-2.5 border-t border-zinc-800/80 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        ) : user ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt="Avatar"
                className="w-6 h-6 rounded-full object-cover bg-zinc-800 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || 'Foydalanuvchi'}</p>
                  {isSuperAdmin && (
                    <span className="text-[9px] font-bold px-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 truncate font-mono">{user?.email || 'user@urls.uz'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Chiqish"
              className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">ApexTech Solutions</p>
                <p className="text-[10px] text-amber-400 truncate font-mono">Demo Rejimi</p>
              </div>
            </div>

            <button
              onClick={() => openAuthModal()}
              title="Bepul ro‘yxatdan o‘tish"
              className="px-2 py-1 text-[11px] font-bold text-zinc-950 bg-white hover:bg-zinc-200 rounded transition-colors shrink-0 cursor-pointer"
            >
              Kirish
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
