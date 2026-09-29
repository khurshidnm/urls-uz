import React from 'react';
import { db } from '@/lib/db';
import DashboardOverviewClient from './overview-client';

export default function DashboardOverviewPage() {
  const analytics = db.getAnalyticsOverview();
  const links = db.getAllLinks();
  const bioPage = db.getBioPageByUserId('demo_user');

  return (
    <DashboardOverviewClient
      analytics={analytics}
      links={links}
      bioPage={bioPage}
    />
  );
}
