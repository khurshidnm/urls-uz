import React from 'react';
import { db } from '@/lib/db';
import LinksManagerClient from './links-client';

export default function LinksPage() {
  const links = db.getAllLinks();

  return <LinksManagerClient initialLinks={links} />;
}
