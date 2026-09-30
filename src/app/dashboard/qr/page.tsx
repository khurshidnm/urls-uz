import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { getActor } from '@/lib/auth';
import QrStudioClient from './qr-studio-client';

export default async function QrStudioPage() {
  const { ownerId } = await getActor();
  const links = db.getAllLinks(ownerId).map(toPublicLink);

  return <QrStudioClient links={links} />;
}
