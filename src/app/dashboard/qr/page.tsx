import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import QrStudioClient from '@/components/qr-studio/qr-studio';

interface Props {
  searchParams: Promise<{ link?: string }>;
}

export default async function QrStudioPage({ searchParams }: Props) {
  const { link } = await searchParams;
  const ctx = await requireWorkspace();
  const links = (await db.getAllLinks(ctx.workspace.id)).filter((l) => !l.is_archived);

  return (
    <QrStudioClient
      links={toClientJson(links.map(toPublicLink))}
      initialLinkId={link && links.some((l) => l.id === link) ? link : null}
      canWrite={ctx.canWrite}
    />
  );
}
