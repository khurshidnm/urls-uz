import type { Metadata } from 'next';
import React from 'react';
import { db, toPublicApiKey } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import { limitsFor } from '@/lib/plans';
import ApiKeysClient from './api-keys-client';
import { getTr } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return { title: tr('API kalitlar', 'API-ключи', 'API keys') };
}

export default async function ApiKeysPage() {
  const { workspace, isAdmin } = await requireWorkspace();
  const keys = (await db.getApiKeys(workspace.id)).map(toPublicApiKey);

  return (
    <ApiKeysClient
      initialKeys={toClientJson(keys)}
      apiAccess={limitsFor(workspace, isAdmin).apiAccess}
      isAdmin={isAdmin}
    />
  );
}
