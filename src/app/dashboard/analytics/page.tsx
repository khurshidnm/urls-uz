import React from 'react';
import { db } from '@/lib/db';
import AnalyticsViewClient from './analytics-client';

interface PageProps {
  searchParams?: Promise<{ link_id?: string; slug?: string }>;
}

export default async function AnalyticsPage(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const overview = db.getAnalyticsOverview();
  const allLinks = db.getAllLinks();

  let initialLinkId: string | null = searchParams?.link_id || null;
  if (!initialLinkId && searchParams?.slug) {
    const cleanSlug = searchParams.slug.replace(/^\//, '').trim();
    const found = allLinks.find((l) => l.slug === cleanSlug);
    if (found) initialLinkId = found.id;
  }

  let initialLinkAnalytics = null;
  if (initialLinkId) {
    initialLinkAnalytics = db.getLinkAnalytics(initialLinkId);
  }

  return (
    <AnalyticsViewClient
      overview={overview}
      links={allLinks}
      initialLinkId={initialLinkId}
      initialLinkAnalytics={initialLinkAnalytics}
    />
  );
}
