import { sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { db, type LinkRecord, type WorkspaceRecord } from '@/lib/db';
import { checkUrlSafety } from '@/lib/anti-phishing';
import { limitsFor, toJsonLimit } from '@/lib/plans';
import { generateRandomSlug, isReservedSlug, isValidSlug } from '@/lib/utils';
import { createLinkSchema } from '@/lib/validation';
import { isUniqueViolation } from '@/lib/pg-errors';

/**
 * The single way links are created: the dashboard, the landing page, the
 * public API, the Telegram bot and post-login "pending" links all come
 * through here, so they share validation, the phishing filter, slug rules
 * and plan limits.
 */

export type LinkSource = LinkRecord['source'];

export interface CreateLinkContext {
  workspace: Pick<WorkspaceRecord, 'id' | 'plan'>;
  userId: string | null;
  isAdmin?: boolean;
}

export type CreateLinkResult =
  | { ok: true; link: LinkRecord }
  | {
      ok: false;
      status: 400 | 403 | 409;
      code: string;
      error: string;
      details?: Record<string, unknown>;
    };

const fail = (
  status: 400 | 403 | 409,
  code: string,
  error: string,
  details?: Record<string, unknown>
): CreateLinkResult => ({ ok: false, status, code, error, details });

const PRO_SOON = 'Cheksiz imkoniyatlar Pro tarifda tez kunda ishga tushadi!';

async function pickRandomSlug(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateRandomSlug(attempt > 8 ? 6 : 5);
    if (!isReservedSlug(candidate) && !(await db.isSlugTaken(candidate))) return candidate;
  }
  return generateRandomSlug(8);
}

/**
 * Validates raw input (from a request body, the bot, ...) and creates the link.
 * `raw` goes through the same Zod schema as the REST API.
 */
export async function createLink(ctx: CreateLinkContext, raw: unknown, source: LinkSource): Promise<CreateLinkResult> {
  const parsed = createLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Noto‘g‘ri so‘rov', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const input = parsed.data;

  // Phishing filter (the schema already normalized the URL to http(s))
  const safety = checkUrlSafety(input.destination_url);
  if (!safety.isSafe) {
    return fail(400, 'PHISHING_SUSPECTED', safety.reason || 'Fishing xavfi: Ushbu havola xavfsizlik filtri tomonidan bloklandi.');
  }

  // Custom slug, or a random 5-character one
  const requestedSlug = input.slug || input.custom_slug;
  if (requestedSlug) {
    if (isReservedSlug(requestedSlug)) {
      return fail(400, 'RESERVED_SLUG', 'Ushbu nom tizim tomonidan band qilingan (Reserved system path). Boshqa nom tanlang.');
    }
    if (!isValidSlug(requestedSlug)) {
      return fail(400, 'INVALID_SLUG', 'Yaroqsiz slug formati. Kamida 3 ta belgi (harf, raqam, tire) bo‘lishi lozim.');
    }
    if (await db.isSlugTaken(requestedSlug)) {
      return fail(409, 'SLUG_TAKEN', 'Ushbu qisqa havola (slug) allaqachon band qilingan. Boshqa nom tanlang.');
    }
  }
  if (input.folder_id && !(await db.getFolder(input.folder_id, ctx.workspace.id))) {
    return fail(400, 'FOLDER_NOT_FOUND', 'Papka topilmadi');
  }

  const slug = requestedSlug || (await pickRandomSlug());

  const wantsDeepLink = Boolean(input.open_in_app);
  const wantsDeviceTargeting = Boolean(input.ios_url || input.android_url || input.huawei_url || input.desktop_url);
  const limits = limitsFor(ctx.workspace, ctx.isAdmin);

  try {
    return await pg.transaction(async (tx) => {
      // Serialize creates per workspace so concurrent requests can't exceed the plan
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ctx.workspace.id}))`);

      if (source !== 'bio') {
        const usage = await db.getLinkUsage(ctx.workspace.id, tx);
        if (usage.activeLinks >= limits.activeLinks) {
          return fail(
            403,
            'FREE_LIMIT_REACHED',
            `Tarifingizda ko‘pi bilan ${limits.activeLinks} ta faol havola yaratish mumkin (${usage.activeLinks}/${limits.activeLinks}). Yangi havola uchun eskilarini arxivlang yoki o‘chiring. ${PRO_SOON}`,
            { limit: toJsonLimit(limits.activeLinks), currentCount: usage.activeLinks }
          );
        }
        if (wantsDeepLink && usage.deepLinks >= limits.deepLinks) {
          return fail(
            403,
            'DEEP_LINK_LIMIT_REACHED',
            `Tarifingizda ${limits.deepLinks} ta Smart Deep Link yaratish mumkin (${usage.deepLinks}/${limits.deepLinks} ishlatilgan). Mavjud deep linkni o‘chiring yoki oddiy havola sifatida yarating. ${PRO_SOON}`,
            { maxLimit: toJsonLimit(limits.deepLinks), currentCount: usage.deepLinks }
          );
        }
        if (wantsDeviceTargeting && usage.deviceTargeting >= limits.deviceTargeting) {
          return fail(
            403,
            'DEVICE_TARGETING_LIMIT_REACHED',
            `Tarifingizda ${limits.deviceTargeting} ta qurilmalar bo‘yicha yo‘naltiruvchi havola yaratish mumkin (${usage.deviceTargeting}/${limits.deviceTargeting} ishlatilgan). ${PRO_SOON}`,
            { maxLimit: toJsonLimit(limits.deviceTargeting), currentCount: usage.deviceTargeting }
          );
        }
      }

      const link = await db.createLink(
        {
          workspaceId: ctx.workspace.id,
          createdBy: ctx.userId,
          title: input.title || slug,
          destination_url: input.destination_url,
          slug,
          password: input.password ?? null,
          expires_at: input.expires_at ?? null,
          click_limit: input.click_limit ?? null,
          utm_source: input.utm_source ?? null,
          utm_medium: input.utm_medium ?? null,
          utm_campaign: input.utm_campaign ?? null,
          utm_term: input.utm_term ?? null,
          utm_content: input.utm_content ?? null,
          ios_url: input.ios_url ?? null,
          android_url: input.android_url ?? null,
          huawei_url: input.huawei_url ?? null,
          desktop_url: input.desktop_url ?? null,
          open_in_app: wantsDeepLink,
          tags: input.tags ?? [],
          folder_id: input.folder_id ?? null,
          source,
        },
        tx
      );
      await db.recordLinkEvent({ link_id: link.id, user_id: ctx.userId, action: 'created' }, tx);
      return { ok: true as const, link };
    });
  } catch (err) {
    // Lost a race for the same slug between the availability check and the insert
    if (isUniqueViolation(err)) {
      return fail(409, 'SLUG_TAKEN', 'Ushbu qisqa havola (slug) allaqachon band qilingan. Boshqa nom tanlang.');
    }
    throw err;
  }
}
