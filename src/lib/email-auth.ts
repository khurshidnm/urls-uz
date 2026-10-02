import crypto from 'crypto';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { pg } from '@/db/client';
import { emailCodes, sessions, userIdentities, users } from '@/db/schema';
import { newId, type UserRecord } from '@/lib/db';
import { signIn } from '@/lib/accounts';
import { alreadyRegisteredEmail, codeEmail, resetForGoogleAccountEmail, resetNoAccountEmail, sendMail } from '@/lib/mail';
import { dummyPasswordHash, hashPassword, verifyPassword } from '@/lib/passwords';
import { sign } from '@/lib/two-factor/secrets';

/**
 * Email accounts: sign up with a code sent by email, sign in with email +
 * password, reset a forgotten password, connect an email in settings.
 * A confirmed email is a verified identity, like Telegram or Google.
 */

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export const emailSchema = z.string().trim().toLowerCase().email('Email manzil noto‘g‘ri').max(200);

type Purpose = 'signup' | 'reset' | 'connect';
export type EmailResult<T = object> = ({ ok: true } & T) | { ok: false; code: string; error: string };

const codeHash = (email: string, code: string) => sign(`email-code:${email}:${code}`);

/** A new code for this email and purpose; older unused ones stop working. In development it's also returned. */
async function issueCode(email: string, purpose: Purpose, extra: { userId?: string; name?: string; passwordHash?: string } = {}) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await pg.transaction(async (tx) => {
    await tx
      .update(emailCodes)
      .set({ used_at: new Date() })
      .where(and(eq(emailCodes.email, email), eq(emailCodes.purpose, purpose), isNull(emailCodes.used_at)));
    await tx.insert(emailCodes).values({
      id: newId('ecode'),
      email,
      purpose,
      code_hash: codeHash(email, code),
      user_id: extra.userId ?? null,
      name: extra.name ?? null,
      password_hash: extra.passwordHash ?? null,
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
    });
  });
  await sendMail({ to: email, ...codeEmail(purpose, code, CODE_TTL_MINUTES) });
  return process.env.NODE_ENV === 'production' ? undefined : code;
}

const wrongCode = { ok: false as const, code: 'INVALID_CODE', error: 'Kod noto‘g‘ri yoki muddati o‘tgan' };

/** Uses up the latest code for this email and purpose, if `code` matches (5 tries per code). */
async function consumeCode(email: string, purpose: Purpose, code: string, userId?: string) {
  return pg.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(emailCodes)
      .where(and(eq(emailCodes.email, email), eq(emailCodes.purpose, purpose), isNull(emailCodes.used_at), gt(emailCodes.expires_at, new Date())))
      .orderBy(desc(emailCodes.created_at))
      .limit(1)
      .for('update');
    if (!row || row.attempts >= MAX_ATTEMPTS || (userId && row.user_id !== userId)) return null;
    const expected = codeHash(email, code.trim());
    const matches = expected.length === row.code_hash.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(row.code_hash));
    if (!matches) {
      await tx.update(emailCodes).set({ attempts: row.attempts + 1 }).where(eq(emailCodes.id, row.id));
      return null;
    }
    await tx.update(emailCodes).set({ used_at: new Date() }).where(eq(emailCodes.id, row.id));
    return row;
  });
}

async function emailIdentity(email: string) {
  const [row] = await pg
    .select()
    .from(userIdentities)
    .where(and(eq(userIdentities.provider, 'email'), eq(userIdentities.provider_id, email)));
  return row;
}

async function setIdentityPassword(email: string, passwordHash: string) {
  await pg
    .update(userIdentities)
    .set({ password_hash: passwordHash })
    .where(and(eq(userIdentities.provider, 'email'), eq(userIdentities.provider_id, email)));
}

// --- Sign up ----------------------------------------------------------------

/**
 * Step 1: emails a code. If the email already has an account, it gets a
 * "you already have an account" email instead, and the response is the same,
 * so the form can't be used to find out who is registered.
 */
export async function requestSignup(input: { email: string; password: string; name: string }): Promise<EmailResult<{ devCode?: string }>> {
  if (await emailIdentity(input.email)) {
    await sendMail({ to: input.email, ...alreadyRegisteredEmail() });
    return { ok: true };
  }
  const devCode = await issueCode(input.email, 'signup', { name: input.name, passwordHash: await hashPassword(input.password) });
  return { ok: true, devCode };
}

