import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import AnalyticsViewClient from './analytics-client';

interface PageProps {
  searchParams?: Promise<{ link_id?: string; slug?: string }>;
}

export default async function AnalyticsPage(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const { workspace } = await requireWorkspace();
  const overview = await db.getAnalyticsOverview(workspace.id);
  const allLinks = await db.getAllLinks(workspace.id);

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
    const analytics = await db.getLinkAnalytics(initialLinkId);
    if (analytics) initialLinkAnalytics = { ...analytics, link: toPublicLink(analytics.link) };
  }

  return (
    <AnalyticsViewClient
      overview={toClientJson(overview)}
      links={toClientJson(allLinks.map(toPublicLink))}
      initialLinkId={initialLinkId}
      initialLinkAnalytics={toClientJson(initialLinkAnalytics)}
    />
  );
}
