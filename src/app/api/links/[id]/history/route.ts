import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { routeError } from '@/lib/route-error';
import { requireWorkspace } from '@/lib/auth';

/** A link's change history (newest first). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireWorkspace({ apiKey: true });
    const { id } = await params;
    if (!(await db.getOwnedLink(id, ctx.workspace.id))) {
      return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });
    }
    const rows = await db.getLinkEvents(id);
    return NextResponse.json({
      success: true,
      events: rows.map(({ event, user }) => ({ ...event, user })),
    });
  } catch (error) {
    return routeError(error, 'GET /api/links/[id]/history');
  }
}
