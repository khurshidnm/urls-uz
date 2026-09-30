import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { createLink } from '@/lib/links/create-link';
import { parseLinkFilter } from '@/lib/links/list-filter';

/**
 * Lists the workspace's links. Filters: q, status (all|active|archived, default all),
 * tag, folder (id or "none"), sort (newest|oldest|clicks), page, limit (max 100).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    const filter = parseLinkFilter(request.nextUrl.searchParams, { status: 'all', limit: 100 });
    const { links, total } = await db.queryLinks(ctx.workspace.id, filter);

    return NextResponse.json({
      success: true,
      links: links.map(toPublicLink),
      total,
      page: filter.page,
      pageSize: filter.limit,
    });
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
