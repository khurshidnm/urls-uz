import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ success: false, error: 'GOOGLE_CLIENT_ID sozlanmagan' }, { status: 500 });
  }

  const origin = request.nextUrl.origin || 'https://urls.uz';
  const redirectUri = `${origin}/api/auth/google/callback`;
  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, code, email, name, avatar } = body;

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let googleUserId = '';

    // 1. Verify Google ID Token (Google Identity Services / One Tap)
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const tokenInfo = await verifyRes.json();
        if (tokenInfo && tokenInfo.email) {
          userEmail = tokenInfo.email;
          userName = tokenInfo.name || tokenInfo.email.split('@')[0];
          userAvatar = tokenInfo.picture;
          googleUserId = tokenInfo.sub;
        } else {
          return NextResponse.json({ success: false, error: 'Google tokeni yaroqsiz' }, { status: 401 });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: 'Google tokenini tekshirishda xatolik: ' + err.message }, { status: 500 });
      }
    }

    // 2. Exchange Authorization Code if provided
    if (code && clientId && clientSecret) {
      try {
        const origin = request.nextUrl.origin || 'https://urls.uz';
        const redirectUri = `${origin}/api/auth/google/callback`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userInfo = await userinfoRes.json();
          userEmail = userInfo.email;
          userName = userInfo.name;
          userAvatar = userInfo.picture;
          googleUserId = userInfo.sub;
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: 'OAuth almashinuvida xatolik: ' + err.message }, { status: 500 });
      }
    }

    if (!userEmail) {
      userEmail = 'user@gmail.com';
      userName = userName || 'Google Foydalanuvchisi';
    }

    const user = {
      id: googleUserId ? `usr_g_${googleUserId.slice(-8)}` : `usr_g_${Math.random().toString(36).substring(2, 10)}`,
      name: userName || 'Google Foydalanuvchisi',
      email: userEmail,
      provider: 'google',
      plan: 'pro',
      avatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    };

    const token = `session_g_${Date.now()}_${user.id}`;
    const response = NextResponse.json({
      success: true,
      user,
      token,
    });

    response.cookies.set('urls_session', token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set('urls_user_id', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
