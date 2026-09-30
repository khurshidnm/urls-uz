import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { getActor } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const actor = await getActor();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const linkId = searchParams.get('link_id');

    if (slug || linkId) {
      const link = linkId
        ? db.getOwnedLink(linkId, actor.ownerId)
        : db.getLinkBySlug(slug!.replace(/^\//, '').trim());

      // Links owned by someone else look exactly like missing links
      if (!link || link.user_id !== actor.ownerId) {
        return NextResponse.json(
          { success: false, error: `"${slug || linkId}" nomli havola topilmadi` },
          { status: 404 }
        );
      }

      const linkAnalytics = db.getLinkAnalytics(link.id)!;
      return NextResponse.json({ success: true, ...linkAnalytics, link: toPublicLink(linkAnalytics.link) });
    }

    const overview = db.getAnalyticsOverview(actor.ownerId);
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    console.error('GET /api/analytics failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
