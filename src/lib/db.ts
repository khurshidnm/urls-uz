import crypto from 'crypto';
import { and, asc, desc, eq, gte, ilike, inArray, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { pg } from '@/db/client';
import {
  apiKeys,
  bioLinks,
  bioPages,
  clicks,
  linkStatsDaily,
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

function timelineDays(range: AnalyticsRange): number {
  return RANGE_DAYS[range] ?? 90;
}

/** Today in Tashkent, as a SQL date. */
const todayInTashkent = sql`(now() at time zone 'Asia/Tashkent')::date`;

/** Daily totals within the range (the last N days including today); all days for 'all'. */
function statsSince(range: AnalyticsRange) {
  const days = RANGE_DAYS[range];
  return days === null ? undefined : gte(linkStatsDaily.day, sql`${todayInTashkent} - ${days - 1}::int`);
}

const statSum = sql<number>`coalesce(sum(${linkStatsDaily.clicks}), 0)::int`;
type StatDimension = (typeof linkStatsDaily.$inferSelect)['dimension'];

/**
 * Analytics from the daily totals: the cost depends on the number of days
 * and distinct values, not on how many clicks there were.
 */
async function statsReport(scope: SQL | undefined, range: AnalyticsRange) {
  const where = (dimension: StatDimension, since = statsSince(range)) => and(scope, since, eq(linkStatsDaily.dimension, dimension));
  const breakdown = (dimension: StatDimension, limit: number) =>
    pg
      .select({ value: linkStatsDaily.value, count: statSum })
      .from(linkStatsDaily)
      .innerJoin(links, eq(links.id, linkStatsDaily.link_id))
      .where(where(dimension))
      .groupBy(linkStatsDaily.value)
      .orderBy(desc(statSum))
      .limit(limit);

  const [[total], regions, countries, referrers, devices, os, timeline] = await Promise.all([
    pg.select({ n: statSum }).from(linkStatsDaily).innerJoin(links, eq(links.id, linkStatsDaily.link_id)).where(where('total')),
    breakdown('region', 14),
    breakdown('country', 12),
    breakdown('referer', 10),
    breakdown('device', 10),
    breakdown('os', 12),
    pg
      .select({ date: linkStatsDaily.day, count: statSum })
      .from(linkStatsDaily)
      .innerJoin(links, eq(links.id, linkStatsDaily.link_id))
      .where(where('total', gte(linkStatsDaily.day, sql`${todayInTashkent} - ${timelineDays(range) - 1}::int`)))
      .groupBy(linkStatsDaily.day)
      .orderBy(asc(linkStatsDaily.day)),
  ]);

  return {
    totalClicks: total.n,
    regions: regions.map((r) => ({ region: r.value, count: r.count })),
    countries: countries.map((r) => ({ country: r.value, count: r.count })),
    referrers: referrers.map((r) => ({ referer: r.value, count: r.count })),
    devices: devices.map((r) => ({ device_type: r.value, count: r.count })),
    os: os.map((r) => ({ os: r.value, count: r.count })),
    timeline: fillTimeline(timeline, range),
  };
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


/**
 * A paid plan past its end date acts as free. Applied wherever a workspace is
 * loaded, so plan limits, API access and the UI all follow it.
 */
export function withEffectivePlan(workspace: WorkspaceRecord): WorkspaceRecord {
  const expired = workspace.plan !== 'free' && workspace.plan_expires_at !== null && workspace.plan_expires_at < new Date();
  return expired ? { ...workspace, plan: 'free' } : workspace;
}

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
  qr_config?: LinkRecord['qr_config'];
  source?: LinkRecord['source'];
};

export interface LinkFilter {
  q?: string;
  status?: 'active' | 'archived' | 'all';
  tag?: string;
  /** Folder id, or 'none' for links outside any folder. */
  folder?: string;
  sort?: 'newest' | 'oldest' | 'clicks';
  limit: number;
  offset: number;
}

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

  /** Filtered, sorted, paginated links for the links table. */
  async queryLinks(workspaceId: string, filter: LinkFilter): Promise<{ links: LinkRecord[]; total: number }> {
    const conditions: (SQL | undefined)[] = [eq(links.workspace_id, workspaceId)];
    if (filter.status === 'active') conditions.push(eq(links.is_archived, false));
    if (filter.status === 'archived') conditions.push(eq(links.is_archived, true));
    if (filter.tag) conditions.push(sql`${links.tags} @> array[${filter.tag}]::text[]`);
    if (filter.folder === 'none') conditions.push(isNull(links.folder_id));
    else if (filter.folder) conditions.push(eq(links.folder_id, filter.folder));
    if (filter.q) {
      // Escape LIKE wildcards so a search for "50%" matches literally
      const pattern = `%${filter.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      conditions.push(
        or(
          ilike(links.title, pattern),
          ilike(links.slug, pattern),
          ilike(links.destination_url, pattern),
          sql`exists (select 1 from unnest(${links.tags}) t where t ilike ${pattern})`
        )
      );
    }
    const where = and(...conditions);
    const order =
      filter.sort === 'clicks' ? [desc(links.click_count), desc(links.created_at)]
      : filter.sort === 'oldest' ? [asc(links.created_at)]
      : [desc(links.created_at)];

    const [rows, [{ n }]] = await Promise.all([
      pg.select().from(links).where(where).orderBy(...order).limit(filter.limit).offset(filter.offset),
      pg.select({ n: count }).from(links).where(where),
    ]);
    return { links: rows, total: n };
  },

  /** Every tag used in the workspace, most used first. */
  async listTags(workspaceId: string): Promise<{ tag: string; count: number }[]> {
    const result = await pg.execute<{ tag: string; count: number }>(sql`
      select t as tag, count(*)::int as count
      from ${links}, unnest(${links.tags}) t
      where ${links.workspace_id} = ${workspaceId}
      group by t
      order by count desc, t asc
    `);
    return result.rows;
  },

  /** Deletes links in the workspace; ids from other workspaces are ignored. Returns the deleted ids. */
  async deleteLinks(ids: string[], workspaceId: string): Promise<string[]> {
    if (ids.length === 0) return [];
    const deleted = await pg
      .delete(links)
      .where(and(inArray(links.id, ids), eq(links.workspace_id, workspaceId)))
      .returning({ id: links.id });
    return deleted.map((d) => d.id);
  },

  /** Deletes links that were created for bio buttons; other links are left alone. */
  async deleteBioSourceLinks(ids: string[], workspaceId: string): Promise<void> {
    if (ids.length === 0) return;
    await pg
      .delete(links)
      .where(and(inArray(links.id, ids), eq(links.workspace_id, workspaceId), eq(links.source, 'bio')));
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
        qr_config: data.qr_config ?? null,
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

  async getAnalyticsOverview(workspaceId: string, range: AnalyticsRange = '30d') {
    const [report, [linkTotals], [bioTotals]] = await Promise.all([
      statsReport(eq(links.workspace_id, workspaceId), range),
      pg.select({ n: count }).from(links).where(eq(links.workspace_id, workspaceId)),
      pg.select({ n: sql<number>`coalesce(sum(${bioPages.view_count}), 0)::int` }).from(bioPages).where(eq(bioPages.workspace_id, workspaceId)),
    ]);
    const { totalClicks, ...breakdowns } = report;
    return { totalClicks, totalLinks: linkTotals.n, totalBioViews: bioTotals.n, ...breakdowns };
  },

  async getLinkAnalytics(linkId: string, range: AnalyticsRange = '30d') {
    const link = await this.getLinkById(linkId);
    if (!link) return null;

    const [report, recentClicks] = await Promise.all([
      statsReport(eq(linkStatsDaily.link_id, linkId), range),
      // The visit log reads raw clicks, which are kept for the plan's retention period
      pg.select().from(clicks).where(and(eq(clicks.link_id, linkId), clicksSince(range))).orderBy(desc(clicks.created_at)).limit(100),
    ]);

    return {
      link,
      ...report,
      totalClicks: range === 'all' ? link.click_count : report.totalClicks,
      clicks: recentClicks,
    };
  },

  async getPublicStats() {
    const realLink = ne(links.workspace_id, DEMO_WORKSPACE_ID);
    const lastWeek = sql`now() - interval '7 days'`;
    const joined = eq(links.id, clicks.link_id);

    const [[redirects], [redirects7], [linkCount], [links7], [userCount], [bioCount], recentClicks] = await Promise.all([
      pg.select({ n: sql<number>`coalesce(sum(${links.click_count}), 0)::int` }).from(links).where(realLink),
      pg.select({ n: statSum }).from(linkStatsDaily).innerJoin(links, eq(links.id, linkStatsDaily.link_id))
        .where(and(realLink, eq(linkStatsDaily.dimension, 'total'), gte(linkStatsDaily.day, sql`${todayInTashkent} - 6`))),
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

  /**
   * Bio buttons with their short link. `short_slug` is set only while the
   * link is active, so a disabled or deleted link falls back to the direct URL.
   */
  async getBioButtons(bioPageId: string, { activeOnly = false } = {}) {
    return pg
      .select({
        id: bioLinks.id,
        bio_page_id: bioLinks.bio_page_id,
        link_id: bioLinks.link_id,
        title: bioLinks.title,
        url: bioLinks.url,
        icon: bioLinks.icon,
        style: bioLinks.style,
        animation: bioLinks.animation,
        sort_order: bioLinks.sort_order,
        is_active: bioLinks.is_active,
        short_slug: sql<string | null>`case when ${links.is_active} then ${links.slug} end`,
        click_count: sql<number>`coalesce(${links.click_count}, ${bioLinks.click_count})::int`,
      })
      .from(bioLinks)
      .leftJoin(links, eq(links.id, bioLinks.link_id))
      .where(activeOnly ? and(eq(bioLinks.bio_page_id, bioPageId), eq(bioLinks.is_active, true)) : eq(bioLinks.bio_page_id, bioPageId))
      .orderBy(asc(bioLinks.sort_order));
  },

  async getBioPageByHandle(handle: string) {
    const clean = handle.replace(/^@/, '');
    const [bio] = await pg.select().from(bioPages).where(sql`lower(${bioPages.handle}) = lower(${clean})`);
    if (!bio) return undefined;
    return { ...bio, links: await this.getBioButtons(bio.id, { activeOnly: true }) };
  },

  async getBioPageByWorkspace(workspaceId: string) {
    const [bio] = await pg.select().from(bioPages).where(eq(bioPages.workspace_id, workspaceId)).limit(1);
    if (!bio) return undefined;
    return { ...bio, links: await this.getBioButtons(bio.id) };
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
    links: Array<{ id?: string; link_id?: string | null; title: string; url: string; icon?: string; style?: string; animation?: string }>;
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
            // Keeping ids stable keeps each button attached to its short link
            id: l.id ?? newId('bl', 10),
            bio_page_id: bioId!,
            link_id: l.link_id ?? null,
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
    const user = row?.user;
    // Activity for the admin panel, written at most once an hour per user
    if (user && (!user.last_seen_at || Date.now() - user.last_seen_at.getTime() > 60 * 60 * 1000)) {
      await pg.update(users).set({ last_seen_at: new Date() }).where(eq(users.id, user.id));
    }
    return user;
  },

  async deleteSession(token: string) {
    await pg.delete(sessions).where(eq(sessions.id, sha256(token)));
  },

  // --- Workspaces ----------------------------------------------------------

  async getWorkspace(id: string): Promise<WorkspaceRecord | undefined> {
    const [row] = await pg.select().from(workspaces).where(eq(workspaces.id, id));
    return row && withEffectivePlan(row);
  },

  async listWorkspacesForUser(userId: string) {
    return pg
      .select({ workspace: workspaces, role: memberships.role })
      .from(memberships)
      .innerJoin(workspaces, eq(workspaces.id, memberships.workspace_id))
      .where(eq(memberships.user_id, userId))
      .orderBy(asc(memberships.created_at))
      .then((rows) => rows.map((r) => ({ ...r, workspace: withEffectivePlan(r.workspace) })));
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
