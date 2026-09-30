import { NextResponse } from 'next/server';
import { pg } from '@/db/client';
import { seedDemo } from '@/db/seed-demo';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Faqat super admin ruxsatiga ega.' },
        { status: 403 }
      );
    }

    await seedDemo(pg);
    return NextResponse.json({
      success: true,
      message: 'Demo maʼlumotlari muvaffaqiyatli dastlabki holatga qaytarildi (ApexTech Solutions).',
    });
  } catch (error) {
    console.error('POST /api/demo/reset failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
