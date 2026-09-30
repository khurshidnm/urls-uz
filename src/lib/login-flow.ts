import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { createLink } from '@/lib/links/create-link';
import { isTwoFactorEnabled } from '@/lib/two-factor/service';
import { setChallengeCookie, TWO_FACTOR_PATH } from '@/lib/two-factor/challenge';

/** Cookie set by the auth modal when a visitor tries to shorten a URL before logging in. */
export const PENDING_URL_COOKIE = 'urls_pending_url';

/** CSRF protection for the Google OAuth redirect. */
export const OAUTH_STATE_COOKIE = 'urls_oauth_state';
/** Marks an OAuth state as "connect this login method to my account". */
export const CONNECT_STATE_SUFFIX = '.connect';


/**
 * Phone login sends codes through Telegram Gateway. Without it there's no way
 * to deliver a code, so it's offered only in development (the code is shown on screen).
 */
export function phoneLoginAvailable(): boolean {
  return Boolean(process.env.TELEGRAM_GATEWAY_TOKEN) || process.env.NODE_ENV !== 'production';
}

/** OAuth redirect URIs must match exactly, so production uses the configured public URL. */
export function appOrigin(request: NextRequest): string {
  if (process.env.NODE_ENV !== 'production') return request.nextUrl.origin;
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

/** Shortens the URL the visitor entered before logging in. Returns true if a link was created. */
async function createPendingLink(userId: string, rawCookie: string): Promise<boolean> {
  // New links go to the user's first (personal) workspace
  const [membership] = await db.listWorkspacesForUser(userId);
  if (!membership) return false;

  const result = await createLink(
    { workspace: membership.workspace, userId },
    { destination_url: decodeURIComponent(rawCookie) },
    'landing'
  );
  return result.ok;
}

/**
 * Where to go once logged in: creates the link the visitor tried to shorten
 * before logging in (if any) and returns the dashboard page to open.
 */
export async function afterLogin(request: NextRequest, userId: string): Promise<{ path: string; hadPendingUrl: boolean }> {
  const pendingUrl = request.cookies.get(PENDING_URL_COOKIE)?.value;
  let path = '/dashboard';
  if (pendingUrl) {
    try {
      if (await createPendingLink(userId, pendingUrl)) path = '/dashboard/links';
    } catch (e) {
      console.error('Failed to create pending link after login:', e);
    }
  }
  return { path, hadPendingUrl: Boolean(pendingUrl) };
}

/**
 * Final step of every browser-redirect login (Google, Telegram widget):
 * start the session, create any pending link, and send the user to the
 * dashboard. Users with two-step login go to the code page first.
 */
export async function completeRedirectLogin(request: NextRequest, userId: string): Promise<NextResponse> {
  const user = await db.getUserById(userId);
  if (user && isTwoFactorEnabled(user)) {
    const response = NextResponse.redirect(`${appOrigin(request)}${TWO_FACTOR_PATH}`);
    setChallengeCookie(response, userId);
    return response;
  }

  const { path, hadPendingUrl } = await afterLogin(request, userId);
  const response = NextResponse.redirect(`${appOrigin(request)}${path}`);
  await setSessionCookie(response, userId);
  if (hadPendingUrl) response.cookies.delete(PENDING_URL_COOKIE);
  return response;
}

/** After connecting a login method from settings: back to settings with the outcome. */
export function connectRedirect(request: NextRequest, params: Record<string, string>): NextResponse {
  return NextResponse.redirect(`${appOrigin(request)}/dashboard/settings?${new URLSearchParams(params)}#login-methods`);
}

export function loginErrorRedirect(request: NextRequest, message: string): NextResponse {
  return NextResponse.redirect(`${appOrigin(request)}/?auth_error=${encodeURIComponent(message)}`);
}
