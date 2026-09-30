import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicLink } from '@/lib/db';
import { generateRandomSlug, isValidSlug, isReservedSlug } from '@/lib/utils';
import { checkUrlSafety } from '@/lib/anti-phishing';
import { requireWorkspace } from '@/lib/auth';
import { createLinkSchema, parseJson } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();

    let links = await db.getAllLinks(ctx.workspace.id);

    if (q) {
      links = links.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        l.destination_url.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, links: links.map(toPublicLink) });
  } catch (error) {
    console.error('GET /api/links failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Identity comes from the session cookie or an API key, never from the request body
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({
        success: false,
        error: 'Havolani qisqartirish uchun tizimga kiring.',
        code: 'AUTH_REQUIRED',
      }, { status: 401 });
    }

    const parsed = await parseJson(request, createLinkSchema);
    if (!parsed.ok) return parsed.response;
    const input = parsed.data;
    const { ios_url, android_url, huawei_url, desktop_url } = input;

    const isSuperAdmin = ctx.isAdmin;

    // 2. Free Plan Limits Check (bypassed for super admins)
    const userLinks = await db.getAllLinks(ctx.workspace.id);
    const activeLinks = userLinks.filter((l) => !l.is_archived);
    const activeCount = activeLinks.length;
    const FREE_PLAN_LIMIT = 10;

    if (!isSuperAdmin && activeCount >= FREE_PLAN_LIMIT) {
      return NextResponse.json({
        success: false,
        error: `Bepul tarifda ko‘pi bilan ${FREE_PLAN_LIMIT} ta faol havola yaratish mumkin (${activeCount}/${FREE_PLAN_LIMIT}). Yangi havola yaratish uchun eskilarini arxivlang yoki o‘chiring. Cheksiz havolalar va kengaytirilgan imkoniyatlar Pro tarifda tez kunda ishga tushadi!`,
        code: 'FREE_LIMIT_REACHED',
        limit: FREE_PLAN_LIMIT,
        currentCount: activeCount,
      }, { status: 403 });
    }

    // Smart Deep Link quota (max 1 in free plan, bypassed for super admin)
    const isDeepLinkRequested = Boolean(input.open_in_app);
    const currentDeepLinksCount = activeLinks.filter((l) => Boolean(l.open_in_app)).length;
    if (!isSuperAdmin && isDeepLinkRequested && currentDeepLinksCount >= 1) {
      return NextResponse.json({
        success: false,
        error: `Bepul tarifda faqat 1 dona Smart Deep Link yaratish mumkin (${currentDeepLinksCount}/1 ishlatilgan). Yangi deep link yaratish uchun mavjud deep linkni o‘chiring yoki oddiy havola sifatida yarating. Cheksiz deep linklar Pro tarifda tez kunda ishga tushadi!`,
        code: 'DEEP_LINK_LIMIT_REACHED',
        currentCount: currentDeepLinksCount,
        maxLimit: 1,
      }, { status: 403 });
    }

    // Device Targeting quota (max 1 in free plan with 100 clicks cap)
    const isDeviceTargetingRequested = Boolean(ios_url || android_url || huawei_url || desktop_url);
    const currentDeviceTargetingCount = activeLinks.filter((l) => Boolean(l.ios_url || l.android_url || l.huawei_url || l.desktop_url)).length;
    if (isDeviceTargetingRequested && currentDeviceTargetingCount >= 1) {
      return NextResponse.json({
        success: false,
        error: `Bepul tarifda faqat 1 dona qurilmalarni aniqlaydigan (device targeting) havola yaratish mumkin (${currentDeviceTargetingCount}/1 ishlatilgan). Cheksiz qurilmalar bo‘yicha yo‘naltirish Pro tarifda tez kunda ishga tushadi!`,
        code: 'DEVICE_TARGETING_LIMIT_REACHED',
        currentCount: currentDeviceTargetingCount,
        maxLimit: 1,
      }, { status: 403 });
    }

    // Anti-Phishing Safety Filter (the schema already normalized the URL to http(s))
    const safetyCheck = checkUrlSafety(input.destination_url);
    if (!safetyCheck.isSafe) {
      return NextResponse.json({
        success: false,
        error: safetyCheck.reason || 'Fishing xavfi: Ushbu havola xavfsizlik filtri tomonidan bloklandi.',
        code: 'PHISHING_SUSPECTED',
      }, { status: 400 });
    }

    // Validate custom slug if provided, otherwise generate 5-character random ID
    const requestedSlug = input.slug || input.custom_slug;
    let finalSlug = '';

    if (requestedSlug) {
      if (!isValidSlug(requestedSlug)) {
        return NextResponse.json({
          success: false,
          error: isReservedSlug(requestedSlug)
            ? 'Ushbu nom tizim tomonidan band qilingan (Reserved system path). Boshqa nom tanlang.'
            : 'Yaroqsiz slug formati. Kamida 3 ta belgi (harf, raqam, tire) bo‘lishi lozim.',
          code: isReservedSlug(requestedSlug) ? 'RESERVED_SLUG' : 'INVALID_SLUG',
        }, { status: 400 });
      }

      // Check slug collision
      if (await db.isSlugTaken(requestedSlug)) {
        return NextResponse.json({
          success: false,
          error: 'Ushbu qisqa havola (slug) allaqachon band qilingan. Boshqa nom tanlang.',
          code: 'SLUG_TAKEN',
        }, { status: 409 });
      }

      finalSlug = requestedSlug;
    } else {
      let attempts = 0;
      do {
        finalSlug = generateRandomSlug(attempts > 8 ? 6 : 5);
        attempts++;
      } while ((isReservedSlug(finalSlug) || (await db.isSlugTaken(finalSlug))) && attempts < 20);
    }

    // Device targeting limit in free tier is capped to 100 clicks
    let effectiveClickLimit = input.click_limit ?? null;
    if (isDeviceTargetingRequested) {
      effectiveClickLimit = effectiveClickLimit ? Math.min(effectiveClickLimit, 100) : 100;
    }

    const created = await db.createLink({
      workspaceId: ctx.workspace.id,
      createdBy: ctx.user?.id ?? null,
      title: input.title || finalSlug,
      destination_url: input.destination_url,
      slug: finalSlug,
      password: input.password ?? null,
      expires_at: input.expires_at ?? null,
      click_limit: effectiveClickLimit,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      utm_term: input.utm_term ?? null,
      utm_content: input.utm_content ?? null,
      ios_url: ios_url ?? null,
      android_url: android_url ?? null,
      huawei_url: huawei_url ?? null,
      desktop_url: desktop_url ?? null,
      open_in_app: Boolean(input.open_in_app),
      tags: input.tags ?? '',
    });

    return NextResponse.json({ success: true, link: toPublicLink(created) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/links failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
