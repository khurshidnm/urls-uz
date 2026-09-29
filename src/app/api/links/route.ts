import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRandomSlug, isValidSlug } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();

    let links = db.getAllLinks();

    if (q) {
      links = links.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.slug.toLowerCase().includes(q) || 
        l.destination_url.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, links });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      destination_url,
      slug: customSlug,
      title,
      password,
      expires_at,
      click_limit,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      ios_url,
      android_url,
      open_in_app,
    } = body;

    if (!destination_url) {
      return NextResponse.json({ success: false, error: 'Destination URL is required' }, { status: 400 });
    }

    // Auto-prepend https:// if missing
    let formattedUrl = destination_url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Determine slug
    let finalSlug = customSlug?.trim();
    if (finalSlug) {
      if (!isValidSlug(finalSlug)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Slug must be 3-50 alphanumeric characters (letters, numbers, hyphens, underscores)' 
        }, { status: 400 });
      }

      // Check collision
      const existing = db.getLinkBySlug(finalSlug);
      if (existing) {
        return NextResponse.json({ success: false, error: 'This custom slug is already taken' }, { status: 409 });
      }
    } else {
      // Generate unique random slug
      let attempts = 0;
      do {
        finalSlug = generateRandomSlug(6);
        attempts++;
      } while (db.getLinkBySlug(finalSlug) && attempts < 10);
    }

    const created = db.createLink({
      title: title?.trim() || finalSlug,
      destination_url: formattedUrl,
      slug: finalSlug,
      password: password?.trim() || null,
      expires_at: expires_at || null,
      click_limit: click_limit ? Number(click_limit) : null,
      utm_source: utm_source?.trim() || null,
      utm_medium: utm_medium?.trim() || null,
      utm_campaign: utm_campaign?.trim() || null,
      utm_term: utm_term?.trim() || null,
      utm_content: utm_content?.trim() || null,
      ios_url: ios_url?.trim() || null,
      android_url: android_url?.trim() || null,
      open_in_app: !!open_in_app,
    });

    return NextResponse.json({ success: true, link: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
