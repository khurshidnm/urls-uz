import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface DeviceRoutingConfig {
  iosUrl?: string;          // App Store yoki iOS Universal Link (apps.apple.com/...)
  androidUrl?: string;      // Google Play yoki Android Intent/App Link (play.google.com/...)
  huaweiUrl?: string;       // Huawei AppGallery linki (appgallery.huawei.com/...)
  desktopUrl?: string;      // Windows / macOS / Linux uchun veb-sayt
  fallbackUrl: string;      // Qolgan barcha holatlar uchun asosiy URL
}

export interface LinkRecord {
  id: string;
  user_id: string;
  title: string;
  destination_url: string;
  slug: string;
  is_active: number;
  password?: string | null;
  expires_at?: string | null;
  click_limit?: number | null;
  click_count: number;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  ios_url?: string | null;
  android_url?: string | null;
  huawei_url?: string | null;
  desktop_url?: string | null;
  open_in_app: number;
  tags?: string;
  is_archived?: number;
  created_at: string;
  updated_at: string;
}

export interface ClickRecord {
  id: string;
  link_id: string;
  ip_hash: string;
  referer: string;
  country: string;
  region: string;
  city: string;
  device_type: string;
  os: string;
  browser: string;
  created_at: string;
}

export interface BioPageRecord {
  id: string;
  user_id: string;
  handle: string;
  title: string;
  bio: string;
  avatar_url: string;
  theme: string;
  verified: number;
  social_links: string; // JSON string
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BioLinkRecord {
  id: string;
  bio_page_id: string;
  title: string;
  url: string;
  icon: string;
  style: string;
  animation: string;
  click_count: number;
  sort_order: number;
  is_active: number;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string | null;
}

export type AuthProvider = 'google' | 'telegram' | 'phone';
export type UserRole = 'user' | 'superadmin';

export interface UserRecord {
  id: string;
  provider: AuthProvider;
  provider_id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  last_login_at: string | null;
}

/** Link as exposed to clients: the password hash never leaves the server. */
export type PublicLink = Omit<LinkRecord, 'password'> & { has_password: boolean };

/** API key as exposed to clients: never includes the key hash. */
export type PublicApiKey = Omit<ApiKeyRecord, 'key_hash'>;

export function toPublicApiKey(key: ApiKeyRecord): PublicApiKey {
  const { id, user_id, name, key_prefix, created_at, last_used_at } = key;
  return { id, user_id, name, key_prefix, created_at, last_used_at };
}

export function toPublicLink(link: LinkRecord): PublicLink {
  const { password, ...rest } = link;
  return { ...rest, has_password: Boolean(password) };
}

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

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Global database instance caching for Next.js hot-reloading
const globalForDb = global as unknown as { db: Database.Database | undefined };

function getDatabase(): Database.Database {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'urls.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.pragma('foreign_keys = ON');

  // The original `users` table (email + password_hash) was never written to.
  // Move it aside so the OAuth-based schema below can be created.
  const legacyUserCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (legacyUserCols.some((c) => c.name === 'password_hash')) {
    db.exec('ALTER TABLE users RENAME TO users_legacy');
  }

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      plan TEXT NOT NULL DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      UNIQUE (provider, provider_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo_user',
      title TEXT NOT NULL,
      destination_url TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      tags TEXT DEFAULT '',
      password TEXT,
      expires_at DATETIME,
      click_limit INTEGER,
      click_count INTEGER DEFAULT 0,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_term TEXT,
      utm_content TEXT,
      ios_url TEXT,
      android_url TEXT,
      huawei_url TEXT,
      desktop_url TEXT,
      open_in_app INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id TEXT PRIMARY KEY,
      link_id TEXT NOT NULL,
      ip_hash TEXT,
      referer TEXT DEFAULT 'Direct',
      country TEXT DEFAULT 'UZ',
      region TEXT DEFAULT 'Toshkent shahri',
      city TEXT DEFAULT 'Toshkent',
      device_type TEXT DEFAULT 'mobile',
      os TEXT DEFAULT 'iOS',
      browser TEXT DEFAULT 'Safari',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bio_pages (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo_user',
      handle TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      theme TEXT DEFAULT 'midnight',
      verified INTEGER DEFAULT 1,
      social_links TEXT DEFAULT '{}',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bio_links (
      id TEXT PRIMARY KEY,
      bio_page_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT 'link',
      style TEXT DEFAULT 'glass',
      animation TEXT DEFAULT 'none',
      click_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (bio_page_id) REFERENCES bio_pages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qr_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo_user',
      link_id TEXT,
      name TEXT NOT NULL,
      destination_url TEXT NOT NULL,
      foreground_color TEXT DEFAULT '#0f172a',
      background_color TEXT DEFAULT '#ffffff',
      corner_style TEXT DEFAULT 'rounded',
      center_logo TEXT DEFAULT 'telegram',
      frame_text TEXT DEFAULT 'SCAN ME',
      frame_style TEXT DEFAULT 'bottom',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo_user',
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
    CREATE INDEX IF NOT EXISTS idx_clicks_link ON clicks(link_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_created ON clicks(created_at);
    CREATE INDEX IF NOT EXISTS idx_bio_handle ON bio_pages(handle);
    CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  // Run dynamic schema migrations for existing databases
  try { db.exec("ALTER TABLE links ADD COLUMN tags TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE links ADD COLUMN is_archived INTEGER DEFAULT 0"); } catch {}
  try { db.exec("ALTER TABLE links ADD COLUMN huawei_url TEXT"); } catch {}
  try { db.exec("ALTER TABLE links ADD COLUMN desktop_url TEXT"); } catch {}

  // Hash any link passwords that were stored in plain text
  const plainPasswords = db
    .prepare("SELECT id, password FROM links WHERE password IS NOT NULL AND password != '' AND password NOT LIKE 'scrypt$%'")
    .all() as { id: string; password: string }[];
  const setPassword = db.prepare('UPDATE links SET password = ? WHERE id = ?');
  for (const row of plainPasswords) {
    setPassword.run(hashLinkPassword(row.password), row.id);
  }

  // Telegram bot and Telegram web login now share one user id format
  db.exec("UPDATE links SET user_id = 'usr_' || user_id WHERE user_id LIKE 'tg\\_%' ESCAPE '\\'");

  // Seed default demonstration records if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM links');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    seedDemoData(db);
  }

  globalForDb.db = db;
  return db;
}

function seedDemoData(db: Database.Database) {
  const insertLink = db.prepare(`
    INSERT OR REPLACE INTO links (
      id, user_id, title, destination_url, slug, click_count, open_in_app,
      utm_source, utm_medium, utm_campaign,
      ios_url, android_url, huawei_url, desktop_url,
      password, tags
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLink.run(
    'demo_1',
    'demo_user',
    '📱 ApexPay Mobil Ilova (Universal Deep Link)',
    'https://apextech.uz/download',
    'apex-app',
    3840,
    0,
    null,
    null,
    null,
    'https://apps.apple.com/uz/app/apexpay/id15243890',
    'https://play.google.com/store/apps/details?id=uz.apexpay.android',
    'https://appgallery.huawei.com/app/C10459201',
    'https://apextech.uz/web-app',
    null,
    'Fintech, Ilova, Mobile'
  );

  insertLink.run(
    'demo_2',
    'demo_user',
    '🤖 Rasmiy Telegram Bot & Hamjamiyat',
    'https://t.me/apextech_bot',
    'tg-bot',
    2450,
    1,
    'telegram',
    'channel',
    'community_growth',
    null,
    null,
    null,
    null,
    null,
    'Telegram, Bot'
  );

  insertLink.run(
    'demo_3',
    'demo_user',
    '🔒 Investorlar Uchun Yillik Hisobot 2025',
    'https://apextech.uz/ir/annual-report-2025.pdf',
    'investor-report',
    620,
    0,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    hashLinkPassword('investor2025'),
    'Investor, Maxfiy'
  );

  insertLink.run(
    'demo_4',
    'demo_user',
    '🚀 Bahorgi Keshbek & Promo Aksiya',
    'https://apextech.uz/promotions/spring-cashback',
    'bahor-promo',
    1890,
    0,
    'instagram',
    'stories',
    'navruz_cashback',
    null,
    null,
    null,
    null,
    null,
    'Marketing, Promo'
  );

  insertLink.run(
    'demo_5',
    'demo_user',
    '💼 ApexTech Karyera & Ochiq Vakansiyalar',
    'https://careers.apextech.uz',
    'vakansiyalar',
    730,
    0,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'HR, Ish'
  );

  insertLink.run(
    'demo_6',
    'demo_user',
    '⚡ API & Integratsiya Dasturchilar Markazi',
    'https://docs.apextech.uz/v2/api',
    'api-docs',
    1120,
    0,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'Dev, API'
  );

  // Seed clicks across Uzbekistan regions
  const insertClick = db.prepare(`
    INSERT INTO clicks (id, link_id, ip_hash, referer, country, region, city, device_type, os, browser, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const regions = [
    { name: 'Toshkent shahri', weight: 45 },
    { name: 'Samarqand', weight: 15 },
    { name: 'Farg‘ona', weight: 10 },
    { name: 'Andijon', weight: 8 },
    { name: 'Buxoro', weight: 7 },
    { name: 'Namangan', weight: 5 },
    { name: 'Qashqadaryo', weight: 4 },
    { name: 'Xorazm', weight: 3 },
    { name: 'Navoiy', weight: 2 },
    { name: 'Surxondaryo', weight: 1 },
  ];

  const referrers = ['Telegram', 'Instagram', 'Direct', 'Google', 'YouTube'];
  const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
  const osList = ['iOS', 'Android', 'Android', 'macOS', 'Windows'];

  const demoLinkIds = ['demo_1', 'demo_2', 'demo_3', 'demo_4', 'demo_5', 'demo_6'];

  let clickId = 1;
  for (const reg of regions) {
    for (let i = 0; i < reg.weight; i++) {
      const ref = referrers[i % referrers.length];
      const dev = devices[i % devices.length];
      const os = osList[i % osList.length];
      const timeOffset = `-${(i % 14)} days`;
      const linkId = demoLinkIds[i % demoLinkIds.length];
      insertClick.run(
        `click_${clickId++}`,
        linkId,
        `hash_${clickId}`,
        ref,
        'UZ',
        reg.name,
        reg.name,
        dev,
        os,
        dev === 'mobile' ? (os === 'iOS' ? 'Safari' : 'Chrome') : 'Chrome',
        timeOffset
      );
    }
  }

  // Seed International Clicks
  const globalCountries = [
    { code: 'RU', region: 'Moskva', city: 'Moscow', weight: 22 },
    { code: 'KZ', region: 'Almati', city: 'Almaty', weight: 14 },
    { code: 'TR', region: 'Istanbul', city: 'Istanbul', weight: 11 },
    { code: 'US', region: 'California', city: 'Los Angeles', weight: 8 },
    { code: 'AE', region: 'Dubay', city: 'Dubai', weight: 7 },
    { code: 'KR', region: 'Seul', city: 'Seoul', weight: 5 },
    { code: 'DE', region: 'Berlin', city: 'Berlin', weight: 4 },
  ];

  for (const gc of globalCountries) {
    for (let i = 0; i < gc.weight; i++) {
      const ref = referrers[i % referrers.length];
      const dev = devices[i % devices.length];
      const os = osList[i % osList.length];
      const timeOffset = `-${(i % 10)} days`;
      const linkId = demoLinkIds[i % demoLinkIds.length];
      insertClick.run(
        `click_${clickId++}`,
        linkId,
        `hash_${clickId}`,
        ref,
        gc.code,
        gc.region,
        gc.city,
        dev,
        os,
        'Chrome',
        timeOffset
      );
    }
  }

  // Seed Bio Page
  const insertBio = db.prepare(`
    INSERT OR REPLACE INTO bio_pages (id, user_id, handle, title, bio, avatar_url, theme, verified, social_links, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBio.run(
    'bio_1',
    'demo_user',
    'apextech',
    'ApexTech Solutions',
    'O‘zbekistondagi yetakchi fintex ekotizimi · Tezkor to‘lovlar, biznes xizmatlari va raqamli innovatsiyalar 🚀',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    'midnight',
    1,
    JSON.stringify({
      telegram: 'apextech_uz',
      instagram: 'apextech.uz',
      youtube: '@apextech',
      website: 'https://apextech.uz',
      github: 'apextech'
    }),
    4120
  );

  const insertBioLink = db.prepare(`
    INSERT OR REPLACE INTO bio_links (id, bio_page_id, title, url, icon, style, animation, click_count, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBioLink.run('bl_1', 'bio_1', '📱 ApexPay Mobil Ilovasi', 'https://apextech.uz/download', 'smartphone', 'solid', 'none', 1840, 1);
  insertBioLink.run('bl_2', 'bio_1', '💳 Biznes Uchun To‘lovlar', 'https://apextech.uz/business', 'zap', 'glass', 'none', 1210, 2);
  insertBioLink.run('bl_3', 'bio_1', '💼 Vakansiyalar va Jamoa', 'https://careers.apextech.uz', 'file', 'glass', 'none', 840, 3);
  insertBioLink.run('bl_4', 'bio_1', '📞 24/7 Qo‘llab-quvvatlash', 'https://t.me/apextech_support', 'phone', 'glass', 'none', 630, 4);

  // Seed a display-only demo API key: the stored hash matches no real key,
  // so it can never authenticate.
  db.prepare(`
    INSERT OR REPLACE INTO api_keys (id, user_id, name, key_hash, key_prefix)
    VALUES (?, ?, ?, ?, ?)
  `).run('key_1', 'demo_user', 'Production App Key', sha256(crypto.randomBytes(32).toString('hex')), 'urls_live_9f83');
}

export const db = {
  getLinkBySlug(slug: string): LinkRecord | undefined {
    const stmt = getDatabase().prepare('SELECT * FROM links WHERE slug = ? AND is_active = 1');
    return stmt.get(slug) as LinkRecord | undefined;
  },

  getLinkById(id: string): LinkRecord | undefined {
    const stmt = getDatabase().prepare('SELECT * FROM links WHERE id = ?');
    return stmt.get(id) as LinkRecord | undefined;
  },

  /** Returns the link only if it belongs to `userId`. */
  getOwnedLink(id: string, userId: string): LinkRecord | undefined {
    const stmt = getDatabase().prepare('SELECT * FROM links WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as LinkRecord | undefined;
  },

  getAllLinks(userId: string): LinkRecord[] {
    const stmt = getDatabase().prepare('SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as LinkRecord[];
  },

  createLink(data: {
    title: string;
    destination_url: string;
    slug: string;
    userId?: string;
    password?: string | null;
    expires_at?: string | null;
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
    tags?: string;
    is_archived?: number;
  }): LinkRecord {
    const id = 'link_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const stmt = getDatabase().prepare(`
      INSERT INTO links (
        id, user_id, title, destination_url, slug, password, expires_at,
        click_limit, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        ios_url, android_url, huawei_url, desktop_url, open_in_app, tags, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.userId || 'demo_user',
      data.title,
      data.destination_url,
      data.slug,
      data.password ? hashLinkPassword(data.password) : null,
      data.expires_at || null,
      data.click_limit || null,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      data.utm_term || null,
      data.utm_content || null,
      data.ios_url || null,
      data.android_url || null,
      data.huawei_url || null,
      data.desktop_url || null,
      data.open_in_app ? 1 : 0,
      data.tags || '',
      data.is_archived ? 1 : 0
    );

    return this.getLinkById(id)!;
  },

  /** Updates a link owned by `userId`. Returns undefined if it doesn't exist or isn't theirs. */
  updateLink(id: string, userId: string, data: Partial<LinkRecord>): LinkRecord | undefined {
    if (!this.getOwnedLink(id, userId)) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.destination_url !== undefined) { fields.push('destination_url = ?'); values.push(data.destination_url); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (data.is_archived !== undefined) { fields.push('is_archived = ?'); values.push(data.is_archived ? 1 : 0); }
    if (data.tags !== undefined) { fields.push('tags = ?'); values.push(data.tags); }
    if (data.password !== undefined) {
      fields.push('password = ?');
      values.push(data.password ? hashLinkPassword(data.password) : null);
    }
    if (data.expires_at !== undefined) { fields.push('expires_at = ?'); values.push(data.expires_at); }
    if (data.click_limit !== undefined) { fields.push('click_limit = ?'); values.push(data.click_limit); }
    if (data.utm_source !== undefined) { fields.push('utm_source = ?'); values.push(data.utm_source); }
    if (data.utm_medium !== undefined) { fields.push('utm_medium = ?'); values.push(data.utm_medium); }
    if (data.utm_campaign !== undefined) { fields.push('utm_campaign = ?'); values.push(data.utm_campaign); }
    if (data.ios_url !== undefined) { fields.push('ios_url = ?'); values.push(data.ios_url); }
    if (data.android_url !== undefined) { fields.push('android_url = ?'); values.push(data.android_url); }
    if (data.huawei_url !== undefined) { fields.push('huawei_url = ?'); values.push(data.huawei_url); }
    if (data.desktop_url !== undefined) { fields.push('desktop_url = ?'); values.push(data.desktop_url); }
    if (data.open_in_app !== undefined) { fields.push('open_in_app = ?'); values.push(data.open_in_app ? 1 : 0); }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id, userId);

    const query = `UPDATE links SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    getDatabase().prepare(query).run(...values);

    return this.getLinkById(id);
  },

  deleteLink(id: string, userId: string): boolean {
    const stmt = getDatabase().prepare('DELETE FROM links WHERE id = ? AND user_id = ?');
    const res = stmt.run(id, userId);
    return res.changes > 0;
  },

  recordClick(click: {
    link_id: string;
    ip_hash?: string;
    referer?: string;
    country?: string;
    region?: string;
    city?: string;
    device_type?: string;
    os?: string;
    browser?: string;
  }): boolean {
    const database = getDatabase();
    const id = 'click_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    // Increment first, conditionally on the click limit, so concurrent requests
    // can't push a link past its limit. Returns false when the limit is reached.
    const record = database.transaction(() => {
      const res = database
        .prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ? AND (click_limit IS NULL OR click_count < click_limit)')
        .run(click.link_id);
      if (res.changes === 0) return false;

      database.prepare(`
        INSERT INTO clicks (id, link_id, ip_hash, referer, country, region, city, device_type, os, browser)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        click.link_id,
        click.ip_hash || 'anon',
        click.referer || 'Direct',
        click.country || 'Unknown',
        click.region || 'Unknown',
        click.city || 'Unknown',
        click.device_type || 'Unknown',
        click.os || 'Unknown',
        click.browser || 'Unknown'
      );
      return true;
    });

    return record();
  },

  getAnalyticsOverview(userId: string) {
    const database = getDatabase();
    // Every click query is restricted to the user's own links
    const scoped = `FROM clicks c JOIN links l ON l.id = c.link_id WHERE l.user_id = ?`;

    const totalClicks = (database.prepare(`SELECT COUNT(*) as count ${scoped}`).get(userId) as { count: number }).count;

    const totalLinks = (database.prepare('SELECT COUNT(*) as count FROM links WHERE user_id = ?').get(userId) as { count: number }).count;

    const totalBioViews = (database.prepare('SELECT COALESCE(SUM(view_count), 0) as count FROM bio_pages WHERE user_id = ?').get(userId) as { count: number }).count;

    // Region breakdown (Uzbekistan regions)
    const regions = database.prepare(`
      SELECT c.region, COUNT(*) as count
      ${scoped} AND c.country = 'UZ'
      GROUP BY c.region
      ORDER BY count DESC
      LIMIT 14
    `).all(userId) as { region: string; count: number }[];

    // Global Countries breakdown
    const countries = database.prepare(`
      SELECT c.country, COUNT(*) as count
      ${scoped}
      GROUP BY c.country
      ORDER BY count DESC
      LIMIT 12
    `).all(userId) as { country: string; count: number }[];

    // Referrers breakdown
    const referrers = database.prepare(`
      SELECT c.referer, COUNT(*) as count
      ${scoped}
      GROUP BY c.referer
      ORDER BY count DESC
      LIMIT 6
    `).all(userId) as { referer: string; count: number }[];

    // Devices breakdown
    const devices = database.prepare(`
      SELECT c.device_type, COUNT(*) as count
      ${scoped}
      GROUP BY c.device_type
      ORDER BY count DESC
    `).all(userId) as { device_type: string; count: number }[];

    // OS breakdown
    const os = database.prepare(`
      SELECT c.os, COUNT(*) as count
      ${scoped}
      GROUP BY c.os
      ORDER BY count DESC
    `).all(userId) as { os: string; count: number }[];

    // Daily clicks timeline
    const timeline = database.prepare(`
      SELECT date(c.created_at) as date, COUNT(*) as count
      ${scoped}
      GROUP BY date(c.created_at)
      ORDER BY date ASC
      LIMIT 14
    `).all(userId) as { date: string; count: number }[];

    return {
      totalClicks,
      totalLinks,
      totalBioViews,
      regions,
      countries,
      referrers,
      devices,
      os,
      timeline,
    };
  },

  getLinkAnalytics(linkId: string) {
    const link = this.getLinkById(linkId);
    if (!link) return null;

    const clicksStmt = getDatabase().prepare(`
      SELECT * FROM clicks WHERE link_id = ? ORDER BY created_at DESC LIMIT 100
    `);
    const clicks = clicksStmt.all(linkId) as ClickRecord[];

    const regionsStmt = getDatabase().prepare(`
      SELECT region, COUNT(*) as count 
      FROM clicks 
      WHERE link_id = ? 
      GROUP BY region 
      ORDER BY count DESC
    `);
    const regions = regionsStmt.all(linkId) as { region: string; count: number }[];

    const countriesStmt = getDatabase().prepare(`
      SELECT country, COUNT(*) as count 
      FROM clicks 
      WHERE link_id = ? 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 12
    `);
    const countries = countriesStmt.all(linkId) as { country: string; count: number }[];

    const referrersStmt = getDatabase().prepare(`
      SELECT referer, COUNT(*) as count 
      FROM clicks 
      WHERE link_id = ? 
      GROUP BY referer 
      ORDER BY count DESC 
      LIMIT 10
    `);
    const referrers = referrersStmt.all(linkId) as { referer: string; count: number }[];

    const devicesStmt = getDatabase().prepare(`
      SELECT device_type, COUNT(*) as count 
      FROM clicks 
      WHERE link_id = ? 
      GROUP BY device_type 
      ORDER BY count DESC
    `);
    const devices = devicesStmt.all(linkId) as { device_type: string; count: number }[];

    const osStmt = getDatabase().prepare(`
      SELECT os, COUNT(*) as count 
      FROM clicks 
      WHERE link_id = ? 
      GROUP BY os 
      ORDER BY count DESC
    `);
    const os = osStmt.all(linkId) as { os: string; count: number }[];

    const timelineStmt = getDatabase().prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM clicks 
      WHERE link_id = ? 
      GROUP BY date(created_at) 
      ORDER BY date ASC 
      LIMIT 14
    `);
    const timeline = timelineStmt.all(linkId) as { date: string; count: number }[];

    return {
      link,
      totalClicks: link.click_count || 0,
      clicks,
      regions,
      countries,
      referrers,
      devices,
      os,
      timeline,
    };
  },

  getBioPageByHandle(handle: string): (BioPageRecord & { links: BioLinkRecord[] }) | undefined {
    const cleanHandle = handle.replace(/^@/, '');
    const bioStmt = getDatabase().prepare('SELECT * FROM bio_pages WHERE handle = ?');
    const bio = bioStmt.get(cleanHandle) as BioPageRecord | undefined;
    if (!bio) return undefined;

    const linksStmt = getDatabase().prepare('SELECT * FROM bio_links WHERE bio_page_id = ? AND is_active = 1 ORDER BY sort_order ASC');
    const links = linksStmt.all(bio.id) as BioLinkRecord[];

    return { ...bio, links };
  },

  getBioPageByUserId(userId: string): (BioPageRecord & { links: BioLinkRecord[] }) | undefined {
    const bioStmt = getDatabase().prepare('SELECT * FROM bio_pages WHERE user_id = ? LIMIT 1');
    const bio = bioStmt.get(userId) as BioPageRecord | undefined;
    if (!bio) return undefined;

    const linksStmt = getDatabase().prepare('SELECT * FROM bio_links WHERE bio_page_id = ? ORDER BY sort_order ASC');
    const links = linksStmt.all(bio.id) as BioLinkRecord[];

    return { ...bio, links };
  },

  recordBioPageView(bioPageId: string) {
    getDatabase().prepare('UPDATE bio_pages SET view_count = view_count + 1 WHERE id = ?').run(bioPageId);
  },

  recordBioLinkClick(bioLinkId: string) {
    getDatabase().prepare('UPDATE bio_links SET click_count = click_count + 1 WHERE id = ?').run(bioLinkId);
  },

  saveBioPage(userId: string, data: {
    handle: string;
    title: string;
    bio: string;
    avatar_url: string;
    theme: string;
    social_links: Record<string, string>;
    links: Array<{ title: string; url: string; icon: string; style: string; animation: string }>;
  }) {
    const existing = this.getBioPageByUserId(userId);
    const db = getDatabase();

    // Page update and link replacement succeed or fail together
    db.transaction(() => {
      let bioId = existing?.id;
      if (existing) {
        db.prepare(`
          UPDATE bio_pages 
          SET handle = ?, title = ?, bio = ?, avatar_url = ?, theme = ?, social_links = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          data.handle.replace(/^@/, ''),
          data.title,
          data.bio,
          data.avatar_url,
          data.theme,
          JSON.stringify(data.social_links),
          existing.id
        );
      } else {
        bioId = 'bio_' + crypto.randomUUID().replace(/-/g, '').slice(0, 10);
        db.prepare(`
          INSERT INTO bio_pages (id, user_id, handle, title, bio, avatar_url, theme, social_links, verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(
          bioId,
          userId,
          data.handle.replace(/^@/, ''),
          data.title,
          data.bio,
          data.avatar_url,
          data.theme,
          JSON.stringify(data.social_links)
        );
      }

      // Replace bio links
      db.prepare('DELETE FROM bio_links WHERE bio_page_id = ?').run(bioId);

      const insertLink = db.prepare(`
        INSERT INTO bio_links (id, bio_page_id, title, url, icon, style, animation, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      data.links.forEach((l, idx) => {
        insertLink.run(
          'bl_' + crypto.randomUUID().replace(/-/g, '').slice(0, 10),
          bioId,
          l.title,
          l.url,
          l.icon || 'link',
          l.style || 'glass',
          l.animation || 'none',
          idx
        );
      });
    })();

    return this.getBioPageByUserId(userId);
  },

  getApiKeys(userId: string): ApiKeyRecord[] {
    const stmt = getDatabase().prepare('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as ApiKeyRecord[];
  },

  createApiKey(userId: string, name: string) {
    const rawKey = `urls_live_${crypto.randomBytes(16).toString('hex')}`;
    const hash = sha256(rawKey);
    const prefix = rawKey.slice(0, 14);
    const id = 'key_' + crypto.randomUUID().replace(/-/g, '').slice(0, 10);

    getDatabase().prepare(`
      INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, name, hash, prefix);

    return {
      id,
      name,
      apiKey: rawKey,
      keyPrefix: prefix,
    };
  },

  deleteApiKey(id: string, userId: string): boolean {
    const res = getDatabase().prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  /** Returns the id of the user who owns the key, or null if the key is invalid. */
  verifyApiKey(rawKey: string): string | null {
    const key = getDatabase().prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(sha256(rawKey)) as ApiKeyRecord | undefined;
    if (!key) return null;
    getDatabase().prepare('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(key.id);
    return key.user_id;
  },

  // ---------------------------------------------------------------------------
  // Users & sessions
  // ---------------------------------------------------------------------------

  /** Creates the user on first login, refreshes profile fields on later logins. */
  upsertUser(data: {
    provider: AuthProvider;
    providerId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
  }): UserRecord {
    const prefix = { google: 'usr_g_', telegram: 'usr_tg_', phone: 'usr_ph_' }[data.provider];
    const id = prefix + data.providerId;
    getDatabase().prepare(`
      INSERT INTO users (id, provider, provider_id, email, phone, name, avatar_url, role, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (provider, provider_id) DO UPDATE SET
        email = COALESCE(excluded.email, users.email),
        phone = COALESCE(excluded.phone, users.phone),
        name = excluded.name,
        avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
        role = excluded.role,
        last_login_at = CURRENT_TIMESTAMP
    `).run(
      id,
      data.provider,
      data.providerId,
      data.email ?? null,
      data.phone ?? null,
      data.name,
      data.avatarUrl ?? null,
      data.role
    );
    return this.getUserById(id)!;
  },

  getUserById(id: string): UserRecord | undefined {
    return getDatabase().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRecord | undefined;
  },

  /** Creates a session and returns the raw token. Only its hash is stored. */
  createSession(userId: string, maxAgeSeconds: number): string {
    const token = crypto.randomBytes(32).toString('base64url');
    getDatabase().prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, datetime('now', ?))
    `).run(sha256(token), userId, `+${maxAgeSeconds} seconds`);
    return token;
  },

  getUserBySessionToken(token: string): UserRecord | undefined {
    return getDatabase().prepare(`
      SELECT u.* FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).get(sha256(token)) as UserRecord | undefined;
  },

  deleteSession(token: string) {
    getDatabase().prepare('DELETE FROM sessions WHERE id = ?').run(sha256(token));
  },

  resetDemoData() {
    const database = getDatabase();
    database.prepare("DELETE FROM clicks WHERE link_id IN (SELECT id FROM links WHERE user_id = 'demo_user')").run();
    database.prepare("DELETE FROM links WHERE user_id = 'demo_user'").run();
    database.prepare("DELETE FROM bio_links WHERE bio_page_id IN (SELECT id FROM bio_pages WHERE user_id = 'demo_user')").run();
    database.prepare("DELETE FROM bio_pages WHERE user_id = 'demo_user'").run();
    database.prepare("DELETE FROM api_keys WHERE user_id = 'demo_user'").run();
    seedDemoData(database);
    return true;
  }
};
