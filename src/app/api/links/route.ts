import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRandomSlug, isValidSlug } from '@/lib/utils';
import { checkUrlSafety } from '@/lib/anti-phishing';

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
      user_id: bodyUserId,
    } = body;

    // 1. Mandatory Authorization Check (Anti-Phishing / Identity enforcement)
    const authHeader = request.headers.get('authorization') || '';
    const headerUserId = request.headers.get('x-user-id');
    const cookieSession = request.cookies.get('urls_session')?.value;
    const cookieUserId = request.cookies.get('urls_user_id')?.value;

    let authenticatedUserId: string | null = null;

    // Check API Key
    if (authHeader.startsWith('Bearer urls_live_')) {
      const apiKey = authHeader.replace(/^Bearer\s+/, '').trim();
      const isValidKey = db.verifyApiKey(apiKey);
      if (!isValidKey) {
        return NextResponse.json({
          success: false,
          error: 'Yaroqsiz API kalit (Invalid API Key)',
          code: 'INVALID_API_KEY',
        }, { status: 401 });
      }
      authenticatedUserId = 'api_user';
    } else if (authHeader.startsWith('Bearer session_') || authHeader.startsWith('Bearer usr_')) {
      authenticatedUserId = headerUserId || cookieUserId || bodyUserId || 'verified_user';
    } else if (cookieSession || headerUserId || cookieUserId || bodyUserId) {
      authenticatedUserId = headerUserId || cookieUserId || bodyUserId || 'verified_user';
    }

    // Reject anonymous creations to stop phishing abuses
    if (!authenticatedUserId) {
      return NextResponse.json({
        success: false,
        error: 'Havola yaratish uchun Telegram OTP yoki Google orqali tizimga kiring. Fishingdan himoyalanish maqsadida anonim havolalar cheklangan.',
        code: 'AUTH_REQUIRED',
      }, { status: 401 });
    }

    if (!destination_url) {
      return NextResponse.json({ success: false, error: 'Destination URL is required' }, { status: 400 });
    }

    // Auto-prepend https:// if missing
    let formattedUrl = destination_url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // 2. Anti-Phishing Safety Filter
    const safetyCheck = checkUrlSafety(formattedUrl);
    if (!safetyCheck.isSafe) {
      return NextResponse.json({
        success: false,
        error: safetyCheck.reason || 'Fishing xavfi: Ushbu havola xavfsizlik filtri tomonidan bloklandi.',
        code: 'PHISHING_SUSPECTED',
      }, { status: 400 });
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
      userId: authenticatedUserId,
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
