import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { disconnectIdentity, listIdentities } from '@/lib/accounts';
import { disconnectIdentitySchema, parseJson } from '@/lib/validation';

const unauthorized = () => NextResponse.json({ success: false, error: 'Avval tizimga kiring' }, { status: 401 });

/** The logged-in account's login methods (Google, Telegram, phone). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const identities = await listIdentities(user.id);
  return NextResponse.json({
    success: true,
    identities: identities.map((i) => ({ provider: i.provider, providerId: i.provider_id, label: i.label, created_at: i.created_at })),
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const parsed = await parseJson(request, disconnectIdentitySchema);
  if (!parsed.ok) return parsed.response;

  const result = await disconnectIdentity(user.id, parsed.data.provider, parsed.data.providerId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: result.code === 'NOT_FOUND' ? 404 : 409 });
  }
  return NextResponse.json({ success: true });
}
