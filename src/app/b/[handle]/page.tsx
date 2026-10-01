import React, { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { isBot } from '@/lib/bots';
import { db } from '@/lib/db';
import BioClientView from './bio-client-view';
import { toClientJson } from '@/lib/serialize';

interface Props {
  params: Promise<{ handle: string }>;
}

// Metadata and the page read the same bio page once per request
const getBioPage = cache((handle: string) => db.getBioPageByHandle(handle));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const bioPage = await getBioPage(handle);
  if (!bioPage) return { title: 'Sahifa topilmadi', robots: { index: false } };

  const title = `${bioPage.title} (@${bioPage.handle})`;
  const description = bioPage.bio || `${bioPage.title} — barcha havolalar bitta sahifada.`;
  const path = `/b/${bioPage.handle}`;
  // Social networks need a public image URL; uploaded avatars are data: URIs
  const avatar = bioPage.avatar_url.startsWith('https://') ? bioPage.avatar_url : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'profile', url: path, title, description, ...(avatar && { images: [{ url: avatar, alt: bioPage.title }] }) },
    twitter: { card: avatar ? 'summary' : 'summary_large_image', title, description, ...(avatar && { images: [avatar] }) },
  };
}

export default async function BioPublicPage({ params }: Props) {
  const { handle } = await params;
  const bioPage = await getBioPage(handle);

  if (!bioPage) {
    notFound();
  }

  // Count people, not search engines and link-preview bots
  if (!isBot((await headers()).get('user-agent'))) await db.recordBioPageView(bioPage.id);

  return (
    <BioClientView
      bioPage={toClientJson({
        ...bioPage,
        social_links_parsed: bioPage.social_links,
      })}
    />
  );
}
