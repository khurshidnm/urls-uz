import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json();
    const link = db.getLinkBySlug(slug);

    if (!link) {
      return NextResponse.json({ success: false, error: 'Havola topilmadi' }, { status: 404 });
    }

    if (link.password !== password) {
      return NextResponse.json({ success: false, error: 'Kiritilgan parol noto‘g‘ri' }, { status: 401 });
    }

    return NextResponse.json({ success: true, targetUrl: link.destination_url });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
