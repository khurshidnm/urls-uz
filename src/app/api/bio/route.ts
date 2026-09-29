import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const bioPage = db.getBioPageByUserId('demo_user');
    return NextResponse.json({ success: true, bioPage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, title, bio, avatar_url, theme, social_links, links } = body;

    if (!handle || !title) {
      return NextResponse.json({ success: false, error: 'Handle and title are required' }, { status: 400 });
    }

    const saved = db.saveBioPage('demo_user', {
      handle,
      title,
      bio: bio || '',
      avatar_url: avatar_url || '',
      theme: theme || 'midnight',
      social_links: social_links || {},
      links: links || [],
    });

    return NextResponse.json({ success: true, bioPage: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
