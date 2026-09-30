import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Activity, CreditCard, Link2, MousePointerClick, Search, Shield, UserPlus, Users } from 'lucide-react';
import { getSuperAdmin } from '@/lib/auth';
import { adminRepo, type AdminUserSort } from '@/lib/admin/admin-repo';
import { formatDate, formatNumber } from '@/lib/utils';
import { METHOD_LABELS, PROVIDER_LABELS, som, timeAgo } from './format';
import PlanBadge from './plan-badge';

interface Props {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

const PAGE_SIZE = 50;
const SORT_LABELS: Record<AdminUserSort, string> = {
  created: 'Yangi',
  seen: 'Faollik',
  clicks: 'Bosishlar',
  links: 'Havolalar',
  paid: 'To‘lov',
};

/** Platform admin: users, their activity and plans, payments. Superadmins only. */
export default async function AdminPage({ searchParams }: Props) {
  if (!(await getSuperAdmin())) notFound();

  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const sort = (Object.keys(SORT_LABELS) as AdminUserSort[]).find((s) => s === params.sort) ?? 'created';
  const page = Math.max(1, Number(params.page) || 1);

  const [stats, { users, total }, recentPayments] = await Promise.all([
    adminRepo.platformStats(),
    adminRepo.listUsers({ q, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    adminRepo.recentPayments(8),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (patch: Record<string, string | number>) => {
    const next = new URLSearchParams({ ...(q && { q }), sort, page: String(page), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    return `/dashboard/admin?${next}`;
  };

  const cards = [
    { title: 'Foydalanuvchilar', value: formatNumber(stats.usersTotal), note: `7 kunda +${stats.usersNew7d} · 30 kunda +${stats.usersNew30d}`, icon: Users },
    { title: 'Faol (7 kun)', value: formatNumber(stats.usersActive7d), note: `bugun: ${stats.usersActive1d}`, icon: Activity },
    { title: 'Pullik ish maydonlari', value: formatNumber(stats.paidWorkspaces), note: 'amaldagi Pro va Biznes', icon: CreditCard },
    { title: 'Tushum (shu oy)', value: som(stats.revenueMonth), note: `jami: ${som(stats.revenueTotal)}`, icon: CreditCard },
    { title: 'Havolalar', value: formatNumber(stats.linksTotal), note: `7 kunda +${stats.linksNew7d}`, icon: Link2 },
    { title: 'Bosishlar (7 kun)', value: formatNumber(stats.clicks7d), note: 'demo hisobga olinmagan', icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-400" />
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Admin panel</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Foydalanuvchilar, faollik, tariflar va to‘lovlar. Faqat super adminlar ko‘radi.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-card-static p-4 rounded-2xl border border-[var(--border-subtle)] min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider leading-tight">{card.title}</span>
                <Icon className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
              <div className="text-xl font-black text-white font-mono tracking-tight break-words">{card.value}</div>
              <div className="mt-1 text-[11px] text-zinc-500 leading-snug">{card.note}</div>
            </div>
          );
        })}
      </div>

      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-purple-400" /> Foydalanuvchilar <span className="text-zinc-500 font-mono font-normal">{formatNumber(total)}</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <form action="/dashboard/admin" className="relative">
              <input type="hidden" name="sort" value={sort} />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Ism, email, telefon"
                aria-label="Foydalanuvchilarni qidirish"
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </form>
            <div className="flex items-center gap-1 overflow-x-auto" aria-label="Saralash">
              {(Object.keys(SORT_LABELS) as AdminUserSort[]).map((s) => (
                <Link
                  key={s}
                  href={href({ sort: s, page: 1 })}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border whitespace-nowrap ${
                    s === sort ? 'bg-zinc-800 text-white border-zinc-700' : 'text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {SORT_LABELS[s]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-mono uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 pl-5 pr-3 font-medium">Foydalanuvchi</th>
                <th className="py-2.5 px-3 font-medium">Ro‘yxatdan o‘tgan</th>
                <th className="py-2.5 px-3 font-medium">Oxirgi faollik</th>
                <th className="py-2.5 px-3 font-medium">Tarif</th>
                <th className="py-2.5 px-3 font-medium text-right">Havolalar</th>
                <th className="py-2.5 px-3 font-medium text-right">Bosishlar</th>
                <th className="py-2.5 pl-3 pr-5 font-medium">Oxirgi to‘lov</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-900/40">
                  <td className="py-3 pl-5 pr-3 min-w-[220px]">
                    <Link href={`/dashboard/admin/users/${u.id}`} className="font-semibold text-white hover:text-purple-300">
                      {u.name}
                    </Link>
                    {u.role === 'superadmin' && <span className="ml-1.5 text-[9px] font-bold px-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">ADMIN</span>}
                    <div className="text-[11px] text-zinc-500 mt-0.5">{[u.email, u.phone].filter(Boolean).join(' · ') || '—'}</div>
                    <div className="flex gap-1 mt-1">
                      {(u.providers ?? []).map((p) => (
                        <span key={p} className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {PROVIDER_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">{formatDate(u.created_at.toISOString())}</td>
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap" title={u.last_seen_at?.toISOString()}>
                    {timeAgo(u.last_seen_at ?? u.last_login_at)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <PlanBadge plan={u.plan ?? 'free'} expired={u.planExpired} />
                    {u.plan && u.plan !== 'free' && u.plan_expires_at && (
                      <div className={`text-[10px] mt-0.5 ${u.planExpired ? 'text-rose-400' : 'text-zinc-500'}`}>
                        {u.planExpired ? 'tugagan' : 'gacha'}: {formatDate(u.plan_expires_at.toISOString())}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-200">{formatNumber(u.links)}</td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-200">{formatNumber(u.clicks)}</td>
                  <td className="py-3 pl-3 pr-5 whitespace-nowrap text-zinc-400">
                    {u.last_payment_at ? (
                      <>
                        {formatDate(u.last_payment_at.toISOString())}
                        <div className="text-[10px] text-zinc-500">jami {som(u.total_paid)}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="py-10 text-center text-xs text-zinc-500">Hech kim topilmadi.</p>}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>
              {page} / {pages} sahifa
            </span>
            <div className="flex gap-2">
              {page > 1 && <Link href={href({ page: page - 1 })} className="px-2.5 py-1 rounded border border-zinc-800 hover:text-white">← Oldingi</Link>}
              {page < pages && <Link href={href({ page: page + 1 })} className="px-2.5 py-1 rounded border border-zinc-800 hover:text-white">Keyingi →</Link>}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-400" /> So‘nggi to‘lovlar
        </h2>
        {recentPayments.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Hali to‘lov yo‘q. Foydalanuvchi sahifasida «Tarif berish» orqali to‘lovni qayd eting (Payme / Click ulanguncha).
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/80 text-xs">
            {recentPayments.map(({ payment, workspaceName }) => (
              <li key={payment.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-zinc-200">
                  {workspaceName} · <PlanBadge plan={payment.plan} />
                </span>
                <span className="text-zinc-400">
                  {som(payment.amount)} · {METHOD_LABELS[payment.method]} · {formatDate(payment.created_at.toISOString())}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
