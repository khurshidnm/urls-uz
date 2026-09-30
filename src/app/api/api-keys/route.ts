import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicApiKey } from '@/lib/db';
import { getActor } from '@/lib/auth';

const demoRestricted = () =>
  NextResponse.json(
    { success: false, error: 'API kalitlarni boshqarish uchun tizimga kiring.', code: 'DEMO_RESTRICTED' },
    { status: 403 }
  );

export async function GET() {
  try {
    const actor = await getActor();
    const keys = db.getApiKeys(actor.ownerId).map(toPublicApiKey);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error('GET /api/api-keys failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActor();
    // Keys authenticate as their owner, so they are never issued for the shared demo workspace
    if (!actor.canWrite || actor.isDemo) return demoRestricted();

    const { name } = await request.json();
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Key name is required' }, { status: 400 });
    }

    const newKey = db.createApiKey(actor.ownerId, name.trim().slice(0, 80));
    return NextResponse.json({ success: true, ...newKey }, { status: 201 });
  } catch (error) {
    console.error('POST /api/api-keys failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor.canWrite) return demoRestricted();

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Key id is required' }, { status: 400 });
    }

    if (!db.deleteApiKey(id, actor.ownerId)) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    console.error('DELETE /api/api-keys failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
