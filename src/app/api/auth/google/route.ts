import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, avatar } = body;

    const userEmail = email || 'user@gmail.com';
    const userName = name || 'Google Foydalanuvchisi';

    const user = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 10),
      name: userName,
      email: userEmail,
      provider: 'google',
      plan: 'pro',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
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
