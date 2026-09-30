import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { getActor } from '@/lib/auth';
import AnalyticsViewClient from './analytics-client';

interface PageProps {
  searchParams?: Promise<{ link_id?: string; slug?: string }>;
}

export default async function AnalyticsPage(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const { ownerId } = await getActor();
  const overview = db.getAnalyticsOverview(ownerId);
  const allLinks = db.getAllLinks(ownerId);

  // Only links in the current workspace can be selected
  let initialLinkId: string | null = null;
  if (searchParams?.link_id && allLinks.some((l) => l.id === searchParams.link_id)) {
    initialLinkId = searchParams.link_id;
  } else if (searchParams?.slug) {
    const cleanSlug = searchParams.slug.replace(/^\//, '').trim();
    initialLinkId = allLinks.find((l) => l.slug === cleanSlug)?.id ?? null;
  }

  let initialLinkAnalytics = null;
  if (initialLinkId) {
    const analytics = db.getLinkAnalytics(initialLinkId)!;
    initialLinkAnalytics = { ...analytics, link: toPublicLink(analytics.link) };
  }

  return (
    <AnalyticsViewClient
      overview={overview}
      links={allLinks.map(toPublicLink)}
      initialLinkId={initialLinkId}
      initialLinkAnalytics={initialLinkAnalytics}
    />
  );
}
