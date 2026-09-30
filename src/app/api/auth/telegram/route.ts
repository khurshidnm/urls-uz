import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, getSessionUser, setSessionCookie, toClientUser } from '@/lib/auth';
import { signIn, type LoginProfile } from '@/lib/accounts';
import { isTwoFactorEnabled } from '@/lib/two-factor/service';
import { setChallengeCookie, TWO_FACTOR_PATH } from '@/lib/two-factor/challenge';
import { rateLimit } from '@/lib/rate-limit';
import { pickTelegramFields, telegramProfile, verifyTelegramLogin } from '@/lib/telegram-auth';
import { parseJson, telegramAuthSchema } from '@/lib/validation';

const GATEWAY_URL = 'https://gatewayapi.telegram.org';
const OTP_TTL_MS = 5 * 60 * 1000;

/**
 * Pending phone verifications, keyed by normalized phone number.
 * With Telegram Gateway configured we keep its request_id; in local
 * development (no gateway) we keep a random code instead.
 * In-memory: fine for a single server process.
 */
const pendingOtps = new Map<string, { requestId?: string; devCode?: string; expiresAt: number }>();

function normalizePhone(phone: unknown): string | null {
  if (typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

function tooMany(retryAfterSec: number) {
  return NextResponse.json(
    { success: false, error: `Juda ko‘p urinish. ${retryAfterSec} soniyadan keyin qayta urinib ko‘ring.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  );
}

async function callGateway(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Logs in with a verified login method, or with `connect` adds it to the
 * logged-in account (settings). Connecting keeps the current session.
 */
async function loginResponse(profile: LoginProfile, connect: boolean | undefined) {
  const current = connect ? await getSessionUser() : null;
  if (connect && !current) {
    return NextResponse.json({ success: false, error: 'Avval tizimga kiring' }, { status: 401 });
  }
  const result = await signIn(profile, { connectTo: current?.id });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: 409 });
  }
  // Two-step login: no session yet, the code page finishes the login
  if (!current && isTwoFactorEnabled(result.user)) {
    const response = NextResponse.json({ success: true, twoFactorRequired: true, redirect: TWO_FACTOR_PATH });
    setChallengeCookie(response, result.user.id);
    return response;
  }
  const response = NextResponse.json({ success: true, user: toClientUser(result.user), outcome: result.outcome });
  if (!current) await setSessionCookie(response, result.user.id);
  return response;
}

export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, telegramAuthSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const ip = getClientIp(request.headers);
  const gatewayConfigured = Boolean(process.env.TELEGRAM_GATEWAY_TOKEN);
  const isProduction = process.env.NODE_ENV === 'production';

  // --- Telegram Login Widget (JS callback variant) ---
  if (body.action === 'verify-widget') {
    const data = pickTelegramFields(body.widgetData);
    if (!verifyTelegramLogin(data)) {
      return NextResponse.json({ success: false, error: 'Telegram xavfsizlik imzosi noto‘g‘ri' }, { status: 401 });
    }
    return loginResponse(telegramProfile(data), body.connect);
  }

  // --- Phone OTP: send code ---
  if (body.action === 'send-otp') {
    const phone = normalizePhone(body.phone);
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Telefon raqam noto‘g‘ri' }, { status: 400 });
    }

    const perPhone = rateLimit(`otp-send:${phone}`, 3, 10 * 60 * 1000);
    if (!perPhone.ok) return tooMany(perPhone.retryAfterSec);
    const perIp = rateLimit(`otp-send-ip:${ip}`, 10, 60 * 60 * 1000);
    if (!perIp.ok) return tooMany(perIp.retryAfterSec);

    if (gatewayConfigured) {
      try {
        const gw = await callGateway('sendVerificationMessage', {
          phone_number: `+${phone}`,
          code_length: 5,
          ttl: OTP_TTL_MS / 1000,
        });
        if (!gw.ok || !gw.result?.request_id) {
          console.error('Telegram Gateway send failed:', gw);
          return NextResponse.json({ success: false, error: 'Kod yuborib bo‘lmadi. Raqamda Telegram mavjudligini tekshiring.' }, { status: 502 });
        }
        pendingOtps.set(phone, { requestId: gw.result.request_id, expiresAt: Date.now() + OTP_TTL_MS });
        return NextResponse.json({ success: true, message: 'Telegram orqali tasdiqlash kodi yuborildi' });
      } catch (e) {
        console.error('Telegram Gateway error:', e);
        return NextResponse.json({ success: false, error: 'Telegram Gateway bilan bog‘lanib bo‘lmadi' }, { status: 502 });
      }
    }

    // Without a gateway there is no way to deliver a code, so phone login is
    // unavailable in production. Locally, return a random code for testing.
    if (isProduction) {
      return NextResponse.json({ success: false, error: 'Telefon orqali kirish hozircha mavjud emas' }, { status: 503 });
    }
    const devCode = crypto.randomInt(10000, 100000).toString();
    pendingOtps.set(phone, { devCode, expiresAt: Date.now() + OTP_TTL_MS });
    return NextResponse.json({ success: true, message: 'Dev rejimi: kod quyida ko‘rsatilgan', demoCode: devCode });
  }

  // --- Phone OTP: verify code ---
  if (body.action === 'verify-otp') {
    const phone = normalizePhone(body.phone);
    const code = body.code;
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Telefon va kod kiritilishi shart' }, { status: 400 });
    }

    const attempts = rateLimit(`otp-verify:${phone}`, 5, 10 * 60 * 1000);
    if (!attempts.ok) return tooMany(attempts.retryAfterSec);

    const pending = pendingOtps.get(phone);
    if (!pending || pending.expiresAt < Date.now()) {
      pendingOtps.delete(phone);
      return NextResponse.json({ success: false, error: 'Kod muddati tugagan. Yangi kod so‘rang.' }, { status: 401 });
    }

    let valid = false;
    if (pending.requestId) {
      try {
        const gw = await callGateway('checkVerificationStatus', { request_id: pending.requestId, code });
        valid = gw.ok && gw.result?.verification_status?.status === 'code_valid';
      } catch (e) {
        console.error('Telegram Gateway verify error:', e);
        return NextResponse.json({ success: false, error: 'Telegram Gateway bilan bog‘lanib bo‘lmadi' }, { status: 502 });
      }
    } else if (pending.devCode) {
      valid = pending.devCode.length === code.length && crypto.timingSafeEqual(Buffer.from(pending.devCode), Buffer.from(code));
    }

    if (!valid) {
      return NextResponse.json({ success: false, error: 'Kiritilgan tasdiqlash kodi noto‘g‘ri' }, { status: 401 });
    }
    pendingOtps.delete(phone);

    return loginResponse(
      {
        provider: 'phone',
        providerId: phone,
        phone: `+${phone}`,
        name: body.name || `Foydalanuvchi (${phone.slice(-4)})`,
        label: `+${phone}`,
      },
      body.connect
    );
  }

  return NextResponse.json({ success: false, error: 'Noto‘g‘ri amal' }, { status: 400 });
}
