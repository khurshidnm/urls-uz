import { and, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { pg } from '@/db/client';
import { clicks, links, linkStatsDaily } from '@/db/schema';
import { newId, type Executor } from '@/lib/db';

/**
 * Recording clicks. Redirects never wait for this: clicks are collected in
 * memory and written in batches (one insert, one counter update per link,
 * one upsert of the daily totals), so a viral link doesn't queue its
 * visitors on a single row lock. Only links with a click limit are counted
 * synchronously, because the limit has to be exact.
 */

export interface ClickData {
  link_id: string;
  ip_hash: string;
  referer: string;
  country: string;
  region: string;
  city: string;
  device_type: string;
  os: string;
  browser: string;
  created_at: Date;
}

const FLUSH_MS = Number(process.env.CLICK_FLUSH_MS ?? 1000);
const MAX_BATCH = 500;

const tashkentDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });

/** The daily-total rows a batch of clicks adds to. */
function statIncrements(batch: ClickData[]) {
  const totals = new Map<string, { link_id: string; day: string; dimension: StatDimension; value: string; clicks: number }>();
  const add = (click: ClickData, day: string, dimension: StatDimension, value: string) => {
    const key = `${click.link_id}|${day}|${dimension}|${value}`;
    const row = totals.get(key);
    if (row) row.clicks++;
    else totals.set(key, { link_id: click.link_id, day, dimension, value, clicks: 1 });
  };
  for (const click of batch) {
    const day = tashkentDay.format(click.created_at);
    add(click, day, 'total', '');
    if (click.country === 'UZ') add(click, day, 'region', click.region);
    add(click, day, 'country', click.country);
    add(click, day, 'referer', click.referer);
    add(click, day, 'device', click.device_type);
    add(click, day, 'os', click.os);
    add(click, day, 'browser', click.browser);
  }
  // A fixed order, so concurrent writers lock rows in the same order and can't deadlock
  return [...totals.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, row]) => row);
}

type StatDimension = (typeof linkStatsDaily.$inferInsert)['dimension'];

/** Inserts raw clicks and adds them to the daily totals; with `countLinks`, also to links.click_count. */
async function writeClicks(exec: Executor, batch: ClickData[], { countLinks }: { countLinks: boolean }) {
  if (batch.length === 0) return;
  await exec.insert(clicks).values(batch.map((c) => ({ id: newId('click'), ...c })));

  if (countLinks) {
    const perLink = new Map<string, number>();
    for (const c of batch) perLink.set(c.link_id, (perLink.get(c.link_id) ?? 0) + 1);
    const rows = [...perLink.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
    await exec.execute(sql`
      update links set click_count = links.click_count + v.n
      from (values ${sql.join(rows.map(([id, n]) => sql`(${id}, ${n}::int)`), sql`, `)}) as v(id, n)
      where links.id = v.id`);
  }

  await exec
    .insert(linkStatsDaily)
    .values(statIncrements(batch))
    .onConflictDoUpdate({
      target: [linkStatsDaily.link_id, linkStatsDaily.day, linkStatsDaily.dimension, linkStatsDaily.value],
      set: { clicks: sql`${linkStatsDaily.clicks} + excluded.clicks` },
    });
}

/**
 * A click on a link with a click limit: counted right away, within the limit.
 * Returns false when the limit was already reached.
 */
export async function recordLimitedClick(click: ClickData): Promise<boolean> {
  return pg.transaction(async (tx) => {
    const updated = await tx
      .update(links)
      .set({ click_count: sql`${links.click_count} + 1` })
      .where(and(eq(links.id, click.link_id), or(isNull(links.click_limit), lt(links.click_count, links.click_limit))))
      .returning({ id: links.id });
    if (updated.length === 0) return false;
    await writeClicks(tx, [click], { countLinks: false });
    return true;
  });
}

// ---------------------------------------------------------------------------
// Batching
// ---------------------------------------------------------------------------

type Pending = { click: ClickData; done: () => void };

interface ClickBuffer {
  pending: Pending[];
  timer: ReturnType<typeof setTimeout> | null;
  /** Batches are written one at a time. */
  writing: Promise<void>;
}

// One buffer per server process (kept across hot reloads in development)
const globalBuffer = globalThis as unknown as { __urlsClickBuffer?: ClickBuffer };
const buffer: ClickBuffer = (globalBuffer.__urlsClickBuffer ??= { pending: [], timer: null, writing: Promise.resolve() });

/**
 * Queues a click. The promise settles once the click is written, so callers
 * running in `after()` keep a serverless function alive until then.
 */
export function enqueueClick(click: ClickData): Promise<void> {
  return new Promise((resolve) => {
    buffer.pending.push({ click, done: resolve });
    if (buffer.pending.length >= MAX_BATCH) flushClicks();
    else buffer.timer ??= setTimeout(flushClicks, FLUSH_MS);
  });
}

/** Writes everything queued so far. */
export function flushClicks(): Promise<void> {
  if (buffer.timer) clearTimeout(buffer.timer);
  buffer.timer = null;
  const batch = buffer.pending.splice(0);
  if (batch.length === 0) return buffer.writing;

  buffer.writing = buffer.writing.then(async () => {
    const data = batch.map((p) => p.click);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await pg.transaction((tx) => writeClicks(tx, data, { countLinks: true }));
        break;
      } catch (err) {
        // Analytics must never take redirects down: log and, after a retry, drop the batch
        console.error(`[clicks] writing ${data.length} clicks failed (attempt ${attempt}):`, err);
      }
    }
    batch.forEach((p) => p.done());
  });
  return buffer.writing;
}

/**
 * Recomputes the daily totals of some links from their raw clicks (demo
 * seed, imports). Only valid while the raw clicks haven't been pruned.
 */
export async function rebuildLinkStats(exec: Executor, linkIds: string[]) {
  if (linkIds.length === 0) return;
  await exec.delete(linkStatsDaily).where(inArray(linkStatsDaily.link_id, linkIds));
  await exec.execute(sql`
    insert into link_stats_daily (link_id, day, dimension, value, clicks)
    select link_id, (created_at at time zone 'Asia/Tashkent')::date, d.dimension::stat_dimension, d.value, count(*)::int
    from clicks
    cross join lateral (values
      ('total', ''),
      ('region', case when country = 'UZ' then region end),
      ('country', country),
      ('referer', referer),
      ('device', device_type),
      ('os', os),
      ('browser', browser)
    ) as d(dimension, value)
    where d.value is not null and link_id in (${sql.join(linkIds.map((id) => sql`${id}`), sql`, `)})
    group by 1, 2, 3, 4`);
}
