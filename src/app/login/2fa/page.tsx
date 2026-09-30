import React from 'react';
import { redirect } from 'next/navigation';
import { readChallenge } from '@/lib/two-factor/challenge';
import TwoFactorForm from './two-factor-form';

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
