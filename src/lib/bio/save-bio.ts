import { db, type WorkspaceRecord } from '@/lib/db';
import { limitsFor } from '@/lib/plans';
import { handleProblem } from '@/lib/bio/handle';
import { saveBioSchema } from '@/lib/validation';
import { createLink } from '@/lib/links/create-link';
import { updateLink } from '@/lib/links/update-link';
import { fail, type RuleFailure } from '@/lib/links/rules';

/**
 * Saves a bio page. Every http(s) button is backed by a short link (source
 * "bio"), so button clicks go through the normal redirect and show up in
 * analytics, and button URLs get the same validation and phishing filter as
 * any link. Buttons with tel:, mailto: or tg: can't redirect and keep a
 * simple counter.
 */

export interface SaveBioContext {
  workspace: Pick<WorkspaceRecord, 'id' | 'plan'>;
  userId: string | null;
  isAdmin?: boolean;
}

type SavedBio = NonNullable<Awaited<ReturnType<typeof db.getBioPageByWorkspace>>>;
export type SaveBioResult = { ok: true; bioPage: SavedBio; truncated: boolean } | RuleFailure;

const isHttp = (url: string) => /^https?:\/\//i.test(url);

export async function saveBio(ctx: SaveBioContext, raw: unknown): Promise<SaveBioResult> {
  const parsed = saveBioSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Noto‘g‘ri so‘rov', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const input = parsed.data;

  // A new or changed handle follows the current rules; an existing page keeps its handle
  const current = await db.getBioPageByWorkspace(ctx.workspace.id);
  if (current?.handle.toLowerCase() !== input.handle) {
    const problem = handleProblem(input.handle);
    if (problem) return fail(400, problem.code, problem.message);
  }

  // Handles are unique across all workspaces
  const handleOwner = await db.getBioPageByHandle(input.handle);
  if (handleOwner && handleOwner.workspace_id !== ctx.workspace.id) {
    return fail(409, 'HANDLE_TAKEN', 'Bu handle band. Boshqasini tanlang.');
  }

  const limits = limitsFor(ctx.workspace, ctx.isAdmin);
  const buttons = input.links.slice(0, limits.bioLinks);
  const theme = limits.bioThemes === null || limits.bioThemes.includes(input.theme) ? input.theme : 'midnight';

  const existing = current;
  const previous = new Map((existing?.links ?? []).map((b) => [b.id, b]));
  const serviceCtx = { workspace: ctx.workspace, userId: ctx.userId, isAdmin: ctx.isAdmin };

  const saved: { id?: string; link_id: string | null; title: string; url: string; icon?: string; style?: string; animation?: string }[] = [];
  for (const button of buttons) {
    // Ids from another page are ignored; the button is then treated as new
    const prev = button.id ? previous.get(button.id) : undefined;
    let linkId: string | null = null;

    if (isHttp(button.url)) {
      const linkTitle = `Bio: ${button.title}`;
      if (prev?.link_id) {
        const updated = await updateLink(serviceCtx, prev.link_id, { destination_url: button.url, title: linkTitle });
        if (updated.ok) linkId = updated.link.id;
        else if (updated.code !== 'NOT_FOUND') return withButton(updated, button.title);
      }
      if (!linkId) {
        const created = await createLink(serviceCtx, { destination_url: button.url, title: linkTitle }, 'bio');
        if (!created.ok) return withButton(created, button.title);
        linkId = created.link.id;
      }
    }

    saved.push({ ...button, id: prev ? button.id : undefined, link_id: linkId });
  }

  const bioPage = await db.saveBioPage(ctx.workspace.id, { ...input, theme, links: saved });

  // Short links of removed buttons (or buttons switched to tel:/mailto:) are no longer needed
  const kept = new Set(saved.map((b) => b.link_id).filter(Boolean));
  const orphaned = [...previous.values()].map((b) => b.link_id).filter((id): id is string => Boolean(id) && !kept.has(id));
  await db.deleteBioSourceLinks(orphaned, ctx.workspace.id);

  return { ok: true, bioPage: bioPage!, truncated: input.links.length > buttons.length };
}

/** Points the user at the button that failed. */
function withButton(failure: RuleFailure, title: string): RuleFailure {
  return { ...failure, error: `"${title}" tugmasi: ${failure.error}` };
}
