import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { pg } from '@/db/client';
import { db, newId, type WorkspaceRecord } from '@/lib/db';
import { limitsFor } from '@/lib/plans';
import { pickRandomSlug } from '@/lib/links/create-link';
import { checkQuota, checkRedirectTargets, fail, footprintOf, NO_FOOTPRINT, type RuleFailure } from '@/lib/links/rules';
import { httpUrl, qrConfigSchema } from '@/lib/validation';
import { isUniqueViolation } from '@/lib/pg-errors';
import { canBeDynamic, QR_CONTENT_SCHEMAS, redirectTarget } from '@/lib/qr/content';
import { qrRepo } from '@/lib/qr/qr-repo';
import type { QrDataType } from '@/lib/qr-payloads';
import { SITE_URL } from '@/lib/site';

/**
 * Saving QR codes from the studio. A dynamic QR code gets a short link
 * (source "qr") that counts toward the plan like any other link; the QR
 * encodes that link, so later edits never change the printed image.
 */

export interface QrContext {
  workspace: Pick<WorkspaceRecord, 'id' | 'plan'>;
  userId: string | null;
  isAdmin?: boolean;
}

type QrResult = { ok: true; id: string } | RuleFailure;

const QR_TYPES = ['url', 'text', 'vcard', 'location', 'wifi', 'event'] as const;

export const createQrSchema = z.object({
  name: z.string().trim().min(1, 'QR kod nomini kiriting').max(100, 'Nom ko‘pi bilan 100 ta belgi'),
  type: z.enum(QR_TYPES),
  content: z.record(z.string(), z.unknown()),
  design: qrConfigSchema.optional().default({}),
  dynamic: z.boolean().optional().default(false),
});

/** No defaults here: a missing field means "unchanged". The type can't change. */
export const updateQrSchema = z.object({
  name: createQrSchema.shape.name.optional(),
  content: createQrSchema.shape.content.optional(),
  design: qrConfigSchema.optional(),
  dynamic: z.boolean().optional(),
});

const validationFailure = (issues: z.core.$ZodIssue[]) =>
  fail(400, 'VALIDATION_ERROR', issues[0]?.message ?? 'Noto‘g‘ri so‘rov', {
    issues: issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });

/** Validates `content` for its type; URLs are normalized and phishing-checked. */
function parseContent(type: QrDataType, raw: unknown): { ok: true; content: Record<string, unknown> } | RuleFailure {
  const parsed = QR_CONTENT_SCHEMAS[type].safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error.issues);
  const content = parsed.data as Record<string, unknown>;
  if (type === 'url') {
    const url = httpUrl.safeParse(content.url);
    if (!url.success) return validationFailure(url.error.issues);
    content.url = url.data;
  }
  const target = redirectTarget(type, content);
  const unsafe = checkRedirectTargets([target]);
  return unsafe ?? { ok: true, content };
}

/**
 * Hosted types (vCard, event, text) are rendered by the short link itself; the
 * link's destination is the downloadable file, which also works on its own.
 */
function linkDestination(qrId: string, type: QrDataType, content: Record<string, unknown>): string {
  return redirectTarget(type, content) || `${SITE_URL}/api/qr-codes/${qrId}/file`;
}

export async function createQrCode(ctx: QrContext, raw: unknown): Promise<QrResult> {
  const parsed = createQrSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error.issues);
  const input = parsed.data;

  if (input.dynamic && !canBeDynamic(input.type)) {
    return fail(400, 'STATIC_ONLY', 'Wi-Fi QR kodlari faqat statik bo‘ladi: telefon tarmoq ma’lumotini QR ichidan o‘qiydi.');
  }
  const content = parseContent(input.type, input.content);
  if (!content.ok) return content;

  const id = newId('qr');
  const base = {
    id,
    workspace_id: ctx.workspace.id,
    created_by: ctx.userId,
    name: input.name,
    type: input.type,
    content: content.content,
    design: input.design,
  };

  if (!input.dynamic) {
    await qrRepo.insert({ ...base, link_id: null });
    return { ok: true, id };
  }
  return withNewLink(ctx, id, input.type, content.content, input.name, input.design, (linkId, tx) =>
    qrRepo.insert({ ...base, link_id: linkId }, tx).then(() => undefined)
  );
}

