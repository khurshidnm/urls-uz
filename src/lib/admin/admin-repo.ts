import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { bioPages, links, memberships, payments, qrCodes, userIdentities, users, workspaces } from '@/db/schema';
import { DEMO_WORKSPACE_ID, withEffectivePlan } from '@/lib/db';

/** Queries for the platform admin panel. The demo workspace is left out of every number. */

export type AdminUserSort = 'created' | 'seen' | 'clicks' | 'links' | 'paid';

const SORTS: Record<AdminUserSort, string> = {
  created: 'u.created_at desc',
  seen: 'coalesce(u.last_seen_at, u.last_login_at) desc nulls last',
  clicks: 'clicks desc',
  links: 'links desc',
  paid: 'last_payment_at desc nulls last',
};

export interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'user' | 'superadmin';
  created_at: Date;
  last_login_at: Date | null;
  last_seen_at: Date | null;
  providers: string[] | null;
  workspace_id: string | null;
  plan: 'free' | 'pro' | 'enterprise' | null;
  plan_expires_at: Date | null;
  links: number;
  clicks: number;
  last_payment_at: Date | null;
  total_paid: number;
}

export const adminRepo = {
  async platformStats() {
    const [row] = (
      await pg.execute(sql`
        select
          (select count(*)::int from users) as users_total,
          (select count(*)::int from users where created_at >= now() - interval '7 days') as users_new_7d,
          (select count(*)::int from users where created_at >= now() - interval '30 days') as users_new_30d,
          (select count(*)::int from users where coalesce(last_seen_at, last_login_at) >= now() - interval '7 days') as users_active_7d,
          (select count(*)::int from users where coalesce(last_seen_at, last_login_at) >= now() - interval '1 day') as users_active_1d,
          (select count(*)::int from workspaces
            where not is_demo and plan <> 'free' and (plan_expires_at is null or plan_expires_at > now())) as paid_workspaces,
          (select coalesce(sum(amount), 0)::bigint from payments) as revenue_total,
          (select coalesce(sum(amount), 0)::bigint from payments where created_at >= date_trunc('month', now())) as revenue_month,
          (select count(*)::int from links where workspace_id <> ${DEMO_WORKSPACE_ID}) as links_total,
          (select count(*)::int from links where workspace_id <> ${DEMO_WORKSPACE_ID} and created_at >= now() - interval '7 days') as links_new_7d,
          (select coalesce(sum(s.clicks), 0)::int from link_stats_daily s join links l on l.id = s.link_id
            where l.workspace_id <> ${DEMO_WORKSPACE_ID} and s.dimension = 'total'
              and s.day >= (now() at time zone 'Asia/Tashkent')::date - 6) as clicks_7d
      `)
    ).rows as Record<string, number | string>[];
    return {
      usersTotal: Number(row.users_total),
      usersNew7d: Number(row.users_new_7d),
      usersNew30d: Number(row.users_new_30d),
      usersActive7d: Number(row.users_active_7d),
      usersActive1d: Number(row.users_active_1d),
      paidWorkspaces: Number(row.paid_workspaces),
      revenueTotal: Number(row.revenue_total),
      revenueMonth: Number(row.revenue_month),
      linksTotal: Number(row.links_total),
      linksNew7d: Number(row.links_new_7d),
      clicks7d: Number(row.clicks_7d),
    };
  },

  /** Users with their personal workspace's plan, usage and payments. */
  async listUsers({ q = '', sort = 'created', limit = 50, offset = 0 }: { q?: string; sort?: AdminUserSort; limit?: number; offset?: number }) {
    const search = q.trim() ? `%${q.trim()}%` : null;
    const digits = q.replace(/\D/g, '');
    const where = search
      ? sql`where u.name ilike ${search} or u.email ilike ${search} or u.id = ${q.trim()}
          ${digits.length >= 4 ? sql`or regexp_replace(coalesce(u.phone, ''), '\\D', '', 'g') like ${`%${digits}%`}` : sql``}`
      : sql``;

    const [rows, [total]] = await Promise.all([
      pg.execute(sql`
        select u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_login_at, u.last_seen_at,
          (select array_agg(distinct i.provider::text) from user_identities i where i.user_id = u.id) as providers,
          w.id as workspace_id, w.plan, w.plan_expires_at,
          (select count(*)::int from links l where l.workspace_id = w.id) as links,
          (select coalesce(sum(l.click_count), 0)::int from links l where l.workspace_id = w.id) as clicks,
          (select max(p.created_at) from payments p where p.workspace_id = w.id) as last_payment_at,
          (select coalesce(sum(p.amount), 0)::int from payments p where p.workspace_id = w.id) as total_paid
        from users u
        left join lateral (
          select ws.* from memberships m join workspaces ws on ws.id = m.workspace_id
          where m.user_id = u.id and m.role = 'owner' and not ws.is_demo
          order by m.created_at limit 1
        ) w on true
        ${where}
        order by ${sql.raw(SORTS[sort] ?? SORTS.created)}
        limit ${limit} offset ${offset}`),
      pg.execute(sql`select count(*)::int as n from users u ${where}`).then((r) => r.rows as { n: number }[]),
    ]);
    const now = new Date();
    // Raw queries may return timestamps as text
    const toDate = (v: unknown) => (v === null || v === undefined ? null : v instanceof Date ? v : new Date(String(v)));
    return {
      total: Number(total.n),
      users: (rows.rows as unknown as AdminUserRow[]).map((raw) => ({
        ...raw,
        created_at: toDate(raw.created_at)!,
        last_login_at: toDate(raw.last_login_at),
        last_seen_at: toDate(raw.last_seen_at),
        plan_expires_at: toDate(raw.plan_expires_at),
        last_payment_at: toDate(raw.last_payment_at),
        links: Number(raw.links),
        clicks: Number(raw.clicks),
        total_paid: Number(raw.total_paid),
      })).map((u) => ({
        ...u,
        // A paid plan past its end date is shown as expired, like it behaves
        planExpired: u.plan !== null && u.plan !== 'free' && u.plan_expires_at !== null && u.plan_expires_at < now,
      })),
    };
  },

  async userDetail(userId: string) {
    const [user] = await pg.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const [identities, workspaceRows] = await Promise.all([
      pg.select().from(userIdentities).where(eq(userIdentities.user_id, userId)).orderBy(asc(userIdentities.created_at)),
      pg
        .select({ workspace: workspaces, role: memberships.role })
        .from(memberships)
        .innerJoin(workspaces, eq(workspaces.id, memberships.workspace_id))
        .where(and(eq(memberships.user_id, userId), eq(workspaces.is_demo, false)))
        .orderBy(asc(memberships.created_at)),
    ]);

    const workspaceDetails = await Promise.all(
      workspaceRows.map(async ({ workspace, role }) => {
        const [[usage], [qr], [bio], paymentRows, recentLinks] = await Promise.all([
          pg
            .select({
              links: sql<number>`count(*)::int`,
              clicks: sql<number>`coalesce(sum(${links.click_count}), 0)::int`,
              lastLinkAt: sql<Date | null>`max(${links.created_at})`,
            })
            .from(links)
            .where(eq(links.workspace_id, workspace.id)),
          pg.select({ n: sql<number>`count(*)::int` }).from(qrCodes).where(eq(qrCodes.workspace_id, workspace.id)),
          pg.select({ handle: bioPages.handle, views: bioPages.view_count }).from(bioPages).where(eq(bioPages.workspace_id, workspace.id)),
          pg.select().from(payments).where(eq(payments.workspace_id, workspace.id)).orderBy(desc(payments.created_at)),
          pg
            .select({ id: links.id, title: links.title, slug: links.slug, click_count: links.click_count, created_at: links.created_at })
            .from(links)
            .where(eq(links.workspace_id, workspace.id))
            .orderBy(desc(links.created_at))
            .limit(5),
        ]);
        const effective = withEffectivePlan(workspace);
        return {
          workspace,
          role,
          effectivePlan: effective.plan,
          usage: { links: usage.links, clicks: usage.clicks, lastLinkAt: usage.lastLinkAt, qrCodes: qr.n },
          bioPage: bio ?? null,
          payments: paymentRows,
          recentLinks,
        };
      })
    );

    return { user, identities, workspaces: workspaceDetails };
  },

  /** Most recent payments across the platform. */
  async recentPayments(limit = 10) {
    return pg
      .select({ payment: payments, workspaceName: workspaces.name })
      .from(payments)
      .innerJoin(workspaces, eq(workspaces.id, payments.workspace_id))
      .orderBy(desc(payments.created_at))
      .limit(limit);
  },
};
