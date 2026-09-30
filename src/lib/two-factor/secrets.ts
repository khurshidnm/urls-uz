import crypto from 'crypto';

/**
 * Keys derived from AUTH_SECRET: one encrypts TOTP secrets at rest, one signs
 * the "password step done, code still needed" login cookie. Development
 * without AUTH_SECRET uses a fixed key, so secrets survive server restarts.
 */
function baseSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be set in production');
  return 'urls-uz-development-only-secret';
}

const key = (purpose: string) => crypto.createHash('sha256').update(`${baseSecret()}:${purpose}`).digest();

/** AES-256-GCM; "iv.tag.ciphertext" in base64url. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key('totp-secret'), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
}

export function decryptSecret(stored: string): string {
  const [iv, tag, data] = stored.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key('totp-secret'), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function sign(value: string): string {
  return crypto.createHmac('sha256', key('login-challenge')).update(value).digest('base64url');
}

export function signaturesMatch(a: string, b: string): boolean {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
