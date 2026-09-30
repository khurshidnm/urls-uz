/**
 * One-off import of the old SQLite database (data/urls.db) into Postgres.
 *
 *   npm run db:import-sqlite [path/to/urls.db]
 *
 * - Users are imported with a personal workspace; their links, clicks, bio
 *   page and API keys go into it.
 * - Links whose owner has no account (created by the old, fake login) are put
 *   in one "Legacy links" workspace with no members, so short links that are
 *   already shared keep redirecting.
 * - The old demo_user data is skipped; run `npm run db:seed` for the demo.
 * - Sessions are not imported; everyone logs in again.
 *
 * Safe to re-run: existing rows are left untouched.
 */
import Database from 'better-sqlite3';
import { pg, pool } from '../src/db/client';
import { apiKeys, bioLinks, bioPages, clicks, links, users, workspaces } from '../src/db/schema';
import { db, hashLinkPassword } from '../src/lib/db';

const LEGACY_WORKSPACE_ID = 'ws_legacy';
const sqlitePath = process.argv[2] || 'data/urls.db';

type Row = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
const bool = (v: unknown) => v === 1 || v === true || v === '1';
/** SQLite CURRENT_TIMESTAMP values are UTC without a zone marker. */
const date = (v: unknown) => (v ? new Date(String(v).replace(' ', 'T') + (String(v).includes('Z') ? '' : 'Z')) : null);

