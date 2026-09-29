import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BioClientView from './bio-client-view';

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function BioPublicPage({ params }: Props) {
  const { handle } = await params;
  const bioPage = db.getBioPageByHandle(handle);

  if (!bioPage) {
    notFound();
  }

  // Increment view count
  db.recordBioPageView(bioPage.id);

  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = JSON.parse(bioPage.social_links || '{}');
  } catch {
    socialLinks = {};
  }

  return (
    <BioClientView
      bioPage={{
        ...bioPage,
        social_links_parsed: socialLinks,
      }}
    />
  );
}
