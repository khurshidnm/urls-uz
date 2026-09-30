import type { Metadata } from 'next';
import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import QrStudioClient from '@/components/qr-studio/qr-studio';
import type { QrDataType } from '@/lib/qr-payloads';

export const metadata: Metadata = { title: 'Yangi QR kod' };

interface Props {
  searchParams: Promise<{ link?: string; type?: string }>;
}

const TYPES: QrDataType[] = ['url', 'text', 'vcard', 'location', 'wifi', 'event'];

export default async function NewQrPage({ searchParams }: Props) {
  const { link, type } = await searchParams;
  const ctx = await requireWorkspace();
  const links = (await db.getAllLinks(ctx.workspace.id)).filter((l) => !l.is_archived);

  return (
    <QrStudioClient
      links={toClientJson(links.map(toPublicLink))}
      initialLinkId={link && links.some((l) => l.id === link) ? link : null}
      initialType={TYPES.find((t) => t === type) ?? 'url'}
      canWrite={ctx.canWrite}
    />
  );
}
