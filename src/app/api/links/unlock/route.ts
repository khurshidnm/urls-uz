import { NextRequest, NextResponse } from 'next/server';
import { db, verifyLinkPassword } from '@/lib/db';
import { getClientIp } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { UNLOCK_MAX_AGE, unlockCookieName, unlockToken } from '@/lib/link-unlock';

export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json();
    if (typeof slug !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Noto‘g‘ri so‘rov' }, { status: 400 });
    }

    const limit = rateLimit(`unlock:${getClientIp(request.headers)}:${slug}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: `Juda ko‘p urinish. ${limit.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

    const link = await db.getLinkBySlug(slug);
    if (!link || !link.password) {
      return NextResponse.json({ success: false, error: 'Havola topilmadi' }, { status: 404 });
    }

    if (!verifyLinkPassword(password, link.password)) {
      return NextResponse.json({ success: false, error: 'Kiritilgan parol noto‘g‘ri' }, { status: 401 });
    }

    // The client reloads /{slug}; the page sees this cookie and runs the normal redirect
    const response = NextResponse.json({ success: true });
    response.cookies.set(unlockCookieName(link), unlockToken(link), {
      path: `/${link.slug}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: UNLOCK_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('POST /api/links/unlock failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
