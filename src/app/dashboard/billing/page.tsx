import type { Metadata } from 'next';
import React from 'react';
import BillingClient from './billing-client';

export const metadata: Metadata = { title: 'Tarif va to‘lov' };

export default function BillingPage() {
  return <BillingClient />;
}
