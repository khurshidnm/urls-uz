import React from 'react';
import { db } from '@/lib/db';
import ApiKeysClient from './api-keys-client';

export default function ApiKeysPage() {
  const keys = db.getApiKeys('demo_user');

  return <ApiKeysClient initialKeys={keys} />;
}
