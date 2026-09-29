import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = request.nextUrl.origin || 'https://urls.uz';

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || 'Kirish bekor qilindi')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(tokenData.error_description || 'Token olishda xatolik')}`);
    }

    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userinfoRes.json();

    const user = {
      id: `usr_g_${userInfo.sub ? userInfo.sub.slice(-8) : Math.random().toString(36).substring(2, 10)}`,
      name: userInfo.name || 'Google Foydalanuvchisi',
      email: userInfo.email,
      avatar: userInfo.picture,
      provider: 'google',
      plan: 'pro',
    };

    const token = `session_g_${Date.now()}_${user.id}`;
    const redirectResponse = NextResponse.redirect(`${origin}/dashboard`);

    redirectResponse.cookies.set('urls_session', token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    redirectResponse.cookies.set('urls_user_id', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return redirectResponse;
  } catch (err: any) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(err.message)}`);
  }
}
