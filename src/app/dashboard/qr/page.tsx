import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import QrStudioClient from './qr-studio-client';

export default async function QrStudioPage() {
  const { workspace } = await requireWorkspace();
  const links = (await db.getAllLinks(workspace.id)).map(toPublicLink);

  return <QrStudioClient links={toClientJson(links)} />;
}
