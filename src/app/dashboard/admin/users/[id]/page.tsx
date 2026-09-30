import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, KeyRound, Layers, Link2, MousePointerClick, QrCode, ShieldCheck } from 'lucide-react';
import { getSuperAdmin } from '@/lib/auth';
import { adminRepo } from '@/lib/admin/admin-repo';
import { formatDate, formatDateTime, formatNumber, shortUrl } from '@/lib/utils';
import { METHOD_LABELS, PROVIDER_LABELS, som, timeAgo } from '../../format';
import PlanBadge from '../../plan-badge';
import GrantPlanForm from './grant-plan-form';
import ResetTwoFactorButton from './reset-two-factor-button';

export const metadata: Metadata = { title: 'Foydalanuvchi' };

interface Props {
  params: Promise<{ id: string }>;
}

/** One user: login methods, activity, workspaces with usage, plan and payments. Superadmins only. */
export default async function AdminUserPage({ params }: Props) {
  if (!(await getSuperAdmin())) notFound();
  const { id } = await params;
  const detail = await adminRepo.userDetail(id);
  if (!detail) notFound();
  const { user, identities, workspaces } = detail;
  const now = new Date();

  const facts = [
    { icon: Calendar, label: 'Ro‘yxatdan o‘tgan', value: formatDateTime(user.created_at) },
    { icon: KeyRound, label: 'Oxirgi kirish', value: user.last_login_at ? `${formatDateTime(user.last_login_at)} (${timeAgo(user.last_login_at)})` : '—' },
    { icon: Clock, label: 'Oxirgi faollik', value: user.last_seen_at ? `${formatDateTime(user.last_seen_at)} (${timeAgo(user.last_seen_at)})` : '—' },
    {
      icon: ShieldCheck,
      label: 'Ikki bosqichli himoya',
      value: user.totp_enabled_at ? `Yoqilgan (${formatDateTime(user.totp_enabled_at)}), ${user.totp_recovery_codes.length} ta tiklash kodi` : 'O‘chiq',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin panel
      </Link>

      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {user.name}
            {user.role === 'superadmin' && <span className="text-[10px] font-bold px-1.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">ADMIN</span>}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">{[user.email, user.phone].filter(Boolean).join(' · ') || 'Kontakt ma’lumoti yo‘q'}</p>
          <p className="text-[10px] font-mono text-zinc-600 mt-1">{user.id}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {facts.map((f) => (
            <div key={f.label} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 flex items-center gap-1.5">
                <f.icon className="w-3 h-3" /> {f.label}
              </div>
              <div className="text-xs text-zinc-200 mt-1">{f.value}</div>
            </div>
          ))}
        </div>
        {user.totp_enabled_at && <ResetTwoFactorButton userId={user.id} />}
        <div>
          <div className="text-[10px] uppercase text-zinc-500 mb-1.5">Kirish usullari</div>
          <div className="flex flex-wrap gap-2">
            {identities.map((i) => (
              <span key={`${i.provider}:${i.provider_id}`} className="text-[11px] px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                <span className="text-zinc-500">{PROVIDER_LABELS[i.provider]}:</span> {i.label ?? i.provider_id}
                {i.last_login_at && <span className="text-zinc-600"> · {timeAgo(i.last_login_at)}</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {workspaces.map(({ workspace, role, effectivePlan, usage, bioPage, payments, recentLinks }) => {
        const expired = workspace.plan !== 'free' && effectivePlan === 'free';
        const active = workspace.plan !== 'free' && !expired;
        const stats = [
          { icon: Link2, label: 'Havolalar', value: formatNumber(usage.links), note: usage.lastLinkAt ? `oxirgisi ${timeAgo(usage.lastLinkAt)}` : '' },
          { icon: MousePointerClick, label: 'Bosishlar', value: formatNumber(usage.clicks), note: '' },
          { icon: QrCode, label: 'QR kodlar', value: formatNumber(usage.qrCodes), note: '' },
          { icon: Layers, label: 'Bio sahifa', value: bioPage ? `/b/${bioPage.handle}` : '—', note: bioPage ? `${formatNumber(bioPage.views)} ko‘rish` : '' },
        ];
        return (
          <div key={workspace.id} className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">{workspace.name}</h2>
                <p className="text-[11px] text-zinc-500">
                  Ish maydoni · {role === 'owner' ? 'egasi' : role} · yaratilgan {formatDate(workspace.created_at.toISOString())}
                </p>
              </div>
              <div className="text-right">
                <PlanBadge plan={workspace.plan} expired={expired} />
                <div className={`text-[11px] mt-1 ${expired ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {workspace.plan === 'free'
                    ? 'Bepul tarif'
                    : workspace.plan_expires_at
                      ? `${expired ? 'Tugagan' : 'Amal qiladi'}: ${formatDate(workspace.plan_expires_at.toISOString())}${
                          active ? ` (${Math.ceil((workspace.plan_expires_at.getTime() - now.getTime()) / 86_400_000)} kun qoldi)` : ''
                        }`
                      : 'Muddatsiz'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 min-w-0">
                  <div className="text-[10px] uppercase text-zinc-500 flex items-center gap-1.5">
                    <s.icon className="w-3 h-3" /> {s.label}
                  </div>
                  <div className="text-sm font-mono font-bold text-white mt-1 truncate">{s.value}</div>
                  {s.note && <div className="text-[10px] text-zinc-500">{s.note}</div>}
                </div>
              ))}
            </div>

            {recentLinks.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-1.5">So‘nggi havolalar</div>
                <ul className="divide-y divide-zinc-800/80 text-xs">
                  {recentLinks.map((l) => (
                    <li key={l.id} className="py-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-zinc-300">
                        {l.title} <span className="font-mono text-indigo-400">{shortUrl(l.slug).replace(/^https?:\/\//, '')}</span>
                      </span>
                      <span className="shrink-0 text-zinc-500 font-mono">
                        {formatNumber(l.click_count)} · {formatDate(l.created_at.toISOString())}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase text-zinc-500 mb-1.5">To‘lovlar</div>
              {payments.length === 0 ? (
                <p className="text-xs text-zinc-500">To‘lov qilinmagan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase text-zinc-500">
                      <tr>
                        <th className="py-1.5 pr-3 font-medium">Sana</th>
                        <th className="py-1.5 px-3 font-medium">Tarif</th>
                        <th className="py-1.5 px-3 font-medium">Davr</th>
                        <th className="py-1.5 px-3 font-medium text-right">Summa</th>
                        <th className="py-1.5 pl-3 font-medium">Usul / izoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 pr-3 text-zinc-300 whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                          <td className="py-2 px-3"><PlanBadge plan={p.plan} /></td>
                          <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                            {formatDate(p.period_start.toISOString())} — {formatDate(p.period_end.toISOString())}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-zinc-200 whitespace-nowrap">{som(p.amount)}</td>
                          <td className="py-2 pl-3 text-zinc-400">
                            {METHOD_LABELS[p.method]}
                            {p.note && <span className="text-zinc-500"> · {p.note}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <GrantPlanForm workspaceId={workspace.id} hasActivePlan={active} />
          </div>
        );
      })}
    </div>
  );
}