function tableExists(sqlite: Database.Database, name: string) {
  return Boolean(sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?").get(name));
}

async function main() {
  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const workspaceForOwner = new Map<string, string>();

  // 1. Users (only the new OAuth-style table has real accounts)
  const userCols = tableExists(sqlite, 'users')
    ? (sqlite.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name)
    : [];
  const sqliteUsers = userCols.includes('provider') ? (sqlite.prepare('SELECT * FROM users').all() as Row[]) : [];

  for (const u of sqliteUsers) {
    await pg.insert(users).values({
      id: String(u.id),
      provider: u.provider as 'google' | 'telegram' | 'phone',
      provider_id: String(u.provider_id),
      email: str(u.email),
      phone: str(u.phone),
      name: String(u.name),
      avatar_url: str(u.avatar_url),
      role: u.role === 'superadmin' ? 'superadmin' : 'user',
      created_at: date(u.created_at) ?? new Date(),
      last_login_at: date(u.last_login_at),
    }).onConflictDoNothing();

    const user = (await db.getUserById(String(u.id)))!;
    await db.ensurePersonalWorkspace(user);
    const [membership] = await db.listWorkspacesForUser(user.id);
    workspaceForOwner.set(user.id, membership.workspace.id);
  }

  async function resolveWorkspace(ownerId: string): Promise<string | null> {
    if (ownerId === 'demo_user') return null;
    const known = workspaceForOwner.get(ownerId);
    if (known) return known;

    await pg.insert(workspaces).values({ id: LEGACY_WORKSPACE_ID, name: 'Legacy links', slug: 'legacy' }).onConflictDoNothing();
    workspaceForOwner.set(ownerId, LEGACY_WORKSPACE_ID);
    return LEGACY_WORKSPACE_ID;
  }

  // 2. Links and their clicks
  const sqliteLinks = sqlite.prepare('SELECT * FROM links').all() as Row[];
  let importedLinks = 0;
  let importedClicks = 0;
  const importedLinkIds = new Set<string>();

  for (const l of sqliteLinks) {
    const workspaceId = await resolveWorkspace(String(l.user_id ?? 'demo_user'));
    if (!workspaceId) continue;

    const password = str(l.password);
    const inserted = await pg.insert(links).values({
      id: String(l.id),
      workspace_id: workspaceId,
      created_by: workspaceForOwner.has(String(l.user_id)) && workspaceId !== LEGACY_WORKSPACE_ID ? String(l.user_id) : null,
      title: String(l.title),
      destination_url: String(l.destination_url),
      slug: String(l.slug),
      is_active: bool(l.is_active ?? 1),
      is_archived: bool(l.is_archived ?? 0),
      tags: str(l.tags) ?? '',
      // Very old rows may still hold a plain-text password
      password: password ? (password.startsWith('scrypt$') ? password : hashLinkPassword(password)) : null,
      expires_at: date(l.expires_at),
      click_limit: l.click_limit ? Number(l.click_limit) : null,
      click_count: Number(l.click_count ?? 0),
      utm_source: str(l.utm_source),
      utm_medium: str(l.utm_medium),
      utm_campaign: str(l.utm_campaign),
      utm_term: str(l.utm_term),
      utm_content: str(l.utm_content),
      ios_url: str(l.ios_url),
      android_url: str(l.android_url),
      huawei_url: str(l.huawei_url),
      desktop_url: str(l.desktop_url),
      open_in_app: bool(l.open_in_app),
      created_at: date(l.created_at) ?? new Date(),
      updated_at: date(l.updated_at) ?? new Date(),
    }).onConflictDoNothing().returning({ id: links.id });

    if (inserted.length > 0) importedLinks++;
    importedLinkIds.add(String(l.id));
  }

  const sqliteClicks = sqlite.prepare('SELECT * FROM clicks').all() as Row[];
  const clickBatch = sqliteClicks
    .filter((c) => importedLinkIds.has(String(c.link_id)))
    .map((c) => ({
      id: String(c.id),
      link_id: String(c.link_id),
      ip_hash: str(c.ip_hash),
      referer: str(c.referer) ?? 'Direct',
      country: str(c.country) ?? 'Unknown',
      region: str(c.region) ?? 'Unknown',
      city: str(c.city) ?? 'Unknown',
      device_type: str(c.device_type) ?? 'Unknown',
      os: str(c.os) ?? 'Unknown',
      browser: str(c.browser) ?? 'Unknown',
      created_at: date(c.created_at) ?? new Date(),
    }));
  for (let i = 0; i < clickBatch.length; i += 1000) {
    const inserted = await pg.insert(clicks).values(clickBatch.slice(i, i + 1000)).onConflictDoNothing().returning({ id: clicks.id });
    importedClicks += inserted.length;
  }

  // 3. Bio pages (legacy owners' pages go to the legacy workspace too)
  let importedBioPages = 0;
  for (const b of sqlite.prepare('SELECT * FROM bio_pages').all() as Row[]) {
    const workspaceId = await resolveWorkspace(String(b.user_id ?? 'demo_user'));
    if (!workspaceId) continue;

    let social: Record<string, string> = {};
    try {
      social = JSON.parse(String(b.social_links || '{}'));
    } catch {}

    const inserted = await pg.insert(bioPages).values({
      id: String(b.id),
      workspace_id: workspaceId,
      handle: String(b.handle),
      title: String(b.title),
      bio: str(b.bio) ?? '',
      avatar_url: str(b.avatar_url) ?? '',
      theme: str(b.theme) ?? 'midnight',
      verified: bool(b.verified),
      social_links: social,
      view_count: Number(b.view_count ?? 0),
      created_at: date(b.created_at) ?? new Date(),
      updated_at: date(b.updated_at) ?? new Date(),
    }).onConflictDoNothing().returning({ id: bioPages.id });
    if (inserted.length === 0) continue;
    importedBioPages++;

    const pageLinks = sqlite.prepare('SELECT * FROM bio_links WHERE bio_page_id = ?').all(b.id) as Row[];
    if (pageLinks.length > 0) {
      await pg.insert(bioLinks).values(pageLinks.map((bl) => ({
        id: String(bl.id),
        bio_page_id: String(b.id),
        title: String(bl.title),
        url: String(bl.url),
        icon: str(bl.icon) ?? 'link',
        style: str(bl.style) ?? 'glass',
        animation: str(bl.animation) ?? 'none',
        click_count: Number(bl.click_count ?? 0),
        sort_order: Number(bl.sort_order ?? 0),
        is_active: bool(bl.is_active ?? 1),
      }))).onConflictDoNothing();
    }
  }

  // 4. API keys (only for real accounts; legacy keys were never tied to a user)
  let importedKeys = 0;
  for (const k of sqlite.prepare('SELECT * FROM api_keys').all() as Row[]) {
    const workspaceId = workspaceForOwner.get(String(k.user_id));
    if (!workspaceId || workspaceId === LEGACY_WORKSPACE_ID) continue;
    const inserted = await pg.insert(apiKeys).values({
      id: String(k.id),
      workspace_id: workspaceId,
      created_by: String(k.user_id),
      name: String(k.name),
      key_hash: String(k.key_hash),
      key_prefix: String(k.key_prefix),
      created_at: date(k.created_at) ?? new Date(),
      last_used_at: date(k.last_used_at),
    }).onConflictDoNothing().returning({ id: apiKeys.id });
    importedKeys += inserted.length;
  }

  sqlite.close();
  console.log(
    `Imported ${sqliteUsers.length} users, ${importedLinks} links, ${importedClicks} clicks, ` +
      `${importedBioPages} bio pages, ${importedKeys} API keys.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
