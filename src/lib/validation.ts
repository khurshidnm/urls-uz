import { z } from 'zod';
import { NextResponse } from 'next/server';

/*
 * Request schemas for every API input. z.object() strips unknown keys, so
 * fields the client must not control (workspace_id, click_count, ...) are
 * dropped before a handler ever sees them.
 */

/** '' and whitespace-only strings count as "not provided". */
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Ko‘pi bilan ${max} ta belgi`).optional());

/** Accepts "example.com/x" and stores "https://example.com/x"; only http(s) is allowed. */
export const httpUrl = z
  .string({ error: 'URL kiritilishi shart' })
  .trim()
  .min(1, 'URL kiritilishi shart')
  .max(2048, 'URL juda uzun (2048 belgidan oshmasin)')
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .refine((v) => {
    try {
      const url = new URL(v);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'URL manzil formati noto‘g‘ri');

const optionalHttpUrl = z.preprocess(blankToUndefined, httpUrl.optional());

/** Schemes a visitor's browser may open from a bio page. */
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'tg:', 'mailto:', 'tel:']);
export const safeLinkUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    try {
      return SAFE_LINK_PROTOCOLS.has(new URL(v).protocol);
    } catch {
      return false;
    }
  }, 'Havolalar http(s)://, tg:, mailto: yoki tel: bilan boshlanishi kerak');

/** ISO timestamp (clients send `new Date(localInput).toISOString()`) that lies in the future. */
const futureDate = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Sana formati noto‘g‘ri' });
      return z.NEVER;
    }
    return d;
  })
  .refine((d) => d.getTime() > Date.now(), 'Amal qilish muddati kelajakdagi vaqt bo‘lishi lozim');

const clickLimit = z.coerce
  .number()
  .int('Butun son bo‘lishi kerak')
  .positive('Musbat son bo‘lishi kerak')
  .max(1_000_000_000);

/** Accepts booleans and the legacy 0/1 flags. */
const flag = z.union([z.boolean(), z.literal(0), z.literal(1)]).transform(Boolean);

/**
 * Tags as an array, or the legacy comma-separated string ("promo, telegram").
 * Trimmed, empty ones dropped, de-duplicated case-insensitively.
 */
export const tagsSchema = z
  .union([z.string().max(1000), z.array(z.string().max(100)).max(50)])
  .transform((v) => (typeof v === 'string' ? v.split(',') : v).map((t) => t.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(40, 'Teg ko‘pi bilan 40 ta belgi')).max(20, 'Ko‘pi bilan 20 ta teg'))
  .transform((tags) => {
    const seen = new Set<string>();
    return tags.filter((t) => !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
  });

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Rang HEX formatida bo‘lishi kerak');
const MAX_LOGO_BYTES = 105 * 1024;

/** Saved QR design; mirrors the QrCanvas props that describe appearance. */
export const qrConfigSchema = z
  .object({
    fgColor: hexColor,
    gradientColor2: hexColor,
    bgColor: hexColor,
    colorMode: z.enum(['single', 'gradient']),
    gradientType: z.enum(['linear', 'radial']),
    customEyeColor: z.boolean(),
    eyeFrameColor: hexColor,
    eyeBallColor: hexColor,
    bodyShape: z.enum(['square', 'dots', 'rounded', 'diamond', 'mosaic']),
    eyeFrameShape: z.enum(['square', 'rounded', 'circle', 'leaf']),
    eyeBallShape: z.enum(['square', 'circle', 'rounded', 'diamond']),
    centerLogo: z.string().max(40),
    centerEmoji: z.string().max(16).nullable(),
    customLogoUrl: z
      .string()
      .refine((v) => v.startsWith('https://') || v.startsWith('data:image/'), 'Logo manzili noto‘g‘ri')
      .refine(
        (v) => !v.startsWith('data:image/') || Math.round(((v.split(',')[1] || '').length * 3) / 4) <= MAX_LOGO_BYTES,
        'Logo hajmi 100 KB dan oshmasligi kerak'
      )
      .nullable(),
    removeBgBehindLogo: z.boolean(),
    frameText: z.string().max(40),
    frameStyle: z.enum(['bottom', 'top', 'none']),
    errorLevel: z.enum(['L', 'M', 'Q', 'H']),
  })
  .partial()
  .strict();

const folderId = z.string().trim().min(1).max(64);

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const createLinkSchema = z.object({
  destination_url: httpUrl,
  title: optionalText(200),
  slug: optionalText(50),
  /** Older clients send `custom_slug`. */
  custom_slug: optionalText(50),
  password: optionalText(128),
  expires_at: z.preprocess(blankToUndefined, futureDate.optional()),
  click_limit: z.preprocess(blankToUndefined, clickLimit.optional()),
  utm_source: optionalText(200),
  utm_medium: optionalText(200),
  utm_campaign: optionalText(200),
  utm_term: optionalText(200),
  utm_content: optionalText(200),
  ios_url: optionalHttpUrl,
  android_url: optionalHttpUrl,
  huawei_url: optionalHttpUrl,
  desktop_url: optionalHttpUrl,
  open_in_app: flag.optional(),
  tags: tagsSchema.optional(),
  folder_id: z.preprocess(blankToUndefined, folderId.optional()),
});
export type CreateLinkInput = z.output<typeof createLinkSchema>;

/** `null` (or '') clears an optional field; omitted fields are left unchanged. */
const clearable = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullable().optional());

export const updateLinkSchema = z
  .object({
    title: z.string().trim().min(1, 'Nom bo‘sh bo‘lmasin').max(200).optional(),
    destination_url: httpUrl.optional(),
    slug: z.string().trim().min(1).max(50).optional(),
    is_active: flag.optional(),
    is_archived: flag.optional(),
    tags: tagsSchema.optional(),
    folder_id: clearable(folderId),
    qr_config: clearable(qrConfigSchema),
    password: clearable(z.string().max(128)),
    expires_at: clearable(futureDate),
    click_limit: clearable(clickLimit),
    utm_source: clearable(z.string().trim().max(200)),
    utm_medium: clearable(z.string().trim().max(200)),
    utm_campaign: clearable(z.string().trim().max(200)),
    utm_term: clearable(z.string().trim().max(200)),
    utm_content: clearable(z.string().trim().max(200)),
    ios_url: clearable(httpUrl),
    android_url: clearable(httpUrl),
    huawei_url: clearable(httpUrl),
    desktop_url: clearable(httpUrl),
    open_in_app: flag.optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'O‘zgartirish uchun kamida bitta maydon yuboring');

const bulkIds = z.array(z.string().max(64)).min(1, 'Kamida bitta havola tanlang').max(100, 'Bir martada ko‘pi bilan 100 ta havola');
const bulkTag = z.string().trim().min(1).max(40);

export const bulkLinksSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('archive'), ids: bulkIds }),
  z.object({ action: z.literal('unarchive'), ids: bulkIds }),
  z.object({ action: z.literal('delete'), ids: bulkIds }),
  z.object({ action: z.literal('move'), ids: bulkIds, folder_id: folderId.nullable() }),
  z.object({ action: z.literal('add_tag'), ids: bulkIds, tag: bulkTag }),
  z.object({ action: z.literal('remove_tag'), ids: bulkIds, tag: bulkTag }),
]);

export const folderSchema = z.object({
  name: z.string().trim().min(1, 'Papka nomi kiritilishi shart').max(60),
});

export const unlockLinkSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  password: z.string().min(1, 'Parolni kiriting').max(128),
});

// ---------------------------------------------------------------------------
// Bio pages
// ---------------------------------------------------------------------------

const MAX_AVATAR_BYTES = 105 * 1024;

export const saveBioSchema = z.object({
  handle: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ''))
    .pipe(
      z.string().regex(/^[a-zA-Z0-9_.-]{3,30}$/, 'Handle 3–30 ta belgi: harf, raqam, nuqta, tire yoki tagchiziq bo‘lishi kerak')
    ),
  title: z.string().trim().min(1, 'Sarlavha kiritilishi shart').max(100),
  bio: z.string().trim().max(500).default(''),
  avatar_url: z
    .string()
    .default('')
    .refine((v) => v === '' || v.startsWith('https://') || v.startsWith('data:image/'), 'Avatar manzili noto‘g‘ri')
    .refine(
      (v) => !v.startsWith('data:image/') || Math.round(((v.split(',')[1] || '').length * 3) / 4) <= MAX_AVATAR_BYTES,
      'Rasm hajmi 100 KB dan oshmasligi kerak'
    ),
  theme: z.string().trim().max(40).default('midnight'),
  social_links: z
    .record(z.string().max(40), z.string().trim().max(200))
    .default({})
    .transform((socials, ctx) => {
      const out: Record<string, string> = {};
      for (const [network, value] of Object.entries(socials)) {
        if (!value) continue;
        // Plain usernames are fine; full URLs must use a safe scheme
        if (value.includes(':') && !safeLinkUrl.safeParse(value).success) {
          ctx.addIssue({ code: 'custom', message: `${network} havolasi noto‘g‘ri`, path: [network] });
          continue;
        }
        out[network] = value;
      }
      return out;
    }),
  links: z
    .array(
      z.object({
        /** Existing button id, so the button keeps its short link and statistics. */
        id: z.string().max(64).optional(),
        title: z.string().trim().min(1, 'Tugma nomi bo‘sh bo‘lmasin').max(100),
        url: safeLinkUrl,
        icon: z.string().max(40).optional(),
        style: z.string().max(40).optional(),
        animation: z.string().max(40).optional(),
      })
    )
    .max(50)
    .default([]),
});

export const bioClickSchema = z.object({ linkId: z.string().min(1).max(64) });

// ---------------------------------------------------------------------------
// API keys, auth, admin
// ---------------------------------------------------------------------------

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'Kalit nomi kiritilishi shart').max(80),
});

export const telegramAuthSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('verify-widget'), widgetData: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal('send-otp'), phone: z.string().max(32) }),
  z.object({
    action: z.literal('verify-otp'),
    phone: z.string().max(32),
    code: z.string().trim().regex(/^\d{4,8}$/, 'Kod noto‘g‘ri'),
    name: z.string().trim().max(80).optional(),
  }),
]);

export const demoEditSchema = z.object({ active: z.boolean() });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function validationError(error: z.ZodError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error.issues[0]?.message ?? 'Noto‘g‘ri so‘rov',
      code: 'VALIDATION_ERROR',
      issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    },
    { status: 400 }
  );
}

/** Parses and validates a JSON request body. On failure, `response` is a ready 400. */
export async function parseJson<S extends z.ZodType>(request: Request, schema: S): Promise<Parsed<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'So‘rov JSON formatida bo‘lishi kerak', code: 'INVALID_JSON' }, { status: 400 }),
    };
  }
  const result = schema.safeParse(body);
  return result.success ? { ok: true, data: result.data } : { ok: false, response: validationError(result.error) };
}
