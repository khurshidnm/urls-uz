import React from 'react';
import { db } from '@/lib/db';
import AnalyticsViewClient from './analytics-client';

export default function AnalyticsPage() {
  const overview = db.getAnalyticsOverview();

  return <AnalyticsViewClient overview={overview} />;
}
