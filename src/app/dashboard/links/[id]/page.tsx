import type { Metadata } from 'next';
import React from 'react';
import { notFound } from 'next/navigation';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import { qrRepo } from '@/lib/qr/qr-repo';
import LinkDetailClient, { type LinkTab } from './link-detail-client';
import { getTr } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return { title: tr('Havola', 'Ссылка', 'Link') };
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS: LinkTab[] = ['analytics', 'qr', 'settings', 'history'];

/** One place for everything about a link: analytics, QR code, settings and history. */
export default async function LinkDetailPage({ params, searchParams }: Props) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const ctx = await requireWorkspace();

  const link = await db.getOwnedLink(id, ctx.workspace.id);
  if (!link) notFound();

  const [analytics, events, folders, qrCode] = await Promise.all([
    db.getLinkAnalytics(link.id, '30d'),
    db.getLinkEvents(link.id),
    db.listFolders(ctx.workspace.id),
    link.source === 'qr' ? qrRepo.getByLinkId(link.id) : undefined,
  ]);

  return (
    <LinkDetailClient
      key={link.id}
      initialTab={TABS.includes(tab as LinkTab) ? (tab as LinkTab) : 'analytics'}
      link={toClientJson(toPublicLink(link))}
      analytics={toClientJson({ ...analytics!, link: toPublicLink(analytics!.link) })}
      events={toClientJson(events.map(({ event, user }) => ({ ...event, user })))}
      folders={toClientJson(folders)}
      canWrite={ctx.canWrite}
      qrCodeId={qrCode?.id ?? null}
    />
  );
}
