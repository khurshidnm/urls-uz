import { NextRequest, NextResponse } from 'next/server';

// In-memory OTP storage for demonstration / verification
const otpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, code, name } = body;

    if (action === 'send-otp') {
      if (!phone || phone.length < 9) {
        return NextResponse.json({ success: false, error: 'Telefon raqam noto‘g‘ri' }, { status: 400 });
      }

      // Generate 5-digit OTP code (demo code '12345' or random)
      const otp = '77701';
      otpStore.set(phone, {
        code: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        phone,
      });

      return NextResponse.json({
        success: true,
        message: 'Telegram / SMS orqali 5 xonali tasdiqlash kodi yuborildi',
        demoCode: otp, // Shown in demo environment
      });
    }

    if (action === 'verify-otp') {
      if (!phone || !code) {
        return NextResponse.json({ success: false, error: 'Telefon va kod kiritilishi shart' }, { status: 400 });
      }

      const stored = otpStore.get(phone);
      // Accept matching code or universal verification code '12345' or '77701'
      const isValid = (stored && stored.code === code) || code === '12345' || code === '77701';

      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Kiritilgan tasdiqlash kodi noto‘g‘ri' }, { status: 401 });
      }

      const user = {
        id: 'usr_tg_' + phone.replace(/[^0-9]/g, '').slice(-8),
        name: name || `Foydalanuvchi (${phone.slice(-4)})`,
        email: `${phone.replace(/[^0-9]/g, '')}@telegram.urls.uz`,
        phone,
        provider: 'telegram',
        plan: 'pro',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      };

      otpStore.delete(phone);

      const token = `session_tg_${Date.now()}_${user.id}`;
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
    }

    return NextResponse.json({ success: false, error: 'Noto‘g‘ri amal' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
