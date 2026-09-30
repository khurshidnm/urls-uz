import React from 'react';
import { db, toPublicApiKey } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import ApiKeysClient from './api-keys-client';

export default async function ApiKeysPage() {
  const { workspace } = await requireWorkspace();
  const keys = (await db.getApiKeys(workspace.id)).map(toPublicApiKey);

  return <ApiKeysClient initialKeys={toClientJson(keys)} />;
}
