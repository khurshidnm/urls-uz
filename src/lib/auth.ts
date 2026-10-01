import { cookies, headers } from 'next/headers';
import type { NextResponse } from 'next/server';
import { limitsFor } from '@/lib/plans';
import { rateLimit } from '@/lib/rate-limit';
import { db, sha256, type MemberRole, type UserRecord, type UserRole, type WorkspaceRecord } from '@/lib/db';

/**
 * Server-side identity and tenancy. The session cookie holds an opaque
 * random token; the database stores only its hash. Nothing the client sends
 * (headers, body fields, localStorage) is trusted to say who the user is,
 * which workspace they may act in, or what role they have.
 */

export const SESSION_COOKIE = 'urls_sid';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Non-sensitive preference cookie; honoured only for superadmins. */
export const DEMO_EDIT_COOKIE = 'urls_demo_edit';

/** Which of the user's workspaces is active. Validated against memberships on every request. */
export const WORKSPACE_COOKIE = 'urls_ws';

export interface WorkspaceContext {
  /** Logged-in user (via session or the API key's creator), or null for anonymous visitors. */
  user: UserRecord | null;
  /** The workspace this request reads and writes. */
  workspace: WorkspaceRecord;
  /** The user's role in the workspace; null for anonymous demo viewers. */
  role: MemberRole | null;
  /** Anonymous visitors see the demo workspace read-only. */
  canWrite: boolean;
  /** Platform superadmin (from server config). */
  isAdmin: boolean;
  viaApiKey: boolean;
}

function listFromEnv(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Admin rights come only from server configuration, never from the client:
 * ADMIN_EMAILS (Google), ADMIN_TELEGRAM_IDS and ADMIN_PHONES (digits, e.g. 998901234567).
 */
export function roleFor(identity: { email?: string | null; telegramId?: string | null; phone?: string | null }): UserRole {
  const email = identity.email?.toLowerCase();
  if (email && listFromEnv('ADMIN_EMAILS').includes(email)) return 'superadmin';
  if (identity.telegramId && listFromEnv('ADMIN_TELEGRAM_IDS').includes(identity.telegramId)) return 'superadmin';
  const phone = identity.phone?.replace(/\D/g, '');
  if (phone && listFromEnv('ADMIN_PHONES').map((p) => p.replace(/\D/g, '')).includes(phone)) return 'superadmin';
  return 'user';
}

export async function setSessionCookie(response: NextResponse, userId: string) {
  const token = await db.createSession(userId, SESSION_MAX_AGE);
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
  response.cookies.delete(WORKSPACE_COOKIE);
}

export async function getSessionUser(): Promise<UserRecord | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (await db.getUserBySessionToken(token)) ?? null;
}

/** The logged-in platform superadmin, or null (admin pages 404 and admin APIs 403 for everyone else). */
export async function getSuperAdmin(): Promise<UserRecord | null> {
  const user = await getSessionUser();
  return user?.role === 'superadmin' ? user : null;
}

/** Current user from an API key (Authorization header) or the session cookie. */
export async function getCurrentUser(): Promise<UserRecord | null> {
  return (await requireWorkspace()).user;
}

/**
 * Resolves who is making the request and which workspace they act in.
 * Every route handler and server component goes through this, so tenancy
 * checks live in one place.
 */
/** A request with an API key that can't be served; routes turn it into a 401/403 via routeError(). */
export class ApiAuthError extends Error {
  constructor(
    readonly status: 401 | 403 | 429,
    readonly code: 'INVALID_API_KEY' | 'API_KEY_NOT_ACCEPTED' | 'PLAN_REQUIRED' | 'RATE_LIMITED',
    message: string
  ) {
    super(message);
  }
}

/**
 * The workspace a request acts on: the API key's, the logged-in user's, or
 * (for visitors) the read-only demo. `apiKey: true` marks the routes that
 * make up the public REST API; everywhere else an API key is refused, so a
 * leaked key can't manage keys, the bio page or the account.
 */
export async function requireWorkspace({ apiKey = false }: { apiKey?: boolean } = {}): Promise<WorkspaceContext> {
  const authHeader = (await headers()).get('authorization') || '';

  // API keys belong to a workspace
  if (authHeader.startsWith('Bearer ')) {
    if (!apiKey) throw new ApiAuthError(401, 'API_KEY_NOT_ACCEPTED', 'Bu endpoint API kalit bilan ishlamaydi.');
    const rawKey = authHeader.slice('Bearer '.length).trim();
    // 300 requests a minute per key (counted before the lookup, so guessing keys is limited too)
    const limit = await rateLimit(`apikey:${sha256(rawKey).slice(0, 24)}`, 300, 60_000);
    if (!limit.ok) throw new ApiAuthError(429, 'RATE_LIMITED', `Juda ko‘p so‘rov. ${limit.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`);
    const key = await db.verifyApiKey(rawKey);
    const workspace = key ? await db.getWorkspace(key.workspaceId) : undefined;
    if (!key || !workspace) throw new ApiAuthError(401, 'INVALID_API_KEY', 'API kalit noto‘g‘ri yoki bekor qilingan.');
    // Keys stop working when the workspace moves to a plan without API access
    if (!limitsFor(workspace).apiAccess) {
      throw new ApiAuthError(403, 'PLAN_REQUIRED', 'REST API faqat Pro va Biznes tariflarida mavjud.');
    }
    const user = key.createdBy ? (await db.getUserById(key.createdBy)) ?? null : null;
    return { user, workspace, role: 'member', canWrite: !workspace.is_demo, isAdmin: false, viaApiKey: true };
  }

  const user = await getSessionUser();
  if (!user) return anonymousContext();

  const isAdmin = user.role === 'superadmin';
  const cookieStore = await cookies();

  // Superadmins can switch into the demo workspace to curate it
  if (isAdmin && cookieStore.get(DEMO_EDIT_COOKIE)?.value === '1') {
    return { user, workspace: await db.getDemoWorkspace(), role: 'admin', canWrite: true, isAdmin, viaApiKey: false };
  }

  let memberships = await db.listWorkspacesForUser(user.id);
  if (memberships.length === 0) {
    await db.ensurePersonalWorkspace(user);
    memberships = await db.listWorkspacesForUser(user.id);
  }

  const requested = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const active = memberships.find((m) => m.workspace.id === requested) ?? memberships[0];

  return { user, workspace: active.workspace, role: active.role, canWrite: true, isAdmin, viaApiKey: false };
}

async function anonymousContext(): Promise<WorkspaceContext> {
  return { user: null, workspace: await db.getDemoWorkspace(), role: null, canWrite: false, isAdmin: false, viaApiKey: false };
}

/** Shape of the user object sent to the browser. */
export function toClientUser(user: UserRecord, workspace?: WorkspaceRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? '',
    phone: user.phone ?? undefined,
    provider: user.provider,
    plan: workspace?.plan ?? 'free',
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
