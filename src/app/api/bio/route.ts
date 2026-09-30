import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { saveBio } from '@/lib/bio/save-bio';
import { limitsFor } from '@/lib/plans';

export async function GET() {
  try {
    const ctx = await requireWorkspace();
    const bioPage = await db.getBioPageByWorkspace(ctx.workspace.id);
    return NextResponse.json({ success: true, bioPage });
  } catch (error) {
    console.error('GET /api/bio failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({
        success: false,
        error: 'Demo rejimida bio sahifani saqlash cheklangan. Bepul versiyadan foydalanish uchun ro‘yxatdan o‘ting.',
        code: 'DEMO_RESTRICTED',
      }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'So‘rov JSON formatida bo‘lishi kerak', code: 'INVALID_JSON' }, { status: 400 });
    }

    const result = await saveBio({ workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin }, body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, code: result.code, ...result.details }, { status: result.status });
    }

    const limit = limitsFor(ctx.workspace, ctx.isAdmin).bioLinks;
    return NextResponse.json({
      success: true,
      bioPage: result.bioPage,
      limitNotice: result.truncated ? `Tarifingizda faqat ${limit} ta tugma saqlandi.` : undefined,
    });
  } catch (error) {
    console.error('POST /api/bio failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
