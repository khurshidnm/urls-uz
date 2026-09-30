import crypto from 'crypto';
import type { LinkRecord } from '@/lib/db';

/**
 * After a visitor enters the right password we set a short-lived cookie that
 * lets the normal redirect flow (device routing, UTM, analytics) run.
 * The token is bound to the current password hash, so changing the
 * password invalidates existing unlocks.
 */

export const UNLOCK_MAX_AGE = 60 * 60; // 1 hour

let devSecret: string | undefined;

function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set in production');
  }
  devSecret ??= crypto.randomBytes(32).toString('hex');
  return devSecret;
}

export function unlockCookieName(link: Pick<LinkRecord, 'id'>): string {
  return `urls_unlock_${link.id}`;
}

export function unlockToken(link: Pick<LinkRecord, 'id' | 'password'>): string {
  return crypto.createHmac('sha256', secret()).update(`${link.id}:${link.password}`).digest('base64url');
}

export function isUnlocked(link: Pick<LinkRecord, 'id' | 'password'>, cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = unlockToken(link);
  return cookieValue.length === expected.length && crypto.timingSafeEqual(Buffer.from(cookieValue), Buffer.from(expected));
}

/** Salted hash so unique visitors can be counted without storing IP addresses. */
export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', secret()).update(ip).digest('hex').slice(0, 32);
}
