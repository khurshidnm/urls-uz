import { NextRequest, NextResponse } from 'next/server';
import { routeError } from '@/lib/route-error';
import { requireWorkspace } from '@/lib/auth';
import { qrRepo } from '@/lib/qr/qr-repo';
import { createQrCode } from '@/lib/qr/save-qr';
import { checkCreationLimit, tooManyRequests } from '@/lib/rate-limit';

export async function GET() {
  try {
    const ctx = await requireWorkspace({ apiKey: true });
    return NextResponse.json({ success: true, qrCodes: await qrRepo.list(ctx.workspace.id) });
  } catch (error) {
    return routeError(error, 'GET /api/qr-codes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace({ apiKey: true });
    if (!ctx.canWrite) {
      return NextResponse.json({ success: false, error: 'QR kodni saqlash uchun tizimga kiring.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }
    const limit = await checkCreationLimit(ctx.user?.id ?? ctx.workspace.id);
    if (!limit.ok) {
      const { body: tooMany, init } = tooManyRequests(limit.retryAfterSec);
      return NextResponse.json(tooMany, init);
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'So‘rov JSON formatida bo‘lishi kerak', code: 'INVALID_JSON' }, { status: 400 });
    }

    const result = await createQrCode({ workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin }, body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, code: result.code, ...result.details }, { status: result.status });
    }
    return NextResponse.json({ success: true, qrCode: await qrRepo.get(result.id, ctx.workspace.id) }, { status: 201 });
  } catch (error) {
    return routeError(error, 'POST /api/qr-codes');
  }
}
