import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db, type UserRecord } from '@/lib/db';
import { getClientIp, roleFor, setSessionCookie, toClientUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { pickTelegramFields, upsertTelegramUser, verifyTelegramLogin } from '@/lib/telegram-auth';

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

async function loginResponse(user: UserRecord) {
  const response = NextResponse.json({ success: true, user: toClientUser(user) });
  await setSessionCookie(response, user.id);
  return response;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Noto‘g‘ri so‘rov' }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const gatewayConfigured = Boolean(process.env.TELEGRAM_GATEWAY_TOKEN);
  const isProduction = process.env.NODE_ENV === 'production';

  // --- Telegram Login Widget (JS callback variant) ---
  if (body.action === 'verify-widget') {
    const data = pickTelegramFields((body.widgetData as Record<string, unknown>) || {});
    if (!verifyTelegramLogin(data)) {
      return NextResponse.json({ success: false, error: 'Telegram xavfsizlik imzosi noto‘g‘ri' }, { status: 401 });
    }
    return loginResponse(await upsertTelegramUser(data));
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
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!phone || !/^\d{4,8}$/.test(code)) {
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

    const user = await db.upsertUser({
      provider: 'phone',
      providerId: phone,
      phone: `+${phone}`,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : `Foydalanuvchi (${phone.slice(-4)})`,
      role: roleFor({}),
    });
    return loginResponse(user);
  }

  return NextResponse.json({ success: false, error: 'Noto‘g‘ri amal' }, { status: 400 });
}
