import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { appOrigin, CONNECT_STATE_SUFFIX, OAUTH_STATE_COOKIE } from '@/lib/login-flow';

/**
 * Starts the Google OAuth flow. The `state` value protects the callback
 * against CSRF; `?connect=1` (from settings) adds Google to the logged-in
 * account, and is carried inside the state so it can't be forged.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ success: false, error: 'GOOGLE_CLIENT_ID sozlanmagan' }, { status: 500 });
  }

  const connect = request.nextUrl.searchParams.get('connect') === '1';
  const state = crypto.randomBytes(24).toString('base64url') + (connect ? CONNECT_STATE_SUFFIX : '');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appOrigin(request)}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    prompt: 'select_account',
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  });
  return response;
}
