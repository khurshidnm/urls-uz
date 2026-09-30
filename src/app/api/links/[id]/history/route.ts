import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';

/** A link's change history (newest first). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireWorkspace();
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
    console.error('GET /api/links/[id]/history failed:', error);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
