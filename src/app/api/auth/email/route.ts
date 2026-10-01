import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, getSessionUser, setSessionCookie, toClientUser } from '@/lib/auth';
import type { UserRecord } from '@/lib/db';
import {
  changeEmailPassword,
  confirmEmailConnect,
  confirmPasswordReset,
  confirmSignup,
  emailSchema,
  requestEmailConnect,
  requestPasswordReset,
  requestSignup,
  verifyEmailLogin,
} from '@/lib/email-auth';
import { emailLoginAvailable, MailError } from '@/lib/mail';
import { passwordSchema } from '@/lib/passwords';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { parseJson } from '@/lib/validation';
import { isTwoFactorEnabled } from '@/lib/two-factor/service';
import { setChallengeCookie, TWO_FACTOR_PATH } from '@/lib/two-factor/challenge';

const code = z.string().trim().regex(/^\d{6}$/, 'Kod 6 ta raqamdan iborat');

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('signup'), email: emailSchema, password: passwordSchema, name: z.string().trim().min(1, 'Ismingizni kiriting').max(80) }),
  z.object({ action: z.literal('verify'), email: emailSchema, code }),
  z.object({ action: z.literal('login'), email: emailSchema, password: z.string().min(1).max(200) }),
  z.object({ action: z.literal('reset-request'), email: emailSchema }),
  z.object({ action: z.literal('reset'), email: emailSchema, code, password: passwordSchema }),
  z.object({ action: z.literal('connect-request'), email: emailSchema, password: passwordSchema }),
  z.object({ action: z.literal('connect-verify'), email: emailSchema, code }),
  z.object({ action: z.literal('change-password'), currentPassword: z.string().max(200), password: passwordSchema }),
]);

const json = (body: object, status = 200) => NextResponse.json(body, { status });
const fail = (error: string, code: string, status = 400) => json({ success: false, error, code }, status);

async function limit(key: string, max: number, windowMs: number) {
  const r = await rateLimit(key, max, windowMs);
  if (r.ok) return null;
  const { body, init } = tooManyRequests(r.retryAfterSec);
  return NextResponse.json(body, init);
}

/** The session, or the 2FA code step for accounts that have it. */
async function loginResponse(user: UserRecord) {
  if (isTwoFactorEnabled(user)) {
    const response = json({ success: true, twoFactorRequired: true, redirect: TWO_FACTOR_PATH });
    setChallengeCookie(response, user.id);
    return response;
  }
  const response = json({ success: true, user: toClientUser(user) });
  await setSessionCookie(response, user.id);
  return response;
}

/** Email sign-up, sign-in, password reset and (logged in) connecting an email. */
export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  // Only the steps that send an email need ZeptoMail; signing in never does
  const sendsMail = body.action === 'signup' || body.action === 'reset-request' || body.action === 'connect-request';
  if (sendsMail && !emailLoginAvailable()) return fail('Email xatlari hozircha yuborilmaydi', 'EMAIL_UNAVAILABLE', 503);
  const ip = getClientIp(request.headers);

  try {
    switch (body.action) {
      case 'signup':
      case 'reset-request': {
        // Sending email costs money and can be abused: per address and per network
        const tooMany = (await limit(`email-send:${body.email}`, 5, 10 * 60_000)) ?? (await limit(`email-send-ip:${ip}`, 30, 60 * 60_000));
        if (tooMany) return tooMany;
        const result = body.action === 'signup' ? await requestSignup(body) : await requestPasswordReset(body.email);
        if (!result.ok) return fail(result.error, result.code);
        // The same answer whether or not the email is registered
        return json({ success: true, sent: true, ...('devCode' in result && result.devCode ? { devCode: result.devCode } : {}) });
      }
      case 'verify': {
        const tooMany = await limit(`email-verify:${body.email}`, 10, 10 * 60_000);
        if (tooMany) return tooMany;
        const result = await confirmSignup(body.email, body.code);
        if (!result.ok) return fail(result.error, result.code);
        return loginResponse(result.user);
      }
      case 'login': {
        const tooMany = (await limit(`email-login:${body.email}`, 5, 10 * 60_000)) ?? (await limit(`email-login-ip:${ip}`, 20, 10 * 60_000));
        if (tooMany) return tooMany;
        const user = await verifyEmailLogin(body.email, body.password);
        if (!user) return fail('Email yoki parol noto‘g‘ri', 'INVALID_CREDENTIALS', 401);
        return loginResponse(user);
      }
      case 'reset': {
        const tooMany = await limit(`email-verify:${body.email}`, 10, 10 * 60_000);
        if (tooMany) return tooMany;
        const result = await confirmPasswordReset(body.email, body.code, body.password);
        if (!result.ok) return fail(result.error, result.code);
        return json({ success: true });
      }
      default: {
        // Settings: the logged-in account
        const user = await getSessionUser();
        if (!user) return fail('Avval tizimga kiring', 'AUTH_REQUIRED', 401);
        const tooMany = await limit(`email-settings:${user.id}`, 5, 10 * 60_000);
        if (tooMany) return tooMany;
        if (body.action === 'connect-request') {
          const result = await requestEmailConnect(user.id, body.email, body.password);
          if (!result.ok) return fail(result.error, result.code);
          return json({ success: true, sent: true, ...(result.devCode ? { devCode: result.devCode } : {}) });
        }
        if (body.action === 'connect-verify') {
          const result = await confirmEmailConnect(user.id, body.email, body.code);
          if (!result.ok) return fail(result.error, result.code);
          return json({ success: true, outcome: result.outcome });
        }
        const result = await changeEmailPassword(user.id, body.currentPassword, body.password);
        if (!result.ok) return fail(result.error, result.code);
        return json({ success: true });
      }
    }
  } catch (error) {
    if (error instanceof MailError) return fail('Xat yuborib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.', 'MAIL_FAILED', 502);
    console.error('POST /api/auth/email failed:', error);
    return fail('Server xatosi', 'SERVER_ERROR', 500);
  }
}
