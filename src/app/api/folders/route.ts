import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { routeError } from '@/lib/route-error';
import { requireWorkspace } from '@/lib/auth';
import { folderSchema, parseJson } from '@/lib/validation';
import { isUniqueViolation } from '@/lib/pg-errors';

export async function GET() {
  try {
    const ctx = await requireWorkspace({ apiKey: true });
    return NextResponse.json({ success: true, folders: await db.listFolders(ctx.workspace.id) });
  } catch (error) {
    return routeError(error, 'GET /api/folders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace({ apiKey: true });
    if (!ctx.canWrite) {
      return NextResponse.json({ success: false, error: 'Papka yaratish uchun tizimga kiring.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }
    const parsed = await parseJson(request, folderSchema);
    if (!parsed.ok) return parsed.response;

    try {
      const folder = await db.createFolder(ctx.workspace.id, parsed.data.name);
      return NextResponse.json({ success: true, folder }, { status: 201 });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ success: false, error: 'Bu nomdagi papka allaqachon mavjud', code: 'FOLDER_EXISTS' }, { status: 409 });
      }
      throw err;
    }
  } catch (error) {
    return routeError(error, 'POST /api/folders');
  }
}
