import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { getActor } from '@/lib/auth';
import LinksManagerClient from './links-client';

export default async function LinksPage() {
  const { ownerId } = await getActor();
  const links = db.getAllLinks(ownerId).map(toPublicLink);

  return <LinksManagerClient initialLinks={links} />;
}
