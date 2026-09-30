import { NextRequest } from 'next/server';
import { pickTelegramFields, upsertTelegramUser, verifyTelegramLogin } from '@/lib/telegram-auth';
import { completeRedirectLogin, loginErrorRedirect } from '@/lib/login-flow';

/**
 * Redirect target of the Telegram Login Widget (`data-auth-url`).
 * Telegram appends the signed user data as query parameters.
 */
export async function GET(request: NextRequest) {
  const data = pickTelegramFields(Object.fromEntries(request.nextUrl.searchParams));

  if (!verifyTelegramLogin(data)) {
    return loginErrorRedirect(request, 'Telegram xavfsizlik imzosi noto‘g‘ri yoki muddati o‘tgan');
  }

  const user = upsertTelegramUser(data);
  return completeRedirectLogin(request, user.id);
}
