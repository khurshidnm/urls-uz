import type { Metadata } from 'next';
import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { listIdentities } from '@/lib/accounts';
import { phoneLoginAvailable } from '@/lib/login-flow';
import SettingsClient from './settings-client';
import LoginMethods from './login-methods';
import { connectMessage } from './connect-message';
import TwoFactorSettings from './two-factor-settings';
import { isTwoFactorEnabled } from '@/lib/two-factor/service';

export const metadata: Metadata = { title: 'Sozlamalar' };

interface Props {
  searchParams: Promise<{ connected?: string; outcome?: string; connect_error?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const [{ connected, outcome, connect_error }, user] = await Promise.all([searchParams, getSessionUser()]);
  const methods = user ? await listIdentities(user.id) : [];

  // Connecting Google comes back here from a redirect, with its outcome in the URL
  const notice = connect_error
    ? { kind: 'error' as const, text: connect_error }
    : connected === 'google'
      ? { kind: 'success' as const, text: connectMessage('Google', outcome) }
      : null;

  return (
    <SettingsClient
      profile={user && { name: user.name, email: user.email, phone: user.phone }}
      loginMethods={
        user && (
          <>
            <LoginMethods
              methods={methods.map((m) => ({ provider: m.provider, providerId: m.provider_id, label: m.label }))}
              notice={notice}
              phoneLoginAvailable={phoneLoginAvailable()}
            />
            <TwoFactorSettings
              enabled={isTwoFactorEnabled(user)}
              enabledAt={user.totp_enabled_at?.toISOString() ?? null}
              recoveryCodesLeft={user.totp_recovery_codes.length}
            />
          </>
        )
      }
    />
  );
}
