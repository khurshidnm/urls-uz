import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { pg } from '@/db/client';
import { payments, workspaces } from '@/db/schema';
import { newId } from '@/lib/db';

/**
 * Paid plans, recorded by an admin until Payme / Click are connected: each
 * grant is a payment row plus a new end date on the workspace. Renewing the
 * same plan extends from the current end date, so paid days aren't lost.
 */

export const grantPlanSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  months: z.coerce.number().int().min(1, 'Kamida 1 oy').max(36, 'Ko‘pi bilan 36 oy'),
  /** So‘m; 0 for a free trial or a gift. */
  amount: z.coerce.number().int().min(0, 'Summa manfiy bo‘lmaydi').max(1_000_000_000),
  method: z.enum(['manual', 'payme', 'click', 'uzum']).default('manual'),
  note: z.string().trim().max(500).optional(),
});

export type GrantPlanInput = z.output<typeof grantPlanSchema>;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function grantPlan(workspaceId: string, input: GrantPlanInput, adminId: string) {
  return pg.transaction(async (tx) => {
    const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).for('update');
    if (!workspace || workspace.is_demo) return null;

    const now = new Date();
    const running = workspace.plan === input.plan && workspace.plan_expires_at && workspace.plan_expires_at > now;
    const periodStart = running ? workspace.plan_expires_at! : now;
    const periodEnd = addMonths(periodStart, input.months);

    const [payment] = await tx
      .insert(payments)
      .values({
        id: newId('pay'),
        workspace_id: workspaceId,
        plan: input.plan,
        amount: input.amount,
        method: input.method,
        period_start: periodStart,
        period_end: periodEnd,
        note: input.note || null,
        recorded_by: adminId,
      })
      .returning();
    await tx.update(workspaces).set({ plan: input.plan, plan_expires_at: periodEnd }).where(eq(workspaces.id, workspaceId));
    return payment;
  });
}

/** Ends a paid plan now (refund, mistake). Recorded payments stay as history. */
export async function endPlan(workspaceId: string): Promise<boolean> {
  const updated = await pg
    .update(workspaces)
    .set({ plan: 'free', plan_expires_at: null })
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.is_demo, false)))
    .returning({ id: workspaces.id });
  return updated.length > 0;
}
