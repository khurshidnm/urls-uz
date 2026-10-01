import type { Metadata } from 'next';
import React from 'react';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import BioBuilderClient from './bio-builder-client';

export const metadata: Metadata = { title: 'Link-in-Bio' };

export default async function BioBuilderPage() {
  const { workspace, user } = await requireWorkspace();
  const bioPage = await db.getBioPageByWorkspace(workspace.id);

  return <BioBuilderClient initialBio={toClientJson(bioPage)} owner={{ name: user?.name ?? '', avatar: user?.avatar_url ?? '' }} />;
}
