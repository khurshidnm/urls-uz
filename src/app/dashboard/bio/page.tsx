import React from 'react';
import { db } from '@/lib/db';
import { getActor } from '@/lib/auth';
import BioBuilderClient from './bio-builder-client';

export default async function BioBuilderPage() {
  const { ownerId } = await getActor();
  const bioPage = db.getBioPageByUserId(ownerId);

  return <BioBuilderClient initialBio={bioPage} />;
}
