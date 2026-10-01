import React from 'react';
import { redirect } from 'next/navigation';
import { readChallenge } from '@/lib/two-factor/challenge';
import type { Metadata } from 'next';
import TwoFactorForm from './two-factor-form';

export const metadata: Metadata = { title: 'Ikki bosqichli tasdiqlash', robots: { index: false, follow: false } };

/** Second login step for users with two-step login. */
export default async function TwoFactorPage() {
  // Only reachable right after the first step (Google, Telegram, phone)
  if (!(await readChallenge())) redirect('/');
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <TwoFactorForm />
    </div>
  );
}
