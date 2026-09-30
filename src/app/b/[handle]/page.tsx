import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BioClientView from './bio-client-view';
import { toClientJson } from '@/lib/serialize';

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function BioPublicPage({ params }: Props) {
  const { handle } = await params;
  const bioPage = await db.getBioPageByHandle(handle);

  if (!bioPage) {
    notFound();
  }

  // Increment view count
  await db.recordBioPageView(bioPage.id);

  return (
    <BioClientView
      bioPage={toClientJson({
        ...bioPage,
        social_links_parsed: bioPage.social_links,
      })}
    />
  );
}
