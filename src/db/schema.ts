import { sql } from 'drizzle-orm';
import {
  boolean,
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

export const authProvider = pgEnum('auth_provider', ['google', 'telegram', 'phone']);
export const platformRole = pgEnum('platform_role', ['user', 'superadmin']);
export const memberRole = pgEnum('member_role', ['owner', 'admin', 'member']);
export const plan = pgEnum('plan', ['free', 'pro', 'enterprise']);
/** What happened to a link, for its history tab. */
export const linkEventAction = pgEnum('link_event_action', ['created', 'updated', 'archived', 'unarchived']);
/** Where a link was created. Bio-page blocks are links too, but don't count toward plan limits. */
export const linkSource = pgEnum('link_source', ['dashboard', 'landing', 'api', 'telegram', 'bio']);

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
  },
  (t) => [uniqueIndex('users_provider_identity').on(t.provider, t.provider_id)]
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
