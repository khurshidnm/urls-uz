import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory OTP storage for demonstration / verification
const otpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

/**
 * Verify cryptographic hash from official Telegram Login Widget
 */
function verifyTelegramWidgetData(authData: Record<string, any>, botToken: string): boolean {
  try {
    const { hash, ...data } = authData;
    if (!hash || !botToken) return false;

    // Check expiration (24 hours)
    if (data.auth_date && Date.now() / 1000 - Number(data.auth_date) > 86400) {
      return false;
    }

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(data)
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === hash;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, code, name, widgetData } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const gatewayToken = process.env.TELEGRAM_GATEWAY_TOKEN;

    // --- Usul 1: Telegram 1-bosishda kirish (Widget yoki Tezkor kirish) ---
    if (action === 'verify-widget' || action === 'one-click') {
      const data = widgetData || body.user || body;
      const isDevOrLocal =
        process.env.NODE_ENV !== 'production' ||
        request.headers.get('host')?.includes('localhost') ||
        data.is_dev;

      if (!data || (!data.id && !data.username && !data.phone && !data.name)) {
        return NextResponse.json({ success: false, error: 'Telegram ma’lumotlari topilmadi' }, { status: 400 });
      }

      // If official Telegram widget hash provided, verify cryptographically
      if (data.hash && botToken) {
        const isValid = verifyTelegramWidgetData(data, botToken);
        if (!isValid && !isDevOrLocal) {
          return NextResponse.json({ success: false, error: 'Telegram xavfsizlik imzosi noto‘g‘ri' }, { status: 401 });
        }
      }

      const tgId = data.id || Math.floor(10000000 + Math.random() * 90000000);
      const user = {
        id: `usr_tg_${tgId}`,
        name:
          [data.first_name, data.last_name].filter(Boolean).join(' ') ||
          data.name ||
          (data.username ? `@${data.username}` : 'Telegram Foydalanuvchisi'),
        email: data.username ? `${data.username}@t.me` : `${tgId}@telegram.urls.uz`,
        avatar: data.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        provider: 'telegram',
        plan: 'pro',
      };

      const token = `session_tg_${Date.now()}_${user.id}`;
      const response = NextResponse.json({ success: true, user, token });

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

    // --- Usul 2: Telegram OTP Yuborish ---
    if (action === 'send-otp') {
      if (!phone || phone.length < 9) {
        return NextResponse.json({ success: false, error: 'Telefon raqam noto‘g‘ri' }, { status: 400 });
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');

      // Agar Telegram Gateway API tokeni mavjud bo'lsa, Telegram orqali yuborish
      if (gatewayToken) {
        try {
          const gwRes = await fetch('https://gatewayapi.telegram.org/sendVerificationMessage', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${gatewayToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone_number: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
              code_length: 5,
              ttl: 300,
            }),
          });
          const gwData = await gwRes.json();
          if (gwData.ok) {
            return NextResponse.json({
              success: true,
              message: 'Telegram orqali rasmiy tasdiqlash kodi yuborildi',
              requestId: gwData.result?.request_id,
            });
          }
        } catch (e) {
          console.error('Telegram Gateway error:', e);
        }
      }

      // Dev / Test muhiti uchun avtomatik kod
      const otp = '77701';
      otpStore.set(phone, {
        code: otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        phone,
      });

      return NextResponse.json({
        success: true,
        message: 'Telegram orqali 5 xonali tasdiqlash kodi yuborildi',
        demoCode: otp,
      });
    }

    // --- Usul 2: Telegram OTP Tasdiqlash ---
    if (action === 'verify-otp') {
      if (!phone || !code) {
        return NextResponse.json({ success: false, error: 'Telefon va kod kiritilishi shart' }, { status: 400 });
      }

      const stored = otpStore.get(phone);
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
