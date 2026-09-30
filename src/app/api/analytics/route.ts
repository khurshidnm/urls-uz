import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const linkId = searchParams.get('link_id');

    if (slug || linkId) {
      let targetId = linkId;
      if (!targetId && slug) {
        const link = db.getLinkBySlug(slug.replace(/^\//, '').trim());
        if (!link) {
          return NextResponse.json(
            { success: false, error: `"${slug}" nomli havola topilmadi` },
            { status: 404 }
          );
        }
        targetId = link.id;
      }

      const linkAnalytics = db.getLinkAnalytics(targetId!);
      if (!linkAnalytics) {
        return NextResponse.json(
          { success: false, error: 'Havola analitikasi topilmadi' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, ...linkAnalytics });
    }

    const overview = db.getAnalyticsOverview();
    return NextResponse.json({ success: true, ...overview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

