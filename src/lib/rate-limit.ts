import { lt, sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { rateLimits } from '@/db/schema';

/**
 * Fixed-window rate limiter stored in Postgres, so every server process shares
 * the same counts (an in-memory limiter can be bypassed by hitting another
 * instance). One upsert per check.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const windowEnd = (window + 1) * windowMs;

  const [row] = await pg
    .insert(rateLimits)
    .values({ key, window, count: 1, expires_at: new Date(windowEnd) })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.window], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });

  // Now and then, drop finished windows
  if (Math.random() < 0.01) {
    pg.delete(rateLimits).where(lt(rateLimits.expires_at, new Date())).catch(() => {});
  }

  return row.count > limit ? { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowEnd - now) / 1000)) } : { ok: true, retryAfterSec: 0 };
}

/** The standard 429 response body and headers. */
export function tooManyRequests(retryAfterSec: number) {
  return {
    body: { success: false, error: `Juda ko‘p so‘rov. ${retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`, code: 'RATE_LIMITED' },
    init: { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  };
}

/**
 * How many links / QR codes one person (user, API key or Telegram account) may
 * create: 30 a minute and 1,000 a day, against spam and runaway scripts.
 */
export async function checkCreationLimit(actor: string): Promise<{ ok: boolean; retryAfterSec: number }> {
  const perMinute = await rateLimit(`create:min:${actor}`, 30, 60_000);
  if (!perMinute.ok) return perMinute;
  return rateLimit(`create:day:${actor}`, 1000, 86_400_000);
}
