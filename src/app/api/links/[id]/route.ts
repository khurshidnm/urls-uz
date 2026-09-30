import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { checkUrlSafety } from '@/lib/anti-phishing';
import { isValidSlug } from '@/lib/utils';
import { parseJson, updateLinkSchema } from '@/lib/validation';

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
    // The schema only lets through fields a user may change; owner, counters and timestamps are server-managed
    const parsed = await parseJson(request, updateLinkSchema);
    if (!parsed.ok) return parsed.response;
    const changes = parsed.data;

    if (changes.destination_url !== undefined) {
      const safety = checkUrlSafety(changes.destination_url);
      if (!safety.isSafe) {
        return NextResponse.json({ success: false, error: safety.reason, code: 'PHISHING_SUSPECTED' }, { status: 400 });
      }
    }

    if (changes.slug !== undefined) {
      if (!isValidSlug(changes.slug)) {
        return NextResponse.json({ success: false, error: 'Yaroqsiz slug formati.', code: 'INVALID_SLUG' }, { status: 400 });
      }
      const current = await db.getOwnedLink(id, ctx.workspace.id);
      if (current?.slug !== changes.slug && (await db.isSlugTaken(changes.slug))) {
        return NextResponse.json({ success: false, error: 'Ushbu slug allaqachon band qilingan.', code: 'SLUG_TAKEN' }, { status: 409 });
      }
    }

    if (changes.folder_id && !(await db.getFolder(changes.folder_id, ctx.workspace.id))) {
      return NextResponse.json({ success: false, error: 'Papka topilmadi', code: 'FOLDER_NOT_FOUND' }, { status: 400 });
    }

    const updated = await db.updateLink(id, ctx.workspace.id, changes, ctx.user?.id ?? null);
    if (!updated) return notFound();

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
