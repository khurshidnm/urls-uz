import { cookies, headers } from 'next/headers';
import type { NextResponse } from 'next/server';
import { db, type UserRecord, type UserRole } from '@/lib/db';

/**
 * Server-side identity. The session cookie holds an opaque random token; the
 * database stores only its hash. Nothing the client sends (headers, body
 * fields, localStorage) is trusted to say who the user is or what role they have.
 */

export const SESSION_COOKIE = 'urls_sid';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Non-sensitive preference cookie; honoured only for superadmins. */
export const DEMO_EDIT_COOKIE = 'urls_demo_edit';

export const DEMO_USER_ID = 'demo_user';

export interface Actor {
  /** Logged-in user (via session cookie or API key), or null for anonymous visitors. */
  user: UserRecord | null;
  /** Whose data this request reads and writes. */
  ownerId: string;
  /** True when the request is looking at the shared demo workspace. */
  isDemo: boolean;
  /** Anonymous visitors see the demo workspace read-only. */
  canWrite: boolean;
  isAdmin: boolean;
}

function listFromEnv(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/** Admin rights come only from server configuration, never from the client. */
export function roleFor(identity: { email?: string | null; telegramId?: string | null }): UserRole {
  const email = identity.email?.toLowerCase();
  if (email && listFromEnv('ADMIN_EMAILS').includes(email)) return 'superadmin';
  if (identity.telegramId && listFromEnv('ADMIN_TELEGRAM_IDS').includes(identity.telegramId)) return 'superadmin';
  return 'user';
}

export function setSessionCookie(response: NextResponse, userId: string) {
  const token = db.createSession(userId, SESSION_MAX_AGE);
  response.cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(DEMO_EDIT_COOKIE);
}

/** Resolves the current user from an API key (Authorization header) or the session cookie. */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const headerList = await headers();
  const authHeader = headerList.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const ownerId = db.verifyApiKey(authHeader.slice('Bearer '.length).trim());
    return ownerId ? db.getUserById(ownerId) ?? null : null;
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return db.getUserBySessionToken(token) ?? null;
}

export async function getActor(): Promise<Actor> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, ownerId: DEMO_USER_ID, isDemo: true, canWrite: false, isAdmin: false };
  }

  const isAdmin = user.role === 'superadmin';
  const editingDemo = isAdmin && (await cookies()).get(DEMO_EDIT_COOKIE)?.value === '1';

  return {
    user,
    ownerId: editingDemo ? DEMO_USER_ID : user.id,
    isDemo: editingDemo,
    canWrite: true,
    isAdmin,
  };
}

/** Shape of the user object sent to the browser. */
export function toClientUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? '',
    phone: user.phone ?? undefined,
    provider: user.provider,
    plan: user.plan,
    role: user.role,
    avatar: user.avatar_url ?? undefined,
  };
}

export function getClientIp(headerList: Headers): string {
  return (
    headerList.get('cf-connecting-ip') ||
    headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headerList.get('x-real-ip') ||
    'unknown'
  );
}
