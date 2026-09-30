import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/auth';
import { qrRepo } from '@/lib/qr/qr-repo';
import { deleteQrCode, updateQrCode } from '@/lib/qr/save-qr';

type Params = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ success: false, error: 'QR kod topilmadi' }, { status: 404 });
const demoRestricted = () =>
  NextResponse.json({ success: false, error: 'Demo rejimida QR kodlarni o‘zgartirish cheklangan.', code: 'DEMO_RESTRICTED' }, { status: 403 });

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const ctx = await requireWorkspace();
    const qrCode = await qrRepo.get(id, ctx.workspace.id);
    return qrCode ? NextResponse.json({ success: true, qrCode }) : notFound();
  } catch (error) {
    console.error('GET /api/qr-codes/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) return demoRestricted();
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'So‘rov JSON formatida bo‘lishi kerak', code: 'INVALID_JSON' }, { status: 400 });
    }

    const result = await updateQrCode({ workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin }, id, body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, code: result.code, ...result.details }, { status: result.status });
    }
    return NextResponse.json({ success: true, qrCode: await qrRepo.get(id, ctx.workspace.id) });
  } catch (error) {
    console.error('PATCH /api/qr-codes/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) return demoRestricted();
    const { id } = await params;
    const deleted = await deleteQrCode({ workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin }, id);
    return deleted ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error('DELETE /api/qr-codes/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
