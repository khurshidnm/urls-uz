import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import LinksManagerClient from './links-client';

export default async function LinksPage() {
  const { workspace } = await requireWorkspace();
  const links = (await db.getAllLinks(workspace.id)).map(toPublicLink);

  return <LinksManagerClient initialLinks={toClientJson(links)} />;
}
