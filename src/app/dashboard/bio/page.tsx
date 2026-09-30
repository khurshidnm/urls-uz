import React from 'react';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import BioBuilderClient from './bio-builder-client';

export default async function BioBuilderPage() {
  const { workspace } = await requireWorkspace();
  const bioPage = await db.getBioPageByWorkspace(workspace.id);

  return <BioBuilderClient initialBio={toClientJson(bioPage)} />;
}
