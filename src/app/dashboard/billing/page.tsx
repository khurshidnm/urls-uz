import type { Metadata } from 'next';
import React from 'react';
import BillingClient from './billing-client';
import { getTr } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTr();
  return { title: tr('Tarif va to‘lov', 'Тариф и оплата', 'Plan & billing') };
}

export default function BillingPage() {
  return <BillingClient />;
}
