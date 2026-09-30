import { NextRequest, NextResponse } from 'next/server';
import { DEMO_EDIT_COOKIE, getCurrentUser } from '@/lib/auth';

/** Superadmins can switch the dashboard to edit the shared demo workspace. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== 'superadmin') {
    return NextResponse.json({ success: false, error: 'Faqat super admin ruxsatiga ega.' }, { status: 403 });
  }

  const { active } = await request.json().catch(() => ({ active: false }));
  const response = NextResponse.json({ success: true, active: Boolean(active) });
  if (active) {
    response.cookies.set(DEMO_EDIT_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });
  } else {
    response.cookies.delete(DEMO_EDIT_COOKIE);
  }
  return response;
}
