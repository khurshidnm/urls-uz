import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidSlug, isReservedSlug } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug')?.trim().toLowerCase();

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

    const existing = await db.getLinkBySlug(slug);
    if (existing) {
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
