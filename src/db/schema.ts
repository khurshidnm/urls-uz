import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/*
 * Column property names are snake_case on purpose: they match the JSON the
 * API has always returned (link.destination_url, link.is_archived, ...), so
 * client components keep working unchanged.
 */

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const authProvider = pgEnum('auth_provider', ['google', 'telegram', 'phone', 'password']);
export const platformRole = pgEnum('platform_role', ['user', 'superadmin']);
export const memberRole = pgEnum('member_role', ['owner', 'admin', 'member']);
export const plan = pgEnum('plan', ['free', 'pro', 'enterprise']);
/** What happened to a link, for its history tab. */
export const linkEventAction = pgEnum('link_event_action', ['created', 'updated', 'archived', 'unarchived']);
/** Where a link was created. Bio-page blocks are links too, but don't count toward plan limits. */
export const linkSource = pgEnum('link_source', ['dashboard', 'landing', 'api', 'telegram', 'bio', 'qr']);
/** What a saved QR code contains. */
export const qrType = pgEnum('qr_type', ['url', 'text', 'vcard', 'location', 'wifi', 'event']);

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    provider: authProvider('provider').notNull(),
    provider_id: text('provider_id').notNull(),
    email: text('email'),
    phone: text('phone'),
    name: text('name').notNull(),
    avatar_url: text('avatar_url'),
    role: platformRole('role').notNull().default('user'),
    created_at: createdAt(),
    last_login_at: timestamp('last_login_at', { withTimezone: true }),
    /** Last request with a session, updated at most hourly (activity for the admin panel). */
    last_seen_at: timestamp('last_seen_at', { withTimezone: true }),
    // Two-step login with an authenticator app (TOTP). Secrets are stored encrypted.
    totp_secret: text('totp_secret'),
    /** Set during setup, until the first code confirms the app is configured. */
    totp_pending_secret: text('totp_pending_secret'),
    totp_enabled_at: timestamp('totp_enabled_at', { withTimezone: true }),
    /** Last accepted 30-second step, so a code can't be used twice. */
    totp_last_step: integer('totp_last_step'),
    /** sha256 of the unused one-time recovery codes. */
    totp_recovery_codes: text('totp_recovery_codes').array().notNull().default(sql`'{}'::text[]`),
  },
  // Logins are looked up in user_identities; this only records the first login method
  (t) => [index('users_provider_identity').on(t.provider, t.provider_id)]
);

/**
 * The ways a user can log in. One person can connect Google, Telegram and a
 * phone number to the same account; each login method belongs to one user.
 * (users.provider / provider_id record how the account was first created.)
 */
export const userIdentities = pgTable(
  'user_identities',
  {
    provider: authProvider('provider').notNull(),
    provider_id: text('provider_id').notNull(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    /** What to show in settings: the Google email, the Telegram name or @username, the phone number. */
    label: text('label'),
    /** For the 'password' method (provider_id = the login): scrypt hash. Lives here so it moves with the method. */
    password_hash: text('password_hash'),
    created_at: createdAt(),
    last_login_at: timestamp('last_login_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.provider, t.provider_id] }), index('user_identities_user').on(t.user_id)]
);

export const sessions = pgTable(
  'sessions',
  {
    /** sha256 of the session token; the raw token only exists in the cookie. */
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    created_at: createdAt(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user').on(t.user_id)]
);

// ---------------------------------------------------------------------------
// Tenancy: a workspace owns links, bio pages, API keys and the subscription.
// ---------------------------------------------------------------------------

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: plan('plan').notNull().default('free'),
  /** When a paid plan ends; null = no end (free, or granted without a period). Expired plans act as free. */
  plan_expires_at: timestamp('plan_expires_at', { withTimezone: true }),
  /** The seeded, read-only showcase shown to visitors who aren't logged in. */
  is_demo: boolean('is_demo').notNull().default(false),
  created_at: createdAt(),
});

export const memberships = pgTable(
  'memberships',
  {
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: memberRole('role').notNull().default('member'),
    created_at: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.workspace_id, t.user_id] }), index('memberships_user').on(t.user_id)]
);

// ---------------------------------------------------------------------------
// Links & clicks
// ---------------------------------------------------------------------------

export const folders = pgTable(
  'folders',
  {
    id: text('id').primaryKey(),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    created_at: createdAt(),
  },
  (t) => [uniqueIndex('folders_workspace_name').on(t.workspace_id, sql`lower(${t.name})`)]
);

