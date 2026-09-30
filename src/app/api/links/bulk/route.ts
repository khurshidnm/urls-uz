import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';
import { updateLink } from '@/lib/links/update-link';
import { bulkLinksSchema, parseJson } from '@/lib/validation';

/**
 * Bulk actions on up to 100 links. Edits go through the same service as
 * single-link edits (plan limits, history), one link at a time, and the
 * response lists which links succeeded and which didn't.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireWorkspace();
    if (!ctx.canWrite) {
      return NextResponse.json({ success: false, error: 'Demo rejimida havolalarni o‘zgartirib bo‘lmaydi.', code: 'DEMO_RESTRICTED' }, { status: 403 });
    }
    const parsed = await parseJson(request, bulkLinksSchema);
    if (!parsed.ok) return parsed.response;
    const input = parsed.data;
    const ids = [...new Set(input.ids)];

    if (input.action === 'delete') {
      const deleted = await db.deleteLinks(ids, ctx.workspace.id);
      const failed = ids.filter((id) => !deleted.includes(id)).map((id) => ({ id, code: 'NOT_FOUND', error: 'Havola topilmadi' }));
      return NextResponse.json({ success: failed.length === 0, succeeded: deleted, failed });
    }

    const serviceCtx = { workspace: ctx.workspace, userId: ctx.user?.id ?? null, isAdmin: ctx.isAdmin };
    const succeeded: string[] = [];
    const failed: { id: string; code: string; error: string }[] = [];

    for (const id of ids) {
      let changes: Record<string, unknown>;
      if (input.action === 'archive' || input.action === 'unarchive') {
        changes = { is_archived: input.action === 'archive' };
      } else if (input.action === 'move') {
        changes = { folder_id: input.folder_id };
      } else {
        const link = await db.getOwnedLink(id, ctx.workspace.id);
        if (!link) {
          failed.push({ id, code: 'NOT_FOUND', error: 'Havola topilmadi' });
          continue;
        }
        const has = link.tags.some((t) => t.toLowerCase() === input.tag.toLowerCase());
        if (input.action === 'add_tag' ? has : !has) {
          succeeded.push(id);
          continue;
        }
        changes = {
          tags: input.action === 'add_tag' ? [...link.tags, input.tag] : link.tags.filter((t) => t.toLowerCase() !== input.tag.toLowerCase()),
        };
      }

      const result = await updateLink(serviceCtx, id, changes);
      if (result.ok) succeeded.push(id);
      else failed.push({ id, code: result.code, error: result.error });
    }

    return NextResponse.json({ success: failed.length === 0, succeeded, failed });
  } catch (error) {
    console.error('POST /api/links/bulk failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
