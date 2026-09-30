import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidSlug, isReservedSlug } from '@/lib/utils';
import { getSessionUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Only for logged-in users picking a slug; otherwise it's a free way to list taken slugs
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ available: false, reason: 'auth', message: 'Tizimga kiring' }, { status: 401 });
    const limit = await rateLimit(`check-slug:${user.id}`, 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json({ available: false, reason: 'rate_limited', message: 'Juda ko‘p so‘rov, biroz kuting' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    // Slugs are case-sensitive, so check exactly what will be saved
    const slug = searchParams.get('slug')?.trim();

    if (!slug) {
      return NextResponse.json(
        { available: false, reason: 'empty', message: 'Slug kiritilmadi' },
        { status: 400 }
      );
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json({
        available: false,
        reason: 'reserved',
        message: 'Ushbu slug tizim marshruti sifatida band qilingan',
      });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json({
        available: false,
        reason: 'invalid',
        message: 'Slug 3–50 ta belgi (faqat harf, raqam, tire yoki tagchiziq) bo‘lishi lozim',
      });
    }

    if (await db.isSlugTaken(slug)) {
      return NextResponse.json({
        available: false,
        reason: 'taken',
        message: 'Bu slug allaqachon boshqa havola uchun band qilingan',
      });
    }

    return NextResponse.json({
      available: true,
      reason: 'available',
      message: 'Slug mavjud va foydalanish mumkin',
    });
  } catch (error) {
    return NextResponse.json(
      { available: false, reason: 'error', message: 'Tekshirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
