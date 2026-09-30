import React from 'react';
import { db, toPublicLink } from '@/lib/db';
import { getActor } from '@/lib/auth';
import DashboardOverviewClient from './overview-client';

export default async function DashboardOverviewPage() {
  const { ownerId } = await getActor();
  const analytics = db.getAnalyticsOverview(ownerId);
  const links = db.getAllLinks(ownerId).map(toPublicLink);
  const bioPage = db.getBioPageByUserId(ownerId);

  return (
    <DashboardOverviewClient
      analytics={analytics}
      links={links}
      bioPage={bioPage}
    />
  );
}
