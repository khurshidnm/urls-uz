import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink, type LinkRecord } from '@/lib/db';
import { getActor } from '@/lib/auth';
import { checkUrlSafety } from '@/lib/anti-phishing';
import { isValidSlug } from '@/lib/utils';

/** Fields a user may change through PATCH. Everything else (owner, counters, timestamps) is server-managed. */
const EDITABLE_FIELDS = [
  'title', 'destination_url', 'slug', 'is_active', 'is_archived', 'tags', 'password',
  'expires_at', 'click_limit', 'utm_source', 'utm_medium', 'utm_campaign',
  'ios_url', 'android_url', 'huawei_url', 'desktop_url', 'open_in_app',
] as const;

const notFound = () => NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await getActor();
    if (!db.getOwnedLink(id, actor.ownerId)) return notFound();

    const analytics = db.getLinkAnalytics(id)!;
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
    const actor = await getActor();
    if (!actor.canWrite) {
      return NextResponse.json({ success: false, error: 'Demo rejimida havolani o‘zgartirish cheklangan.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const changes: Partial<LinkRecord> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) (changes as Record<string, unknown>)[field] = body[field];
    }

    if (changes.destination_url !== undefined) {
      const safety = checkUrlSafety(String(changes.destination_url));
      if (!safety.isSafe) {
        return NextResponse.json({ success: false, error: safety.reason, code: 'PHISHING_SUSPECTED' }, { status: 400 });
      }
    }

    if (changes.slug !== undefined) {
      if (!isValidSlug(String(changes.slug))) {
        return NextResponse.json({ success: false, error: 'Yaroqsiz slug formati.', code: 'INVALID_SLUG' }, { status: 400 });
      }
      const existing = db.getLinkBySlug(String(changes.slug));
      if (existing && existing.id !== id) {
        return NextResponse.json({ success: false, error: 'Ushbu slug allaqachon band qilingan.', code: 'SLUG_TAKEN' }, { status: 409 });
      }
    }

    const updated = db.updateLink(id, actor.ownerId, changes);
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
    const actor = await getActor();
    if (!actor.canWrite) {
      return NextResponse.json({ success: false, error: 'Demo rejimida havolani o‘chirish cheklangan.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }

    const { id } = await params;
    if (!db.deleteLink(id, actor.ownerId)) return notFound();

    return NextResponse.json({ success: true, message: 'Link deleted' });
  } catch (error) {
    console.error('DELETE /api/links/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
