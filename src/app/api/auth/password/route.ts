import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, getSessionUser, setSessionCookie, toClientUser } from '@/lib/auth';
import { setPasswordLogin, verifyPasswordLogin } from '@/lib/accounts';
import { loginSchema, passwordSchema } from '@/lib/passwords';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { parseJson } from '@/lib/validation';
import { isTwoFactorEnabled } from '@/lib/two-factor/service';
import { setChallengeCookie, TWO_FACTOR_PATH } from '@/lib/two-factor/challenge';

const signInSchema = z.object({
  login: z.string().trim().toLowerCase().min(1).max(60),
  password: z.string().min(1).max(200),
});

const setSchema = z.object({
  login: loginSchema,
  password: passwordSchema,
  currentPassword: z.string().max(200).optional(),
});

const limited = (retryAfterSec: number) => {
  const { body, init } = tooManyRequests(retryAfterSec);
  return NextResponse.json(body, init);
};

/** Sign in with login + password. Users with 2FA continue on the code page. */
export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, signInSchema);
  if (!parsed.ok) return parsed.response;
  const { login, password } = parsed.data;

  // Guessing is limited per login (protects the account) and per address (stops spraying many logins)
  const perLogin = await rateLimit(`pw-login:${login}`, 5, 10 * 60 * 1000);
  if (!perLogin.ok) return limited(perLogin.retryAfterSec);
  const perIp = await rateLimit(`pw-login-ip:${getClientIp(request.headers)}`, 20, 10 * 60 * 1000);
  if (!perIp.ok) return limited(perIp.retryAfterSec);

  const user = await verifyPasswordLogin(login, password);
  if (!user) {
    // One message for both cases, so it doesn't reveal which logins exist
    return NextResponse.json({ success: false, error: 'Login yoki parol noto‘g‘ri', code: 'INVALID_CREDENTIALS' }, { status: 401 });
  }

  if (isTwoFactorEnabled(user)) {
    const response = NextResponse.json({ success: true, twoFactorRequired: true, redirect: TWO_FACTOR_PATH });
    setChallengeCookie(response, user.id);
    return response;
  }
  const response = NextResponse.json({ success: true, user: toClientUser(user) });
  await setSessionCookie(response, user.id);
  return response;
}

/** Sets or changes the logged-in account's login and password (changing needs the current password). */
export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Avval tizimga kiring' }, { status: 401 });
  const parsed = await parseJson(request, setSchema);
  if (!parsed.ok) return parsed.response;

  const attempts = await rateLimit(`pw-set:${user.id}`, 5, 10 * 60 * 1000);
  if (!attempts.ok) return limited(attempts.retryAfterSec);

  const result = await setPasswordLogin(user.id, parsed.data);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: 400 });
  return NextResponse.json({ success: true, login: parsed.data.login });
}
