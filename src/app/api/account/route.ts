import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { pg } from '@/db/client';
import { users } from '@/db/schema';
import { getSessionUser, toClientUser } from '@/lib/auth';
import { parseJson } from '@/lib/validation';

const schema = z.object({
  name: z.string().trim().min(1, 'Ismingizni kiriting').max(80, 'Ko‘pi bilan 80 ta belgi'),
});

/** The logged-in user's own profile. Session only; email and phone come from login methods. */
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Avval tizimga kiring' }, { status: 401 });
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  const [updated] = await pg.update(users).set({ name: parsed.data.name }).where(eq(users.id, user.id)).returning();
  return NextResponse.json({ success: true, user: toClientUser(updated) });
}
