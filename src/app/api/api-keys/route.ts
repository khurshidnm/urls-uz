import { NextRequest, NextResponse } from 'next/server';
import { db, toPublicApiKey } from '@/lib/db';
import { routeError } from '@/lib/route-error';
import { requireWorkspace } from '@/lib/auth';
import { limitsFor } from '@/lib/plans';
import { createApiKeySchema, parseJson } from '@/lib/validation';

const demoRestricted = () =>
  NextResponse.json(
    { success: false, error: 'API kalitlarni boshqarish uchun tizimga kiring.', code: 'DEMO_RESTRICTED' },
    { status: 403 }
  );

export async function GET() {
  try {
    const ctx = await requireWorkspace();
    const keys = (await db.getApiKeys(ctx.workspace.id)).map(toPublicApiKey);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    return routeError(error, 'GET /api/api-keys');
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    // Keys authenticate as their owner, so they are never issued for the shared demo workspace
    if (!ctx.canWrite || ctx.workspace.is_demo || !ctx.user) return demoRestricted();
    if (!limitsFor(ctx.workspace, ctx.isAdmin).apiAccess) {
      return NextResponse.json(
        { success: false, error: 'REST API kalitlari faqat Pro va Biznes tariflarida mavjud.', code: 'PLAN_REQUIRED' },
        { status: 403 }
      );
    }

    const parsed = await parseJson(request, createApiKeySchema);
    if (!parsed.ok) return parsed.response;

    const newKey = await db.createApiKey(ctx.workspace.id, ctx.user.id, parsed.data.name);
    return NextResponse.json({ success: true, ...newKey }, { status: 201 });
  } catch (error) {
    return routeError(error, 'POST /api/api-keys');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) return demoRestricted();

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Key id is required' }, { status: 400 });
    }

    if (!await db.deleteApiKey(id, ctx.workspace.id)) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    return routeError(error, 'DELETE /api/api-keys');
  }
}