/** Creates the short link behind a dynamic QR code, within the plan's limits. */
async function withNewLink(
  ctx: QrContext,
  qrId: string,
  type: QrDataType,
  content: Record<string, unknown>,
  name: string,
  design: Record<string, unknown>,
  attach: (linkId: string, tx: Parameters<Parameters<typeof pg.transaction>[0]>[0]) => Promise<void>
): Promise<QrResult> {
  const slug = await pickRandomSlug();
  const limits = limitsFor(ctx.workspace, ctx.isAdmin);
  try {
    return await pg.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ctx.workspace.id}))`);
      const usage = await db.getLinkUsage(ctx.workspace.id, tx);
      const overQuota = checkQuota(limits, usage, NO_FOOTPRINT, footprintOf({ source: 'qr' }));
      if (overQuota) return overQuota;

      const link = await db.createLink(
        {
          workspaceId: ctx.workspace.id,
          createdBy: ctx.userId,
          title: name,
          destination_url: linkDestination(qrId, type, content),
          slug,
          qr_config: design,
          source: 'qr',
        },
        tx
      );
      await db.recordLinkEvent({ link_id: link.id, user_id: ctx.userId, action: 'created' }, tx);
      await attach(link.id, tx);
      return { ok: true as const, id: qrId };
    });
  } catch (err) {
    if (isUniqueViolation(err)) return fail(409, 'SLUG_TAKEN', 'Qisqa havola band bo‘lib qoldi, qayta urinib ko‘ring.');
    throw err;
  }
}

export async function updateQrCode(ctx: QrContext, id: string, raw: unknown): Promise<QrResult> {
  const parsed = updateQrSchema.safeParse(raw);
  if (!parsed.success) return validationFailure(parsed.error.issues);
  const input = parsed.data;

  const current = await qrRepo.get(id, ctx.workspace.id);
  if (!current) return fail(404, 'NOT_FOUND', 'QR kod topilmadi');

  // The printed image of a dynamic QR is its short link; making it static would break it
  if (input.dynamic === false && current.link_id) {
    return fail(400, 'ALREADY_DYNAMIC', 'Dinamik QR kodni statikka aylantirib bo‘lmaydi: chop etilgan nusxalar ishlamay qoladi.');
  }
  const makeDynamic = input.dynamic === true && !current.link_id;
  if (makeDynamic && !canBeDynamic(current.type)) {
    return fail(400, 'STATIC_ONLY', 'Wi-Fi QR kodlari faqat statik bo‘ladi: telefon tarmoq ma’lumotini QR ichidan o‘qiydi.');
  }

  let content = current.content;
  if (input.content !== undefined) {
    const result = parseContent(current.type, input.content);
    if (!result.ok) return result;
    content = result.content;
  }
  const name = input.name ?? current.name;
  const design = input.design ?? current.design;
  const changes = { name, content, design };

  if (makeDynamic) {
    return withNewLink(ctx, id, current.type, content, name, design, (linkId, tx) =>
      qrRepo.update(id, ctx.workspace.id, { ...changes, link_id: linkId }, tx)
    );
  }

  await pg.transaction(async (tx) => {
    await qrRepo.update(id, ctx.workspace.id, changes, tx);
    if (current.link_id) {
      // Keep the link in step: its title, its QR design and (for redirects) where it goes
      await db.updateLink(
        current.link_id,
        ctx.workspace.id,
        { title: name, qr_config: design, destination_url: linkDestination(id, current.type, content) },
        ctx.userId,
        tx
      );
    }
  });
  return { ok: true, id };
}

/** Deletes the QR code; a dynamic one takes its short link (and statistics) with it. */
export async function deleteQrCode(ctx: QrContext, id: string): Promise<boolean> {
  const current = await qrRepo.get(id, ctx.workspace.id);
  if (!current) return false;
  if (current.link_id) await db.deleteLink(current.link_id, ctx.workspace.id);
  else await qrRepo.delete(id, ctx.workspace.id);
  return true;
}
