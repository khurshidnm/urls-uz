import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { toClientJson } from '@/lib/serialize';
import DashboardOverviewClient from './overview-client';

export default async function DashboardOverviewPage() {
  const { workspace } = await requireWorkspace();
  const analytics = await db.getAnalyticsOverview(workspace.id);
  const links = (await db.getAllLinks(workspace.id)).map(toPublicLink);
  const bioPage = await db.getBioPageByWorkspace(workspace.id);

  return (
    <DashboardOverviewClient
      analytics={toClientJson(analytics)}
      links={toClientJson(links)}
      bioPage={toClientJson(bioPage)}
    />
  );
}
