import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const linkId = searchParams.get('link_id');

    if (slug || linkId) {
      const link = linkId
        ? await db.getOwnedLink(linkId, ctx.workspace.id)
        : await db.getLinkBySlug(slug!.replace(/^\//, '').trim());

      // Links owned by someone else look exactly like missing links
      if (!link || link.workspace_id !== ctx.workspace.id) {
        return NextResponse.json(
          { success: false, error: `"${slug || linkId}" nomli havola topilmadi` },
          { status: 404 }
        );
      }

      const linkAnalytics = (await db.getLinkAnalytics(link.id))!;
      return NextResponse.json({ success: true, ...linkAnalytics, link: toPublicLink(linkAnalytics.link) });
    }

    const overview = await db.getAnalyticsOverview(ctx.workspace.id);
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    console.error('GET /api/analytics failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
