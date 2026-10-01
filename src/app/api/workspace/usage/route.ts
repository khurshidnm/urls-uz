import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { routeError } from '@/lib/route-error';
import { requireWorkspace } from '@/lib/auth';
import { limitsFor, toJsonLimit } from '@/lib/plans';

/** Plan limits and current usage, so the UI shows real numbers instead of hard-coded ones. */
export async function GET() {
  try {
    const ctx = await requireWorkspace({ apiKey: true });
    const limits = limitsFor(ctx.workspace, ctx.isAdmin);
    const usage = await db.getLinkUsage(ctx.workspace.id);
    return NextResponse.json({
      success: true,
      plan: ctx.workspace.plan,
      usage,
      limits: {
        activeLinks: toJsonLimit(limits.activeLinks),
        deepLinks: toJsonLimit(limits.deepLinks),
        deviceTargeting: toJsonLimit(limits.deviceTargeting),
        bioLinks: toJsonLimit(limits.bioLinks),
      },
    });
  } catch (error) {
    return routeError(error, 'GET /api/workspace/usage');
  }
}
