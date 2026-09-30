import crypto from 'crypto';
import { and, asc, desc, eq, gte, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import {
  apiKeys,
  bioLinks,
  bioPages,
  clicks,
  folders,
  linkEvents,
  links,
  memberships,
  sessions,
  users,
  workspaces,
} from '@/db/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LinkRecord = typeof links.$inferSelect;
export type ClickRecord = typeof clicks.$inferSelect;
export type BioPageRecord = typeof bioPages.$inferSelect;
export type BioLinkRecord = typeof bioLinks.$inferSelect;
export type ApiKeyRecord = typeof apiKeys.$inferSelect;
export type UserRecord = typeof users.$inferSelect;
export type WorkspaceRecord = typeof workspaces.$inferSelect;
export type FolderRecord = typeof folders.$inferSelect;
export type LinkEventRecord = typeof linkEvents.$inferSelect;
export type AuthProvider = UserRecord['provider'];
export type UserRole = UserRecord['role'];
export type MemberRole = (typeof memberships.$inferSelect)['role'];

export interface DeviceRoutingConfig {
  iosUrl?: string;          // App Store yoki iOS Universal Link (apps.apple.com/...)
  androidUrl?: string;      // Google Play yoki Android Intent/App Link (play.google.com/...)
  huaweiUrl?: string;       // Huawei AppGallery linki (appgallery.huawei.com/...)
  desktopUrl?: string;      // Windows / macOS / Linux uchun veb-sayt
  fallbackUrl: string;      // Qolgan barcha holatlar uchun asosiy URL
}

export const DEMO_WORKSPACE_ID = 'ws_demo';

/** Link as exposed to clients: the password hash never leaves the server. */
export type PublicLink = Omit<LinkRecord, 'password'> & { has_password: boolean };

export function toPublicLink(link: LinkRecord): PublicLink {
  const { password, ...rest } = link;
  return { ...rest, has_password: Boolean(password) };
}

/** API key as exposed to clients: never includes the key hash. */
export type PublicApiKey = Omit<ApiKeyRecord, 'key_hash'>;

export function toPublicApiKey(key: ApiKeyRecord): PublicApiKey {
  const { id, workspace_id, created_by, name, key_prefix, created_at, last_used_at } = key;
  return { id, workspace_id, created_by, name, key_prefix, created_at, last_used_at };
}

// ---------------------------------------------------------------------------
// Hashing helpers
// ---------------------------------------------------------------------------

const PASSWORD_PREFIX = 'scrypt$';

export function hashLinkPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 32).toString('hex');
  return `${PASSWORD_PREFIX}${salt}$${hash}`;
}

