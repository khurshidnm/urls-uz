import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const bioPage = await db.getBioPageByHandle(handle);

    if (!bioPage) {
      return NextResponse.json({ success: false, error: 'Bio page not found' }, { status: 404 });
    }

    // Increment view count
    await db.recordBioPageView(bioPage.id);

    return NextResponse.json({ success: true, bioPage });
  } catch (error) {
    console.error('GET /api/bio/[handle] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
