import { sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { db, type LinkRecord, type WorkspaceRecord } from '@/lib/db';
import { limitsFor } from '@/lib/plans';
import { isValidSlug } from '@/lib/utils';
import { updateLinkSchema } from '@/lib/validation';
import { checkQuota, checkRedirectTargets, fail, footprintOf, type RuleFailure } from '@/lib/links/rules';
import { isUniqueViolation } from '@/lib/pg-errors';

/**
 * The single way links are edited. Applies the same rules as creation, so an
 * edit can't turn on features (deep links, device targeting, unarchiving)
 * beyond what the plan allows.
 */

export interface UpdateLinkContext {
  workspace: Pick<WorkspaceRecord, 'id' | 'plan'>;
  userId: string | null;
  isAdmin?: boolean;
}

export type UpdateLinkResult = { ok: true; link: LinkRecord } | RuleFailure;

export async function updateLink(ctx: UpdateLinkContext, linkId: string, raw: unknown): Promise<UpdateLinkResult> {
  const parsed = updateLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Noto‘g‘ri so‘rov', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const changes = parsed.data;

  const unsafe = checkRedirectTargets([changes.destination_url, changes.ios_url, changes.android_url, changes.huawei_url, changes.desktop_url]);
  if (unsafe) return unsafe;

  if (changes.folder_id && !(await db.getFolder(changes.folder_id, ctx.workspace.id))) {
    return fail(400, 'FOLDER_NOT_FOUND', 'Papka topilmadi');
  }

  const limits = limitsFor(ctx.workspace, ctx.isAdmin);

  try {
    return await pg.transaction(async (tx) => {
      // Same per-workspace lock as creation, so quota checks can't race
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ctx.workspace.id}))`);

      const current = await db.getOwnedLink(linkId, ctx.workspace.id);
      if (!current) return fail(404, 'NOT_FOUND', 'Link not found');

      if (changes.slug !== undefined && changes.slug !== current.slug) {
        if (!isValidSlug(changes.slug)) return fail(400, 'INVALID_SLUG', 'Yaroqsiz slug formati.');
        if (await db.isSlugTaken(changes.slug)) return fail(409, 'SLUG_TAKEN', 'Ushbu slug allaqachon band qilingan.');
      }

      const merged = { ...current, ...changes } as LinkRecord;
      const usage = await db.getLinkUsage(ctx.workspace.id, tx, linkId);
      const overQuota = checkQuota(limits, usage, footprintOf(current), footprintOf(merged));
      if (overQuota) return overQuota;

      const link = await db.updateLink(linkId, ctx.workspace.id, changes, ctx.userId, tx);
      return link ? { ok: true as const, link } : fail(404, 'NOT_FOUND', 'Link not found');
    });
  } catch (err) {
    if (isUniqueViolation(err)) return fail(409, 'SLUG_TAKEN', 'Ushbu slug allaqachon band qilingan.');
    throw err;
  }
}