/** Step 2: the code creates the account (or joins an account that already has this verified email from Google). */
export async function confirmSignup(email: string, code: string): Promise<EmailResult<{ user: UserRecord }>> {
  const row = await consumeCode(email, 'signup', code);
  if (!row) return wrongCode;
  if (await emailIdentity(email)) return { ok: false, code: 'ALREADY_REGISTERED', error: 'Bu email allaqachon ro‘yxatdan o‘tgan. Kirish oynasidan kiring.' };

  // Same verified email as an existing (Google) account: one person, one account
  const [sameEmail] = await pg.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  const result = await signIn(
    { provider: 'email', providerId: email, email, name: row.name || email.split('@')[0], label: email },
    { connectTo: sameEmail?.id ?? null }
  );
  if (!result.ok) return { ok: false, code: result.code, error: result.error };
  await setIdentityPassword(email, row.password_hash!);
  return { ok: true, user: result.user };
}

// --- Sign in ----------------------------------------------------------------

/** Email + password; the same work whether or not the email is registered. */
export async function verifyEmailLogin(email: string, password: string): Promise<UserRecord | null> {
  const identity = await emailIdentity(email);
  const valid = await verifyPassword(password, identity?.password_hash ?? (await dummyPasswordHash()));
  if (!identity || !valid) return null;
  await pg
    .update(userIdentities)
    .set({ last_login_at: new Date() })
    .where(and(eq(userIdentities.provider, 'email'), eq(userIdentities.provider_id, email)));
  await pg.update(users).set({ last_login_at: new Date() }).where(eq(users.id, identity.user_id));
  const [user] = await pg.select().from(users).where(eq(users.id, identity.user_id));
  return user ?? null;
}

// --- Forgotten password -----------------------------------------------------

/**
 * Emails a reset code if the email has an email account. Otherwise it emails
 * what to do instead (sign in with Google, or sign up), so the person isn't
 * left waiting. The response is the same in every case: no account enumeration.
 */
export async function requestPasswordReset(email: string): Promise<EmailResult<{ devCode?: string }>> {
  if (await emailIdentity(email)) return { ok: true, devCode: await issueCode(email, 'reset') };
  const [google] = await pg.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  await sendMail({ to: email, ...(google ? resetForGoogleAccountEmail() : resetNoAccountEmail()) });
  return { ok: true };
}

/** Sets the new password and signs the account out everywhere (someone else may have known the old one). */
export async function confirmPasswordReset(email: string, code: string, password: string): Promise<EmailResult> {
  const identity = await emailIdentity(email);
  if (!identity || !(await consumeCode(email, 'reset', code))) return wrongCode;
  await setIdentityPassword(email, await hashPassword(password));
  await pg.delete(sessions).where(eq(sessions.user_id, identity.user_id));
  return { ok: true };
}

// --- Settings ---------------------------------------------------------------

/** Emails a code to add this email (with a password) to the logged-in account. */
export async function requestEmailConnect(userId: string, email: string, password: string): Promise<EmailResult<{ devCode?: string }>> {
  const existing = await emailIdentity(email);
  if (existing?.user_id === userId) return { ok: false, code: 'ALREADY_CONNECTED', error: 'Bu email akkauntingizga allaqachon ulangan' };
  const devCode = await issueCode(email, 'connect', { userId, passwordHash: await hashPassword(password) });
  return { ok: true, devCode };
}

/** Confirms the code; an email that had its own account is merged into this one. */
export async function confirmEmailConnect(userId: string, email: string, code: string): Promise<EmailResult<{ outcome: string }>> {
  const row = await consumeCode(email, 'connect', code, userId);
  if (!row) return wrongCode;
  const result = await signIn({ provider: 'email', providerId: email, email, name: email.split('@')[0], label: email }, { connectTo: userId });
  if (!result.ok) return { ok: false, code: result.code, error: result.error };
  await setIdentityPassword(email, row.password_hash!);
  return { ok: true, outcome: result.outcome };
}

/** Changes the email login's password (needs the current one). */
export async function changeEmailPassword(userId: string, currentPassword: string, password: string): Promise<EmailResult> {
  const [identity] = await pg
    .select()
    .from(userIdentities)
    .where(and(eq(userIdentities.provider, 'email'), eq(userIdentities.user_id, userId)));
  if (!identity) return { ok: false, code: 'NO_EMAIL', error: 'Akkauntga email ulanmagan' };
  if (!(await verifyPassword(currentPassword, identity.password_hash))) return { ok: false, code: 'WRONG_PASSWORD', error: 'Joriy parol noto‘g‘ri' };
  await setIdentityPassword(identity.provider_id, await hashPassword(password));
  return { ok: true };
}
