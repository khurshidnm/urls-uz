import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { updateLink } from '@/lib/links/update-link';

const notFound = () => NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireWorkspace();
    if (!await db.getOwnedLink(id, ctx.workspace.id)) return notFound();

    const analytics = (await db.getLinkAnalytics(id))!;
    return NextResponse.json({ success: true, ...analytics, link: toPublicLink(analytics.link) });
  } catch (error) {
    console.error('GET /api/links/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({ success: false, error: 'Demo rejimida havolani o‘zgartirish cheklangan.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'So‘rov JSON formatida bo‘lishi kerak', code: 'INVALID_JSON' }, { status: 400 });
    }

    // Owner, counters and timestamps are server-managed; the service applies the same rules as creation
    const result = await updateLink(
      { workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin },
      id,
      body
    );
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, code: result.code, ...result.details }, { status: result.status });
    }
    const updated = result.link;

    return NextResponse.json({ success: true, link: toPublicLink(updated) });
  } catch (error) {
    console.error('PATCH /api/links/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({ success: false, error: 'Demo rejimida havolani o‘chirish cheklangan.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }

    const { id } = await params;
    if (!await db.deleteLink(id, ctx.workspace.id)) return notFound();

    return NextResponse.json({ success: true, message: 'Link deleted' });
  } catch (error) {
    console.error('DELETE /api/links/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