/** Saved QR design for a link. The QR always encodes the short URL, so it stays dynamic. */
export type QrConfig = {
  fgColor?: string;
  gradientColor2?: string;
  bgColor?: string;
  colorMode?: 'single' | 'gradient';
  gradientType?: 'linear' | 'radial';
  customEyeColor?: boolean;
  eyeFrameColor?: string;
  eyeBallColor?: string;
  bodyShape?: 'square' | 'dots' | 'rounded' | 'diamond' | 'mosaic';
  eyeFrameShape?: 'square' | 'rounded' | 'circle' | 'leaf';
  eyeBallShape?: 'square' | 'circle' | 'rounded' | 'diamond';
  centerLogo?: string;
  centerEmoji?: string | null;
  customLogoUrl?: string | null;
  removeBgBehindLogo?: boolean;
  frameText?: string;
  frameStyle?: 'bottom' | 'top' | 'none';
  errorLevel?: 'L' | 'M' | 'Q' | 'H';
};

export const links = pgTable(
  'links',
  {
    id: text('id').primaryKey(),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    created_by: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    destination_url: text('destination_url').notNull(),
    slug: text('slug').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    is_archived: boolean('is_archived').notNull().default(false),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    folder_id: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    qr_config: jsonb('qr_config').$type<QrConfig>(),
    /** scrypt hash, never sent to clients. */
    password: text('password'),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    click_limit: integer('click_limit'),
    click_count: integer('click_count').notNull().default(0),
    utm_source: text('utm_source'),
    utm_medium: text('utm_medium'),
    utm_campaign: text('utm_campaign'),
    utm_term: text('utm_term'),
    utm_content: text('utm_content'),
    ios_url: text('ios_url'),
    android_url: text('android_url'),
    huawei_url: text('huawei_url'),
    desktop_url: text('desktop_url'),
    open_in_app: boolean('open_in_app').notNull().default(false),
    source: linkSource('source').notNull().default('dashboard'),
    created_at: createdAt(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Slugs are compared case-sensitively, like the SQLite version
    uniqueIndex('links_slug').on(t.slug),
    index('links_workspace').on(t.workspace_id, t.created_at),
    index('links_folder').on(t.folder_id),
    index('links_tags').using('gin', t.tags),
  ]
);

/** Audit trail shown on a link's history tab. Sensitive values (passwords) are never stored. */
export const linkEvents = pgTable(
  'link_events',
  {
    id: text('id').primaryKey(),
    link_id: text('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
    user_id: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: linkEventAction('action').notNull(),
    /** field -> { from, to } */
    changes: jsonb('changes').$type<Record<string, { from: unknown; to: unknown }>>().notNull().default({}),
    created_at: createdAt(),
  },
  (t) => [index('link_events_link_time').on(t.link_id, t.created_at)]
);

export const clicks = pgTable(
  'clicks',
  {
    id: text('id').primaryKey(),
    link_id: text('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
    ip_hash: text('ip_hash'),
    referer: text('referer').notNull().default('Direct'),
    country: text('country').notNull().default('Unknown'),
    region: text('region').notNull().default('Unknown'),
    city: text('city').notNull().default('Unknown'),
    device_type: text('device_type').notNull().default('Unknown'),
    os: text('os').notNull().default('Unknown'),
    browser: text('browser').notNull().default('Unknown'),
    created_at: createdAt(),
  },
  (t) => [index('clicks_link_time').on(t.link_id, t.created_at), index('clicks_time').on(t.created_at)]
);

/** What a daily total is broken down by; 'total' has the value ''. */
export const statDimension = pgEnum('stat_dimension', ['total', 'region', 'country', 'referer', 'device', 'os', 'browser']);

/**
 * Clicks per link per day (Tashkent time), in total and per region, country,
 * source, device, OS and browser. Dashboards read these instead of counting
 * raw clicks, so they stay fast however many clicks a link gets. Kept
 * forever; raw clicks are pruned after the plan's retention period.
 * 'region' covers Uzbekistan only (the regions panel); other countries are in 'country'.
 */
export const linkStatsDaily = pgTable(
  'link_stats_daily',
  {
    link_id: text('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    dimension: statDimension('dimension').notNull(),
    value: text('value').notNull(),
    clicks: integer('clicks').notNull(),
  },
  (t) => [primaryKey({ columns: [t.link_id, t.day, t.dimension, t.value] })]
);

// ---------------------------------------------------------------------------
// Saved QR codes
// ---------------------------------------------------------------------------

/**
 * A QR code the user saved to edit later. A dynamic one encodes its link's
 * short URL, so the printed image never changes: editing `content` changes
 * where the link goes (url, location) or what its hosted page shows (vcard,
 * event, text). A static one encodes `content` directly.
 */
export const qrCodes = pgTable(
  'qr_codes',
  {
    id: text('id').primaryKey(),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    created_by: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    type: qrType('type').notNull(),
    /** The form data for `type` (VCardPayload, WifiPayload, { url }, ...). */
    content: jsonb('content').$type<Record<string, unknown>>().notNull(),
    design: jsonb('design').$type<QrConfig>().notNull().default({}),
    /** Set for dynamic QR codes; deleting the link deletes the QR code. */
    link_id: text('link_id').references(() => links.id, { onDelete: 'cascade' }),
    created_at: createdAt(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('qr_codes_workspace').on(t.workspace_id, t.updated_at), uniqueIndex('qr_codes_link').on(t.link_id)]
);

// ---------------------------------------------------------------------------
// Bio pages
// ---------------------------------------------------------------------------

export const bioPages = pgTable(
  'bio_pages',
  {
    id: text('id').primaryKey(),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    handle: text('handle').notNull(),
    title: text('title').notNull(),
    bio: text('bio').notNull().default(''),
    avatar_url: text('avatar_url').notNull().default(''),
    theme: text('theme').notNull().default('midnight'),
    verified: boolean('verified').notNull().default(false),
    social_links: jsonb('social_links').$type<Record<string, string>>().notNull().default({}),
    view_count: integer('view_count').notNull().default(0),
    created_at: createdAt(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('bio_pages_handle').on(sql`lower(${t.handle})`),
    index('bio_pages_workspace').on(t.workspace_id),
  ]
);

export const bioLinks = pgTable(
  'bio_links',
  {
    id: text('id').primaryKey(),
    bio_page_id: text('bio_page_id').notNull().references(() => bioPages.id, { onDelete: 'cascade' }),
    /**
     * The short link this button goes through, so its clicks get full analytics.
     * Null for non-http buttons (tel:, mailto:, tg:), which use click_count below.
     */
    link_id: text('link_id').references(() => links.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    url: text('url').notNull(),
    icon: text('icon').notNull().default('link'),
    style: text('style').notNull().default('glass'),
    animation: text('animation').notNull().default('none'),
    click_count: integer('click_count').notNull().default(0),
    sort_order: integer('sort_order').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
  },
  (t) => [index('bio_links_page').on(t.bio_page_id, t.sort_order)]
);

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export const paymentMethod = pgEnum('payment_method', ['manual', 'payme', 'click', 'uzum']);

/**
 * A payment for a paid plan period. For now admins record them by hand
 * (method 'manual'); Payme / Click webhooks will add rows the same way.
 */
export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    plan: plan('plan').notNull(),
    /** In so‘m. */
    amount: integer('amount').notNull(),
    method: paymentMethod('method').notNull(),
    period_start: timestamp('period_start', { withTimezone: true }).notNull(),
    period_end: timestamp('period_end', { withTimezone: true }).notNull(),
    note: text('note'),
    /** The admin who recorded a manual payment. */
    recorded_by: text('recorded_by').references(() => users.id, { onDelete: 'set null' }),
    created_at: createdAt(),
  },
  (t) => [index('payments_workspace').on(t.workspace_id, t.created_at), index('payments_time').on(t.created_at)]
);

// ---------------------------------------------------------------------------
// Rate limits (shared by every server process)
// ---------------------------------------------------------------------------

/** One fixed window of one limit: how many requests `key` made in it. */
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').notNull(),
    /** Window number: floor(time / window length). */
    window: integer('window').notNull(),
    count: integer('count').notNull(),
    /** When the window ends; expired rows are deleted. */
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.key, t.window] }), index('rate_limits_expiry').on(t.expires_at)]
);

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    created_by: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    key_hash: text('key_hash').notNull().unique(),
    key_prefix: text('key_prefix').notNull(),
    created_at: createdAt(),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
  },
  (t) => [index('api_keys_workspace').on(t.workspace_id)]
);
