import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { createLink } from '@/lib/links/create-link';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();

    let links = await db.getAllLinks(ctx.workspace.id);

    if (q) {
      links = links.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        l.destination_url.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, links: links.map(toPublicLink) });
  } catch (error) {
    console.error('GET /api/links failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Identity comes from the session cookie or an API key, never from the request body
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({
        success: false,
        error: 'Havolani qisqartirish uchun tizimga kiring.',
        code: 'AUTH_REQUIRED',
      }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'So‘rov JSON formatida bo‘lishi kerak', code: 'INVALID_JSON' }, { status: 400 });
    }

    // `source` only labels where the link came from (for analytics); API keys are always "api"
    const source = ctx.viaApiKey ? 'api' : body?.source === 'landing' ? 'landing' : 'dashboard';

    const result = await createLink(
      { workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin },
      body,
      source
    );
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code, ...result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, link: toPublicLink(result.link) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/links failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
