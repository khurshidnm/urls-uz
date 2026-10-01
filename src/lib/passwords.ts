import crypto from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';

/**
 * Account passwords (login + password sign-in). scrypt with OWASP-level cost
 * (N=2^15, r=8), run asynchronously so hashing never blocks other requests.
 * Stored as "scrypt$N$r$p$salt$hash" so the cost can be raised later.
 */

const scrypt = promisify(crypto.scrypt) as (password: string, salt: string, keylen: number, options: crypto.ScryptOptions) => Promise<Buffer>;
const PARAMS = { N: 32768, r: 8, p: 1 };
const KEY_LENGTH = 32;
// scrypt needs 128 * N * r bytes; Node's default cap is 32 MiB
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAXMEM });
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const parts = stored?.split('$') ?? [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, expected.length, { N: Number(N), r: Number(r), p: Number(p), maxmem: MAXMEM });
  return crypto.timingSafeEqual(expected, actual);
}

/** A hash to compare against when the login doesn't exist, so timing doesn't reveal which logins exist. */
let dummyHash: Promise<string> | null = null;
export function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(crypto.randomBytes(16).toString('hex'));
  return dummyHash;
}

/** Logins: 3–30 lowercase Latin letters, digits and underscores (stored lowercase). */
export const loginSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, 'Login 3–30 ta belgi: lotin harflari, raqamlar va pastki chiziq (_)');

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwerty123', 'qwertyuiop', '11111111',
  '00000000', '12341234', 'iloveyou', 'admin123', 'abcd1234', 'parol123', 'toshkent', 'uzbekistan',
]);

/** At least 8 characters (NIST 800-63B: length over composition rules), not a well-known password. */
export const passwordSchema = z
  .string()
  .min(8, 'Parol kamida 8 ta belgidan iborat bo‘lsin')
  .max(128, 'Parol ko‘pi bilan 128 ta belgi')
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), 'Bu parol juda keng tarqalgan, boshqasini tanlang');
