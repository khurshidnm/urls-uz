import crypto from 'crypto';
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { users } from '@/db/schema';
import { sha256, type UserRecord } from '@/lib/db';
import { decryptSecret, encryptSecret } from '@/lib/two-factor/secrets';
import { generateSecret, otpauthUri, verifyCode } from '@/lib/two-factor/totp';

/**
 * Optional two-step login with an authenticator app. Setup keeps the new
 * secret "pending" until the user proves the app works by entering a code;
 * only then is it switched on and recovery codes are issued.
 */

const RECOVERY_CODES = 10;

export const isTwoFactorEnabled = (user: Pick<UserRecord, 'totp_enabled_at'>) => user.totp_enabled_at !== null;

/** "abcd-efgh": easy to type, 40 random bits. */
function newRecoveryCode(): string {
  const raw = crypto.randomBytes(5).toString('hex');
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

const normalizeRecovery = (code: string) => code.trim().toLowerCase().replace(/[^a-f0-9]/g, '');

function newRecoveryCodes() {
  const codes = Array.from({ length: RECOVERY_CODES }, newRecoveryCode);
  return { codes, hashes: codes.map((c) => sha256(normalizeRecovery(c))) };
}

/** Starts (or restarts) setup: a new secret for the authenticator app. */
export async function startSetup(user: UserRecord) {
  const secret = generateSecret();
  await pg.update(users).set({ totp_pending_secret: encryptSecret(secret) }).where(eq(users.id, user.id));
  const account = user.email || user.phone || user.name;
  return { secret, uri: otpauthUri(secret, account) };
}

export type TwoFactorResult = { ok: true; recoveryCodes?: string[] } | { ok: false; code: string; error: string };

const wrongCode: TwoFactorResult = { ok: false, code: 'INVALID_CODE', error: 'Kod noto‘g‘ri yoki muddati o‘tgan. Ilovadagi yangi kodni kiriting.' };

/** Confirms setup with a code from the app; switches 2FA on and returns recovery codes (shown once). */
export async function enable(user: UserRecord, code: string): Promise<TwoFactorResult> {
  if (isTwoFactorEnabled(user)) return { ok: false, code: 'ALREADY_ENABLED', error: 'Ikki bosqichli himoya allaqachon yoqilgan.' };
  if (!user.totp_pending_secret) return { ok: false, code: 'NO_SETUP', error: 'Avval sozlashni boshlang.' };

  const secret = decryptSecret(user.totp_pending_secret);
  const step = verifyCode(secret, code, null);
  if (step === null) return wrongCode;

  const { codes, hashes } = newRecoveryCodes();
  await pg
    .update(users)
    .set({
      totp_secret: encryptSecret(secret),
      totp_pending_secret: null,
      totp_enabled_at: new Date(),
      totp_last_step: step,
      totp_recovery_codes: hashes,
    })
    .where(eq(users.id, user.id));
  return { ok: true, recoveryCodes: codes };
}

/**
 * Checks a login code: an authenticator code (each works once) or an unused
 * recovery code (then used up). Both updates are conditional, so two requests
 * racing with the same code can't both succeed.
 */
export async function checkCode(user: UserRecord, code: string): Promise<boolean> {
  if (!user.totp_secret) return false;

  const step = verifyCode(decryptSecret(user.totp_secret), code, user.totp_last_step);
  if (step !== null) {
    const updated = await pg
      .update(users)
      .set({ totp_last_step: step })
      .where(and(eq(users.id, user.id), or(isNull(users.totp_last_step), lt(users.totp_last_step, step))))
      .returning({ id: users.id });
    return updated.length > 0;
  }

  const recovery = normalizeRecovery(code);
  if (recovery.length !== 10) return false;
  const hash = sha256(recovery);
  const used = await pg
    .update(users)
    .set({ totp_recovery_codes: sql`array_remove(${users.totp_recovery_codes}, ${hash})` })
    .where(and(eq(users.id, user.id), sql`${hash} = any(${users.totp_recovery_codes})`))
    .returning({ id: users.id });
  return used.length > 0;
}

/** Switches 2FA off; needs a current code (or a recovery code). */
export async function disable(user: UserRecord, code: string): Promise<TwoFactorResult> {
  if (!isTwoFactorEnabled(user)) return { ok: false, code: 'NOT_ENABLED', error: 'Ikki bosqichli himoya yoqilmagan.' };
  if (!(await checkCode(user, code))) return wrongCode;
  await pg
    .update(users)
    .set({ totp_secret: null, totp_pending_secret: null, totp_enabled_at: null, totp_last_step: null, totp_recovery_codes: [] })
    .where(eq(users.id, user.id));
  return { ok: true };
}

/** New recovery codes (the old ones stop working); needs a current code. */
export async function regenerateRecoveryCodes(user: UserRecord, code: string): Promise<TwoFactorResult> {
  if (!isTwoFactorEnabled(user)) return { ok: false, code: 'NOT_ENABLED', error: 'Ikki bosqichli himoya yoqilmagan.' };
  if (!(await checkCode(user, code))) return wrongCode;
  const { codes, hashes } = newRecoveryCodes();
  await pg.update(users).set({ totp_recovery_codes: hashes }).where(eq(users.id, user.id));
  return { ok: true, recoveryCodes: codes };
}
