import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';

const HANDLE_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'tg:', 'mailto:', 'tel:']);

/** Bio links are opened with window.open on the public page, so only safe schemes are allowed. */
function isSafeLinkUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return SAFE_LINK_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const ctx = await requireWorkspace();
    const bioPage = await db.getBioPageByWorkspace(ctx.workspace.id);
    return NextResponse.json({ success: true, bioPage });
  } catch (error) {
    console.error('GET /api/bio failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({
        success: false,
        error: 'Demo rejimida bio sahifani saqlash cheklangan. Bepul versiyadan foydalanish uchun ro‘yxatdan o‘ting.',
        code: 'DEMO_RESTRICTED',
      }, { status: 403 });
    }

    const body = await request.json();
    const { title, bio, avatar_url, theme, social_links, links } = body;
    const handle = typeof body.handle === 'string' ? body.handle.trim().replace(/^@/, '') : '';

    if (!handle || !title) {
      return NextResponse.json({ success: false, error: 'Handle and title are required' }, { status: 400 });
    }
    if (!HANDLE_PATTERN.test(handle)) {
      return NextResponse.json({ success: false, error: 'Handle 3–30 ta belgi: harf, raqam, nuqta, tire yoki tagchiziq bo‘lishi kerak' }, { status: 400 });
    }

    // Handles are unique across all users
    const handleOwner = await db.getBioPageByHandle(handle);
    if (handleOwner && handleOwner.workspace_id !== ctx.workspace.id) {
      return NextResponse.json({ success: false, error: 'Bu handle band. Boshqasini tanlang.', code: 'HANDLE_TAKEN' }, { status: 409 });
    }

    if (avatar_url && typeof avatar_url === 'string') {
      if (avatar_url.startsWith('data:image/')) {
        // Avatar size verification (strictly <= 100 KB)
        const base64Data = avatar_url.split(',')[1] || '';
        const byteLength = Math.round((base64Data.length * 3) / 4);
        if (byteLength > 105 * 1024) {
          return NextResponse.json(
            { success: false, error: 'Rasm hajmi 100 KB dan oshmasligi kerak' },
            { status: 400 }
          );
        }
      } else if (!avatar_url.startsWith('https://')) {
        return NextResponse.json({ success: false, error: 'Avatar manzili noto‘g‘ri' }, { status: 400 });
      }
    }

    // Free plan allows up to 4 custom links inside bio page
    const BIO_LINKS_LIMIT = 4;
    const requestedLinks = Array.isArray(links) ? links : [];
    if (requestedLinks.some((l) => !isSafeLinkUrl(l?.url))) {
      return NextResponse.json({ success: false, error: 'Havolalar http(s)://, tg:, mailto: yoki tel: bilan boshlanishi kerak' }, { status: 400 });
    }
    const sanitizedLinks = requestedLinks.slice(0, BIO_LINKS_LIMIT);

    const socials: Record<string, string> = {};
    if (social_links && typeof social_links === 'object') {
      for (const [network, value] of Object.entries(social_links)) {
        if (typeof value !== 'string' || !value.trim()) continue;
        // Plain usernames are fine; full URLs must use a safe scheme
        if (value.includes(':') && !isSafeLinkUrl(value)) {
          return NextResponse.json({ success: false, error: `${network} havolasi noto‘g‘ri` }, { status: 400 });
        }
        socials[network] = value.trim();
      }
    }

    // Free plan allowed themes: midnight, emerald, clean-light
    const allowedFreeThemes = ['midnight', 'emerald', 'clean-light'];
    const finalTheme = allowedFreeThemes.includes(theme) ? theme : 'midnight';

    const saved = await db.saveBioPage(ctx.workspace.id, {
      handle,
      title,
      bio: bio || '',
      avatar_url: avatar_url || '',
      theme: finalTheme,
      social_links: socials,
      links: sanitizedLinks,
    });

    return NextResponse.json({ success: true, bioPage: saved, limitNotice: requestedLinks.length > BIO_LINKS_LIMIT ? 'Bepul tarifda faqat 4 ta havola saqlandi.' : undefined });
  } catch (error) {
    console.error('POST /api/bio failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
