import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { createLink } from '@/lib/links/create-link';

/** Cookie set by the auth modal when a visitor tries to shorten a URL before logging in. */
export const PENDING_URL_COOKIE = 'urls_pending_url';

/** CSRF protection for the Google OAuth redirect. */
export const OAUTH_STATE_COOKIE = 'urls_oauth_state';


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
 * Final step of every browser-redirect login (Google, Telegram widget):
 * start the session, create any pending link, and send the user to the dashboard.
 */
export async function completeRedirectLogin(request: NextRequest, userId: string): Promise<NextResponse> {
  const pendingUrl = request.cookies.get(PENDING_URL_COOKIE)?.value;
  let redirectPath = '/dashboard';

  if (pendingUrl) {
    try {
      if (await createPendingLink(userId, pendingUrl)) redirectPath = '/dashboard/links';
    } catch (e) {
      console.error('Failed to create pending link after login:', e);
    }
  }

  const response = NextResponse.redirect(`${appOrigin(request)}${redirectPath}`);
  await setSessionCookie(response, userId);
  if (pendingUrl) response.cookies.delete(PENDING_URL_COOKIE);
  return response;
}

export function loginErrorRedirect(request: NextRequest, message: string): NextResponse {
  return NextResponse.redirect(`${appOrigin(request)}/?auth_error=${encodeURIComponent(message)}`);
}