export function verifyLinkPassword(plain: string, stored: string): boolean {
  if (!stored.startsWith(PASSWORD_PREFIX)) return false;
  const [, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(plain, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function newId(prefix: string, length = 12): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, length)}`;
}

const count = sql<number>`count(*)::int`;

/** Analytics time window. Totals and breakdowns cover the window; the timeline shows up to 90 days. */
export type AnalyticsRange = '7d' | '30d' | 'all';
const RANGE_DAYS: Record<AnalyticsRange, number | null> = { '7d': 7, '30d': 30, all: null };

function clicksSince(range: AnalyticsRange) {
  const days = RANGE_DAYS[range];
  return days === null ? undefined : gte(clicks.created_at, sql`now() - make_interval(days => ${days})`);
}

function timelineSince(range: AnalyticsRange) {
  return gte(clicks.created_at, sql`now() - make_interval(days => ${timelineDays(range)})`);
}

function timelineDays(range: AnalyticsRange): number {
  return RANGE_DAYS[range] ?? 90;
}

const tashkentDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });

/** One entry per day of the window (Tashkent time), with zeros for days without clicks. */
function fillTimeline(rows: { date: string; count: number }[], range: AnalyticsRange) {
  const counts = new Map(rows.map((r) => [r.date, r.count]));
  const days = timelineDays(range);
  return Array.from({ length: days }, (_, i) => {
    const date = tashkentDay.format(new Date(Date.now() - (days - 1 - i) * 86_400_000));
    return { date, count: counts.get(date) ?? 0 };
  });
}

/** The pool itself, or an open transaction: repository writes can join a caller's transaction. */
export type Executor = typeof pg | Parameters<Parameters<typeof pg.transaction>[0]>[0];

/** Day buckets in Uzbekistan time, formatted like the old SQLite date() output. */
const clickDay = sql<string>`to_char(${clicks.created_at} at time zone 'Asia/Tashkent', 'YYYY-MM-DD')`;

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export type LinkInput = {
  workspaceId: string;
  createdBy?: string | null;
  title: string;
  destination_url: string;
  slug: string;
  password?: string | null;
  expires_at?: string | Date | null;
  click_limit?: number | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  ios_url?: string | null;
  android_url?: string | null;
  huawei_url?: string | null;
  desktop_url?: string | null;
  open_in_app?: boolean;
  tags?: string[];
  folder_id?: string | null;
  is_archived?: boolean;
  source?: LinkRecord['source'];
};

export type LinkChanges = Partial<
  Pick<
    LinkRecord,
    | 'title' | 'destination_url' | 'slug' | 'is_active' | 'is_archived' | 'tags' | 'folder_id' | 'qr_config'
    | 'click_limit' | 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content'
    | 'ios_url' | 'android_url' | 'huawei_url' | 'desktop_url' | 'open_in_app'
  >
> & { password?: string | null; expires_at?: string | Date | null };

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fields tracked in link history. Passwords are recorded as set/unset only. */
const HISTORY_FIELDS = [
  'title', 'destination_url', 'slug', 'is_active', 'is_archived', 'tags', 'folder_id', 'password',
  'expires_at', 'click_limit', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ios_url', 'android_url', 'huawei_url', 'desktop_url', 'open_in_app', 'qr_config',
] as const;

function diffLink(before: LinkRecord, after: LinkRecord): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of HISTORY_FIELDS) {
    const a = before[field];
    const b = after[field];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    changes[field] =
      field === 'password'
        ? { from: a ? 'set' : null, to: b ? 'set' : null }
        : { from: a ?? null, to: b ?? null };
  }
  return changes;
}

export const db = {
  // --- Links ---------------------------------------------------------------

  async getLinkBySlug(slug: string): Promise<LinkRecord | undefined> {
    const [row] = await pg.select().from(links).where(and(eq(links.slug, slug), eq(links.is_active, true)));
    return row;
  },

  /** Any link with this slug, active or not — used for availability checks. */
  async isSlugTaken(slug: string): Promise<boolean> {
    const [row] = await pg.select({ id: links.id }).from(links).where(eq(links.slug, slug)).limit(1);
    return Boolean(row);
  },

  async getLinkById(id: string): Promise<LinkRecord | undefined> {
    const [row] = await pg.select().from(links).where(eq(links.id, id));
    return row;
  },

  /** Returns the link only if it belongs to the workspace. */
  async getOwnedLink(id: string, workspaceId: string): Promise<LinkRecord | undefined> {
    const [row] = await pg.select().from(links).where(and(eq(links.id, id), eq(links.workspace_id, workspaceId)));
    return row;
  },

  async getAllLinks(workspaceId: string): Promise<LinkRecord[]> {
    return pg.select().from(links).where(eq(links.workspace_id, workspaceId)).orderBy(desc(links.created_at));
  },

  async createLink(data: LinkInput, exec: Executor = pg): Promise<LinkRecord> {
    const [row] = await exec
      .insert(links)
      .values({
        id: newId('link'),
        workspace_id: data.workspaceId,
        created_by: data.createdBy ?? null,
        title: data.title,
        destination_url: data.destination_url,
        slug: data.slug,
        password: data.password ? hashLinkPassword(data.password) : null,
        expires_at: toDate(data.expires_at),
        click_limit: data.click_limit || null,
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_term: data.utm_term || null,
        utm_content: data.utm_content || null,
        ios_url: data.ios_url || null,
        android_url: data.android_url || null,
        huawei_url: data.huawei_url || null,
        desktop_url: data.desktop_url || null,
        open_in_app: Boolean(data.open_in_app),
        tags: data.tags ?? [],
        folder_id: data.folder_id ?? null,
        is_archived: Boolean(data.is_archived),
        source: data.source ?? 'dashboard',
      })
      .returning();
    return row;
  },

  /** Usage that plan limits apply to. Bio-page blocks (and optionally one link being edited) are excluded. */
  async getLinkUsage(workspaceId: string, exec: Executor = pg, excludeLinkId?: string) {
    const [row] = await exec
      .select({
        activeLinks: count,
        deepLinks: sql<number>`count(*) filter (where ${links.open_in_app})::int`,
        deviceTargeting: sql<number>`count(*) filter (where coalesce(${links.ios_url}, ${links.android_url}, ${links.huawei_url}, ${links.desktop_url}) is not null)::int`,
      })
      .from(links)
      .where(
        and(
          eq(links.workspace_id, workspaceId),
          eq(links.is_archived, false),
          ne(links.source, 'bio'),
          excludeLinkId ? ne(links.id, excludeLinkId) : undefined
        )
      );
    return row;
  },

  /**
   * Updates a link in the workspace and records what changed in its history.
   * Returns undefined if the link doesn't exist there.
   */
  async updateLink(
    id: string,
    workspaceId: string,
    data: LinkChanges,
    userId: string | null = null,
    exec: Executor = pg
  ): Promise<LinkRecord | undefined> {
    const { password, expires_at, ...rest } = data;
    const values: Partial<typeof links.$inferInsert> = { ...rest };
    if (password !== undefined) values.password = password ? hashLinkPassword(password) : null;
    if (expires_at !== undefined) values.expires_at = toDate(expires_at);

    return exec.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(links)
        .where(and(eq(links.id, id), eq(links.workspace_id, workspaceId)))
        .for('update');
      if (!before) return undefined;

      const [after] = await tx
        .update(links)
        .set({ ...values, updated_at: new Date() })
        .where(eq(links.id, id))
        .returning();

      const changes = diffLink(before, after);
      const fields = Object.keys(changes);
      if (fields.length > 0) {
        // Archiving on its own gets a dedicated entry; anything else is an update
        const action =
          fields.length === 1 && fields[0] === 'is_archived'
            ? after.is_archived ? 'archived' : 'unarchived'
            : 'updated';
        await this.recordLinkEvent({ link_id: id, user_id: userId, action, changes }, tx);
      }
      return after;
    });
  },

  async recordLinkEvent(
    event: { link_id: string; user_id: string | null; action: LinkEventRecord['action']; changes?: LinkEventRecord['changes'] },
    exec: Executor = pg
  ) {
    await exec.insert(linkEvents).values({ id: newId('evt'), changes: {}, ...event });
  },

  async getLinkEvents(linkId: string) {
    return pg
      .select({ event: linkEvents, user: { id: users.id, name: users.name, avatar_url: users.avatar_url } })
      .from(linkEvents)
      .leftJoin(users, eq(users.id, linkEvents.user_id))
      .where(eq(linkEvents.link_id, linkId))
      .orderBy(desc(linkEvents.created_at))
      .limit(100);
  },

  async deleteLink(id: string, workspaceId: string): Promise<boolean> {
    const deleted = await pg
      .delete(links)
      .where(and(eq(links.id, id), eq(links.workspace_id, workspaceId)))
      .returning({ id: links.id });
    return deleted.length > 0;
  },

  /**
   * Records a click. The counter is incremented conditionally on the click
   * limit, so concurrent requests can't push a link past it. Returns false
   * when the limit has been reached.
   */
  async recordClick(click: {
    link_id: string;
    ip_hash?: string;
    referer?: string;
    country?: string;
    region?: string;
    city?: string;
    device_type?: string;
    os?: string;
    browser?: string;
  }): Promise<boolean> {
    return pg.transaction(async (tx) => {
      const updated = await tx
        .update(links)
        .set({ click_count: sql`${links.click_count} + 1` })
        .where(
          and(
            eq(links.id, click.link_id),
            or(isNull(links.click_limit), lt(links.click_count, links.click_limit))
          )
        )
        .returning({ id: links.id });
      if (updated.length === 0) return false;

      await tx.insert(clicks).values({
        id: newId('click'),
        link_id: click.link_id,
        ip_hash: click.ip_hash || 'anon',
        referer: click.referer || 'Direct',
        country: click.country || 'Unknown',
        region: click.region || 'Unknown',
        city: click.city || 'Unknown',
        device_type: click.device_type || 'Unknown',
        os: click.os || 'Unknown',
        browser: click.browser || 'Unknown',
      });
      return true;
    });
  },

  // --- Analytics -----------------------------------------------------------

  async getAnalyticsOverview(workspaceId: string, range: AnalyticsRange = '30d') {
    // Every click query is restricted to the workspace's links and the time window
    const inWorkspace = and(eq(links.workspace_id, workspaceId), clicksSince(range));
    const inTimeline = timelineSince(range);
    const joined = eq(links.id, clicks.link_id);

    const [[totals], [linkTotals], [bioTotals], regions, countries, referrers, devices, os, timeline] = await Promise.all([
      pg.select({ n: count }).from(clicks).innerJoin(links, joined).where(inWorkspace),
      pg.select({ n: count }).from(links).where(eq(links.workspace_id, workspaceId)),
      pg.select({ n: sql<number>`coalesce(sum(${bioPages.view_count}), 0)::int` }).from(bioPages).where(eq(bioPages.workspace_id, workspaceId)),
      pg.select({ region: clicks.region, count }).from(clicks).innerJoin(links, joined)
        .where(and(inWorkspace, eq(clicks.country, 'UZ'))).groupBy(clicks.region).orderBy(desc(count)).limit(14),
      pg.select({ country: clicks.country, count }).from(clicks).innerJoin(links, joined)
        .where(inWorkspace).groupBy(clicks.country).orderBy(desc(count)).limit(12),
      pg.select({ referer: clicks.referer, count }).from(clicks).innerJoin(links, joined)
        .where(inWorkspace).groupBy(clicks.referer).orderBy(desc(count)).limit(6),
      pg.select({ device_type: clicks.device_type, count }).from(clicks).innerJoin(links, joined)
        .where(inWorkspace).groupBy(clicks.device_type).orderBy(desc(count)),
      pg.select({ os: clicks.os, count }).from(clicks).innerJoin(links, joined)
        .where(inWorkspace).groupBy(clicks.os).orderBy(desc(count)),
      pg.select({ date: clickDay, count }).from(clicks).innerJoin(links, joined)
        .where(and(inWorkspace, inTimeline)).groupBy(clickDay).orderBy(asc(clickDay)),
    ]);

    return {
      totalClicks: totals.n,
      totalLinks: linkTotals.n,
      totalBioViews: bioTotals.n,
      regions,
      countries,
      referrers,
      devices,
      os,
      timeline: fillTimeline(timeline, range),
    };
  },

  async getLinkAnalytics(linkId: string, range: AnalyticsRange = '30d') {
    const link = await this.getLinkById(linkId);
    if (!link) return null;

    const forLink = and(eq(clicks.link_id, linkId), clicksSince(range));
    const [{ n: clicksInRange }] = await pg.select({ n: count }).from(clicks).where(forLink);
    const [recentClicks, regions, countries, referrers, devices, os, timeline] = await Promise.all([
      pg.select().from(clicks).where(forLink).orderBy(desc(clicks.created_at)).limit(100),
      pg.select({ region: clicks.region, count }).from(clicks).where(forLink).groupBy(clicks.region).orderBy(desc(count)),
      pg.select({ country: clicks.country, count }).from(clicks).where(forLink).groupBy(clicks.country).orderBy(desc(count)).limit(12),
      pg.select({ referer: clicks.referer, count }).from(clicks).where(forLink).groupBy(clicks.referer).orderBy(desc(count)).limit(10),
      pg.select({ device_type: clicks.device_type, count }).from(clicks).where(forLink).groupBy(clicks.device_type).orderBy(desc(count)),
      pg.select({ os: clicks.os, count }).from(clicks).where(forLink).groupBy(clicks.os).orderBy(desc(count)),
      pg.select({ date: clickDay, count }).from(clicks)
        .where(and(eq(clicks.link_id, linkId), timelineSince(range)))
        .groupBy(clickDay).orderBy(asc(clickDay)),
    ]);

    return {
      link,
      totalClicks: range === 'all' ? link.click_count : clicksInRange,
      clicks: recentClicks,
      regions,
      countries,
      referrers,
      devices,
      os,
      timeline: fillTimeline(timeline, range),
    };
  },

  /**
   * Platform-wide numbers for the landing page. The demo workspace is
   * excluded so only real usage is shown, and the recent activity feed has no
   * URLs or slugs, since those belong to other users.
   */
  async getPublicStats() {
    const realLink = ne(links.workspace_id, DEMO_WORKSPACE_ID);
    const lastWeek = sql`now() - interval '7 days'`;
    const joined = eq(links.id, clicks.link_id);

    const [[redirects], [redirects7], [linkCount], [links7], [userCount], [bioCount], recentClicks] = await Promise.all([
      pg.select({ n: count }).from(clicks).innerJoin(links, joined).where(realLink),
      pg.select({ n: count }).from(clicks).innerJoin(links, joined).where(and(realLink, gte(clicks.created_at, lastWeek))),
      pg.select({ n: count }).from(links).where(realLink),
      pg.select({ n: count }).from(links).where(and(realLink, gte(links.created_at, lastWeek))),
      pg.select({ n: count }).from(users),
      pg.select({ n: count }).from(bioPages).where(ne(bioPages.workspace_id, DEMO_WORKSPACE_ID)),
      pg.select({ country: clicks.country, region: clicks.region, os: clicks.os, browser: clicks.browser, created_at: clicks.created_at })
        .from(clicks).innerJoin(links, joined).where(realLink)
        .orderBy(desc(clicks.created_at)).limit(5),
    ]);

    return {
      totalRedirects: redirects.n,
      redirectsLast7Days: redirects7.n,
      totalLinks: linkCount.n,
      linksLast7Days: links7.n,
      totalUsers: userCount.n,
      totalBioPages: bioCount.n,
      recentClicks,
    };
  },

  // --- Bio pages -----------------------------------------------------------

  async getBioPageByHandle(handle: string) {
    const clean = handle.replace(/^@/, '');
    const [bio] = await pg.select().from(bioPages).where(sql`lower(${bioPages.handle}) = lower(${clean})`);
    if (!bio) return undefined;
    const pageLinks = await pg
      .select()
      .from(bioLinks)
      .where(and(eq(bioLinks.bio_page_id, bio.id), eq(bioLinks.is_active, true)))
      .orderBy(asc(bioLinks.sort_order));
    return { ...bio, links: pageLinks };
  },

  async getBioPageByWorkspace(workspaceId: string) {
    const [bio] = await pg.select().from(bioPages).where(eq(bioPages.workspace_id, workspaceId)).limit(1);
    if (!bio) return undefined;
    const pageLinks = await pg.select().from(bioLinks).where(eq(bioLinks.bio_page_id, bio.id)).orderBy(asc(bioLinks.sort_order));
    return { ...bio, links: pageLinks };
  },

  async recordBioPageView(bioPageId: string) {
    await pg.update(bioPages).set({ view_count: sql`${bioPages.view_count} + 1` }).where(eq(bioPages.id, bioPageId));
  },

  async recordBioLinkClick(bioLinkId: string) {
    await pg.update(bioLinks).set({ click_count: sql`${bioLinks.click_count} + 1` }).where(eq(bioLinks.id, bioLinkId));
  },

  async saveBioPage(workspaceId: string, data: {
    handle: string;
    title: string;
    bio: string;
    avatar_url: string;
    theme: string;
    social_links: Record<string, string>;
    links: Array<{ title: string; url: string; icon?: string; style?: string; animation?: string }>;
  }) {
    const existing = await this.getBioPageByWorkspace(workspaceId);
    const handle = data.handle.replace(/^@/, '');

    // Page update and link replacement succeed or fail together
    await pg.transaction(async (tx) => {
      let bioId = existing?.id;
      if (bioId) {
        await tx.update(bioPages).set({
          handle,
          title: data.title,
          bio: data.bio,
          avatar_url: data.avatar_url,
          theme: data.theme,
          social_links: data.social_links,
          updated_at: new Date(),
        }).where(eq(bioPages.id, bioId));
      } else {
        bioId = newId('bio', 10);
        await tx.insert(bioPages).values({
          id: bioId,
          workspace_id: workspaceId,
          handle,
          title: data.title,
          bio: data.bio,
          avatar_url: data.avatar_url,
          theme: data.theme,
          social_links: data.social_links,
        });
      }

      await tx.delete(bioLinks).where(eq(bioLinks.bio_page_id, bioId));
      if (data.links.length > 0) {
        await tx.insert(bioLinks).values(
          data.links.map((l, idx) => ({
            id: newId('bl', 10),
            bio_page_id: bioId!,
            title: l.title,
            url: l.url,
            icon: l.icon || 'link',
            style: l.style || 'glass',
            animation: l.animation || 'none',
            sort_order: idx,
          }))
        );
      }
    });

    return this.getBioPageByWorkspace(workspaceId);
  },

  // --- API keys ------------------------------------------------------------

  async getApiKeys(workspaceId: string): Promise<ApiKeyRecord[]> {
    return pg.select().from(apiKeys).where(eq(apiKeys.workspace_id, workspaceId)).orderBy(desc(apiKeys.created_at));
  },

  async createApiKey(workspaceId: string, createdBy: string, name: string) {
    const rawKey = `urls_live_${crypto.randomBytes(16).toString('hex')}`;
    const prefix = rawKey.slice(0, 14);
    const id = newId('key', 10);

    const [row] = await pg.insert(apiKeys).values({
      id,
      workspace_id: workspaceId,
      created_by: createdBy,
      name,
      key_hash: sha256(rawKey),
      key_prefix: prefix,
    }).returning();

    // The raw key is returned exactly once; only its hash is stored
    return { id, name, apiKey: rawKey, keyPrefix: prefix, key: toPublicApiKey(row) };
  },

  async deleteApiKey(id: string, workspaceId: string): Promise<boolean> {
    const deleted = await pg
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.workspace_id, workspaceId)))
      .returning({ id: apiKeys.id });
    return deleted.length > 0;
  },

  /** Returns the key's workspace and creator, or null if the key is invalid. */
  async verifyApiKey(rawKey: string): Promise<{ workspaceId: string; createdBy: string | null } | null> {
    const [key] = await pg
      .update(apiKeys)
      .set({ last_used_at: new Date() })
      .where(eq(apiKeys.key_hash, sha256(rawKey)))
      .returning({ workspaceId: apiKeys.workspace_id, createdBy: apiKeys.created_by });
    return key ?? null;
  },

  // --- Folders -------------------------------------------------------------

  /** Folders with the number of links in each. */
  async listFolders(workspaceId: string) {
    return pg
      .select({
        id: folders.id,
        name: folders.name,
        created_at: folders.created_at,
        link_count: sql<number>`count(${links.id})::int`,
      })
      .from(folders)
      .leftJoin(links, eq(links.folder_id, folders.id))
      .where(eq(folders.workspace_id, workspaceId))
      .groupBy(folders.id)
      .orderBy(asc(sql`lower(${folders.name})`));
  },

  async getFolder(id: string, workspaceId: string): Promise<FolderRecord | undefined> {
    const [row] = await pg.select().from(folders).where(and(eq(folders.id, id), eq(folders.workspace_id, workspaceId)));
    return row;
  },

  async createFolder(workspaceId: string, name: string): Promise<FolderRecord> {
    const [row] = await pg.insert(folders).values({ id: newId('fld'), workspace_id: workspaceId, name }).returning();
    return row;
  },

  async renameFolder(id: string, workspaceId: string, name: string): Promise<FolderRecord | undefined> {
    const [row] = await pg
      .update(folders)
      .set({ name })
      .where(and(eq(folders.id, id), eq(folders.workspace_id, workspaceId)))
      .returning();
    return row;
  },

  /** Links in the folder are kept and simply become unfiled. */
  async deleteFolder(id: string, workspaceId: string): Promise<boolean> {
    const deleted = await pg
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.workspace_id, workspaceId)))
      .returning({ id: folders.id });
    return deleted.length > 0;
  },

  // --- Users & sessions ----------------------------------------------------

  /**
   * Creates the user on first login (with a personal workspace) and refreshes
   * profile fields on later logins.
   */
  async upsertUser(data: {
    provider: AuthProvider;
    providerId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
  }): Promise<UserRecord> {
    const prefix = { google: 'usr_g_', telegram: 'usr_tg_', phone: 'usr_ph_' }[data.provider];
    const id = prefix + data.providerId;

    const [user] = await pg
      .insert(users)
      .values({
        id,
        provider: data.provider,
        provider_id: data.providerId,
        email: data.email ?? null,
        phone: data.phone ?? null,
        name: data.name,
        avatar_url: data.avatarUrl ?? null,
        role: data.role,
        last_login_at: new Date(),
      })
      .onConflictDoUpdate({
        target: [users.provider, users.provider_id],
        set: {
          email: sql`coalesce(excluded.email, ${users.email})`,
          phone: sql`coalesce(excluded.phone, ${users.phone})`,
          name: sql`excluded.name`,
          avatar_url: sql`coalesce(excluded.avatar_url, ${users.avatar_url})`,
          role: sql`excluded.role`,
          last_login_at: new Date(),
        },
      })
      .returning();

    await this.ensurePersonalWorkspace(user);
    return user;
  },

  async getUserById(id: string): Promise<UserRecord | undefined> {
    const [row] = await pg.select().from(users).where(eq(users.id, id));
    return row;
  },

  /** Creates a session and returns the raw token. Only its hash is stored. */
  async createSession(userId: string, maxAgeSeconds: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('base64url');
    await pg.insert(sessions).values({
      id: sha256(token),
      user_id: userId,
      expires_at: new Date(Date.now() + maxAgeSeconds * 1000),
    });
    return token;
  },

  async getUserBySessionToken(token: string): Promise<UserRecord | undefined> {
    const [row] = await pg
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.user_id))
      .where(and(eq(sessions.id, sha256(token)), gte(sessions.expires_at, sql`now()`)));
    return row?.user;
  },

  async deleteSession(token: string) {
    await pg.delete(sessions).where(eq(sessions.id, sha256(token)));
  },

  // --- Workspaces ----------------------------------------------------------

  async getWorkspace(id: string): Promise<WorkspaceRecord | undefined> {
    const [row] = await pg.select().from(workspaces).where(eq(workspaces.id, id));
    return row;
  },

  async listWorkspacesForUser(userId: string) {
    return pg
      .select({ workspace: workspaces, role: memberships.role })
      .from(memberships)
      .innerJoin(workspaces, eq(workspaces.id, memberships.workspace_id))
      .where(eq(memberships.user_id, userId))
      .orderBy(asc(memberships.created_at));
  },

  async getMembershipRole(workspaceId: string, userId: string): Promise<MemberRole | undefined> {
    const [row] = await pg
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.workspace_id, workspaceId), eq(memberships.user_id, userId)));
    return row?.role;
  },

  /** Every user owns a personal workspace, created on first login. */
  async ensurePersonalWorkspace(user: UserRecord): Promise<void> {
    const existing = await pg
      .select({ id: memberships.workspace_id })
      .from(memberships)
      .where(and(eq(memberships.user_id, user.id), eq(memberships.role, 'owner')))
      .limit(1);
    if (existing.length > 0) return;

    const workspaceId = newId('ws');
    await pg.transaction(async (tx) => {
      await tx.insert(workspaces).values({ id: workspaceId, name: user.name, slug: workspaceId });
      await tx.insert(memberships).values({ workspace_id: workspaceId, user_id: user.id, role: 'owner' });
    });
  },

  /** The read-only showcase workspace. Created empty if `npm run db:seed` hasn't run. */
  async getDemoWorkspace(): Promise<WorkspaceRecord> {
    await pg
      .insert(workspaces)
      .values({ id: DEMO_WORKSPACE_ID, name: 'ApexTech Solutions (Demo)', slug: 'demo', is_demo: true })
      .onConflictDoNothing();
    return (await this.getWorkspace(DEMO_WORKSPACE_ID))!;
  },
};
