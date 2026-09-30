import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { parseJson } from '@/lib/validation';
import { disable, enable, isTwoFactorEnabled, regenerateRecoveryCodes, startSetup } from '@/lib/two-factor/service';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('setup') }),
  z.object({ action: z.literal('enable'), code: z.string().trim().min(6).max(20) }),
  z.object({ action: z.literal('disable'), code: z.string().trim().min(6).max(20) }),
  z.object({ action: z.literal('recovery-codes'), code: z.string().trim().min(6).max(20) }),
]);

const unauthorized = () => NextResponse.json({ success: false, error: 'Avval tizimga kiring' }, { status: 401 });

/** Two-step login status for settings. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return NextResponse.json({
    success: true,
    enabled: isTwoFactorEnabled(user),
    enabledAt: user.totp_enabled_at,
    recoveryCodesLeft: user.totp_recovery_codes.length,
  });
}

/** Setup, enable, disable, new recovery codes. Session only: API keys never reach this. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.action === 'setup') {
    if (isTwoFactorEnabled(user)) {
      return NextResponse.json({ success: false, error: 'Ikki bosqichli himoya allaqachon yoqilgan.', code: 'ALREADY_ENABLED' }, { status: 409 });
    }
    return NextResponse.json({ success: true, ...(await startSetup(user)) });
  }

  const attempts = rateLimit(`2fa-settings:${user.id}`, 5, 10 * 60 * 1000);
  if (!attempts.ok) {
    return NextResponse.json(
      { success: false, error: `Juda ko‘p urinish. ${attempts.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.` },
      { status: 429, headers: { 'Retry-After': String(attempts.retryAfterSec) } }
    );
  }

  const result =
    body.action === 'enable'
      ? await enable(user, body.code)
      : body.action === 'disable'
        ? await disable(user, body.code)
        : await regenerateRecoveryCodes(user, body.code);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: 400 });
  return NextResponse.json({ success: true, recoveryCodes: result.recoveryCodes });
}
