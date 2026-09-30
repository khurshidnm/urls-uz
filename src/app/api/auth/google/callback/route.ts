import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { roleFor } from '@/lib/auth';
import { appOrigin, completeRedirectLogin, loginErrorRedirect, OAUTH_STATE_COOKIE } from '@/lib/login-flow';

function statesMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return loginErrorRedirect(request, error || 'Kirish bekor qilindi');
  }

  if (!statesMatch(searchParams.get('state'), request.cookies.get(OAUTH_STATE_COOKIE)?.value)) {
    return loginErrorRedirect(request, 'Xavfsizlik tekshiruvi muvaffaqiyatsiz (state). Qayta urinib ko‘ring.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return loginErrorRedirect(request, 'Google OAuth sozlanmagan');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appOrigin(request)}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return loginErrorRedirect(request, tokenData.error_description || 'Token olishda xatolik');
    }

    const userinfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const info = await userinfoRes.json();
    if (!info.sub || !info.email || info.email_verified !== true) {
      return loginErrorRedirect(request, 'Google hisobingiz email manzili tasdiqlanmagan');
    }

    const user = await db.upsertUser({
      provider: 'google',
      providerId: String(info.sub),
      email: info.email,
      name: info.name || info.email.split('@')[0],
      avatarUrl: info.picture,
      role: roleFor({ email: info.email }),
    });

    const response = await completeRedirectLogin(request, user.id);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return loginErrorRedirect(request, 'Google orqali kirishda xatolik yuz berdi');
  }
}
