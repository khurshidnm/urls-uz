import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { folderSchema, parseJson } from '@/lib/validation';
import { isUniqueViolation } from '@/lib/pg-errors';

type Params = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ success: false, error: 'Papka topilmadi' }, { status: 404 });
const restricted = () =>
  NextResponse.json({ success: false, error: 'Demo rejimida papkalarni o‘zgartirib bo‘lmaydi.', code: 'DEMO_RESTRICTED' }, { status: 403 });

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) return restricted();
    const parsed = await parseJson(request, folderSchema);
    if (!parsed.ok) return parsed.response;

    const { id } = await params;
    try {
      const folder = await db.renameFolder(id, ctx.workspace.id, parsed.data.name);
      return folder ? NextResponse.json({ success: true, folder }) : notFound();
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ success: false, error: 'Bu nomdagi papka allaqachon mavjud', code: 'FOLDER_EXISTS' }, { status: 409 });
      }
      throw err;
    }
  } catch (error) {
    console.error('PATCH /api/folders/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

/** Deleting a folder keeps its links; they become unfiled. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) return restricted();
    const { id } = await params;
    return (await db.deleteFolder(id, ctx.workspace.id)) ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error('DELETE /api/folders/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
