import { NextResponse } from 'next/server';
import { getActor, toClientUser } from '@/lib/auth';

export async function GET() {
  const actor = await getActor();
  return NextResponse.json({
    user: actor.user ? toClientUser(actor.user) : null,
    demoEditMode: actor.isDemo && actor.isAdmin,
  });
}
