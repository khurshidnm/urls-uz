import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { sign, signaturesMatch } from '@/lib/two-factor/secrets';

/**
 * Between the first login step (Google, Telegram, phone) and the
 * authenticator code: a short-lived signed cookie naming the user. No session
 * exists until the code is right.
 */

export const TWO_FACTOR_COOKIE = 'urls_2fa';
export const TWO_FACTOR_PATH = '/login/2fa';
const TTL_MS = 10 * 60 * 1000;

export function setChallengeCookie(response: NextResponse, userId: string) {
  const expires = Date.now() + TTL_MS;
  const value = `${userId}.${expires}`;
  response.cookies.set(TWO_FACTOR_COOKIE, `${value}.${sign(value)}`, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL_MS / 1000,
  });
}

export function clearChallengeCookie(response: NextResponse) {
  response.cookies.delete(TWO_FACTOR_COOKIE);
}

/** The user waiting for their code, if the cookie is genuine and fresh. */
export async function readChallenge(): Promise<string | null> {
  const raw = (await cookies()).get(TWO_FACTOR_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const [userId, expires, signature] = parts;
  if (!signaturesMatch(signature, sign(`${userId}.${expires}`))) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}
