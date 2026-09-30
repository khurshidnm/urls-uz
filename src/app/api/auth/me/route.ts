import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireWorkspace, toClientUser } from '@/lib/auth';

export async function GET() {
  const ctx = await requireWorkspace();
  const workspaces = ctx.user && !ctx.viaApiKey ? await db.listWorkspacesForUser(ctx.user.id) : [];
  return NextResponse.json({
    user: ctx.user ? toClientUser(ctx.user, ctx.workspace) : null,
    workspace: { id: ctx.workspace.id, name: ctx.workspace.name, plan: ctx.workspace.plan, is_demo: ctx.workspace.is_demo, role: ctx.role },
    workspaces: workspaces.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role })),
    demoEditMode: ctx.workspace.is_demo && ctx.isAdmin,
  });
}
