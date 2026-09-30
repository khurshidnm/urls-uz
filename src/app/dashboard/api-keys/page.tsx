import React from 'react';
import { db, toPublicApiKey } from '@/lib/db';
import { getActor } from '@/lib/auth';
import ApiKeysClient from './api-keys-client';

export default async function ApiKeysPage() {
  const { ownerId } = await getActor();
  const keys = db.getApiKeys(ownerId).map(toPublicApiKey);

  return <ApiKeysClient initialKeys={keys} />;
}
