import { sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { DEMO_WORKSPACE_ID } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/plans';
import { rateLimits } from '@/db/schema';
import { lt } from 'drizzle-orm';

const BATCH = 10_000;

/**
 * Deletes raw clicks older than each plan's retention period, in small
 * batches so the table is never locked for long. Daily totals are kept, so
 * charts and totals don't change; only the per-visit log gets shorter.
 * The demo is left alone (reseeding rebuilds it).
 */
export async function pruneRawClicks(): Promise<Record<string, number>> {
  const deleted: Record<string, number> = {};
  for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
    deleted[plan] = 0;
    for (;;) {
      const result = await pg.execute(sql`
        delete from clicks where id in (
          select c.id from clicks c
          join links l on l.id = c.link_id
          join workspaces w on w.id = l.workspace_id
          where w.plan = ${plan}::plan
            and w.id <> ${DEMO_WORKSPACE_ID}
            and c.created_at < now() - make_interval(days => ${limits.rawClickRetentionDays})
          limit ${BATCH}
        )`);
      deleted[plan] += result.rowCount ?? 0;
      if ((result.rowCount ?? 0) < BATCH) break;
    }
  }
  // Finished rate-limit windows (the limiter also cleans up now and then)
  await pg.delete(rateLimits).where(lt(rateLimits.expires_at, new Date()));
  return deleted;
}
