import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { pg } from '@/db/client';
import { users } from '@/db/schema';
import { getSuperAdmin } from '@/lib/auth';

/**
 * Turns off a user's two-step login (they lost the phone and the recovery
 * codes). Superadmins only; confirm the person's identity before using it.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSuperAdmin())) return NextResponse.json({ success: false, error: 'Faqat super admin uchun' }, { status: 403 });
  const { id } = await params;
  const updated = await pg
    .update(users)
    .set({ totp_secret: null, totp_pending_secret: null, totp_enabled_at: null, totp_last_step: null, totp_recovery_codes: [] })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (updated.length === 0) return NextResponse.json({ success: false, error: 'Foydalanuvchi topilmadi' }, { status: 404 });
  return NextResponse.json({ success: true });
}
