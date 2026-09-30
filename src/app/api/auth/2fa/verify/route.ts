import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { afterLogin, PENDING_URL_COOKIE } from '@/lib/login-flow';
import { rateLimit } from '@/lib/rate-limit';
import { parseJson } from '@/lib/validation';
import { clearChallengeCookie, readChallenge } from '@/lib/two-factor/challenge';
import { checkCode } from '@/lib/two-factor/service';

const schema = z.object({ code: z.string().trim().min(6).max(20) });

/** Second login step: the authenticator (or recovery) code. Starts the session. */
export async function POST(request: NextRequest) {
  const userId = await readChallenge();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Kirish muddati tugadi. Qaytadan kiring.', code: 'CHALLENGE_EXPIRED' }, { status: 401 });
  }
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  // A 6-digit code is guessable only with many tries
  const attempts = await rateLimit(`2fa-login:${userId}`, 5, 10 * 60 * 1000);
  if (!attempts.ok) {
    return NextResponse.json(
      { success: false, error: `Juda ko‘p urinish. ${attempts.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.` },
      { status: 429, headers: { 'Retry-After': String(attempts.retryAfterSec) } }
    );
  }

  const user = await db.getUserById(userId);
  if (!user || !(await checkCode(user, parsed.data.code))) {
    return NextResponse.json({ success: false, error: 'Kod noto‘g‘ri. Ilovadagi joriy kodni kiriting.', code: 'INVALID_CODE' }, { status: 401 });
  }

  const { path, hadPendingUrl } = await afterLogin(request, user.id);
  const response = NextResponse.json({ success: true, redirect: path });
  await setSessionCookie(response, user.id);
  clearChallengeCookie(response);
  if (hadPendingUrl) response.cookies.delete(PENDING_URL_COOKIE);
  return response;
}
