import React from 'react';
import { db } from '@/lib/db';
import QrStudioClient from './qr-studio-client';

export default function QrStudioPage() {
  const links = db.getAllLinks();

  return <QrStudioClient links={links} />;
}
