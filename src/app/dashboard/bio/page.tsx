import React from 'react';
import { db } from '@/lib/db';
import BioBuilderClient from './bio-builder-client';

export default function BioBuilderPage() {
  const bioPage = db.getBioPageByUserId('demo_user');

  return <BioBuilderClient initialBio={bioPage} />;
}
