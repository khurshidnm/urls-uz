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

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  `);

  // Run dynamic schema migrations for existing databases
  try { db.exec("ALTER TABLE links ADD COLUMN tags TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE links ADD COLUMN is_archived INTEGER DEFAULT 0"); } catch {}
  try { db.exec("ALTER TABLE links ADD COLUMN huawei_url TEXT"); } catch {}
  try { db.exec("ALTER TABLE links ADD COLUMN desktop_url TEXT"); } catch {}

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
    INSERT INTO links (id, user_id, title, destination_url, slug, click_count, open_in_app, utm_source, utm_campaign)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLink.run(
    'link_1',
    'demo_user',
    'Rasmiy Telegram Kanal',
    'https://t.me/urls_uz',
    'telegram',
    1420,
    1,
    'telegram',
    'spring_promo'
  );

  insertLink.run(
    'link_2',
    'demo_user',
    'Instagram Profil',
    'https://instagram.com/urls.uz',
    'insta',
    895,
    1,
    'instagram',
    'brand_awareness'
  );

  insertLink.run(
    'link_3',
    'demo_user',
    'Web Dasturchi Portfoliomi',
    'https://github.com/khurshidnm',
    'dev',
    530,
    0,
    'direct',
    'portfolio'
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

  let clickId = 1;
  for (const reg of regions) {
    for (let i = 0; i < reg.weight; i++) {
      const ref = referrers[i % referrers.length];
      const dev = devices[i % devices.length];
      const os = osList[i % osList.length];
      const timeOffset = `-${(i % 14)} days`;
      insertClick.run(
        `click_${clickId++}`,
        'link_1',
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
      insertClick.run(
        `click_${clickId++}`,
        'link_1',
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
    INSERT INTO bio_pages (id, user_id, handle, title, bio, avatar_url, theme, verified, social_links, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBio.run(
    'bio_1',
    'demo_user',
    'urls',
    'urls.uz — Rasmiy Havola',
    'O‘zbekistondagi eng tezkor va qulay URL qisqartirish, brendli QR-kodlar hamda Bio sahifalar platformasi 🚀',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    'midnight',
    1,
    JSON.stringify({
      telegram: 'urls_uz',
      instagram: 'urls.uz',
      youtube: '@urls-uz',
      github: 'khurshidnm'
    }),
    2840
  );

  const insertBioLink = db.prepare(`
    INSERT INTO bio_links (id, bio_page_id, title, url, icon, style, animation, click_count, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBioLink.run('bl_1', 'bio_1', '🚀 Veb-saytimizga o‘tish', 'https://urls.uz', 'globe', 'gradient', 'pulse', 1240, 1);
  insertBioLink.run('bl_2', 'bio_1', '📱 Telegram kanalimizga qo‘shiling', 'https://t.me/urls_uz', 'send', 'glass', 'none', 950, 2);
  insertBioLink.run('bl_3', 'bio_1', '📸 Instagram sahifamiz', 'https://instagram.com/urls.uz', 'camera', 'outline', 'none', 650, 3);

  // Seed Demo API Key
  const insertApiKey = db.prepare(`
    INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix)
    VALUES (?, ?, ?, ?, ?)
  `);
  const demoKey = 'urls_live_9f830d12a67e20b348f9';
  const hash = crypto.createHash('sha256').update(demoKey).digest('hex');
  insertApiKey.run('key_1', 'demo_user', 'Production App Key', hash, 'urls_live_9f83');
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

  getAllLinks(userId = 'demo_user'): LinkRecord[] {
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
      data.password || null,
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

  updateLink(id: string, data: Partial<LinkRecord>): LinkRecord | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.destination_url !== undefined) { fields.push('destination_url = ?'); values.push(data.destination_url); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
    if (data.is_archived !== undefined) { fields.push('is_archived = ?'); values.push(data.is_archived ? 1 : 0); }
    if (data.tags !== undefined) { fields.push('tags = ?'); values.push(data.tags); }
    if (data.password !== undefined) { fields.push('password = ?'); values.push(data.password); }
    if (data.expires_at !== undefined) { fields.push('expires_at = ?'); values.push(data.expires_at); }
    if (data.click_limit !== undefined) { fields.push('click_limit = ?'); values.push(data.click_limit); }
    if (data.utm_source !== undefined) { fields.push('utm_source = ?'); values.push(data.utm_source); }
    if (data.utm_medium !== undefined) { fields.push('utm_medium = ?'); values.push(data.utm_medium); }
    if (data.utm_campaign !== undefined) { fields.push('utm_campaign = ?'); values.push(data.utm_campaign); }
    if (data.ios_url !== undefined) { fields.push('ios_url = ?'); values.push(data.ios_url); }
    if (data.android_url !== undefined) { fields.push('android_url = ?'); values.push(data.android_url); }
    if (data.huawei_url !== undefined) { fields.push('huawei_url = ?'); values.push(data.huawei_url); }
    if (data.desktop_url !== undefined) { fields.push('desktop_url = ?'); values.push(data.desktop_url); }
    if (data.open_in_app !== undefined) { fields.push('open_in_app = ?'); values.push(data.open_in_app); }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const query = `UPDATE links SET ${fields.join(', ')} WHERE id = ?`;
    getDatabase().prepare(query).run(...values);

    return this.getLinkById(id);
  },

  deleteLink(id: string): boolean {
    const stmt = getDatabase().prepare('DELETE FROM links WHERE id = ?');
    const res = stmt.run(id);
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
  }) {
    const id = 'click_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const stmt = getDatabase().prepare(`
      INSERT INTO clicks (id, link_id, ip_hash, referer, country, region, city, device_type, os, browser)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      click.link_id,
      click.ip_hash || 'anon',
      click.referer || 'Direct',
      click.country || 'UZ',
      click.region || 'Toshkent shahri',
      click.city || 'Toshkent',
      click.device_type || 'mobile',
      click.os || 'iOS',
      click.browser || 'Safari'
    );

    // Increment click counter on the link
    getDatabase().prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').run(click.link_id);
  },

  getAnalyticsOverview() {
    const totalClicksStmt = getDatabase().prepare('SELECT COUNT(*) as count FROM clicks');
    const totalClicks = (totalClicksStmt.get() as any)?.count || 0;

    const totalLinksStmt = getDatabase().prepare('SELECT COUNT(*) as count FROM links');
    const totalLinks = (totalLinksStmt.get() as any)?.count || 0;

    const totalBioViewsStmt = getDatabase().prepare('SELECT SUM(view_count) as count FROM bio_pages');
    const totalBioViews = (totalBioViewsStmt.get() as any)?.count || 0;

    // Region breakdown (Uzbekistan regions)
    const regionsStmt = getDatabase().prepare(`
      SELECT region, COUNT(*) as count 
      FROM clicks 
      WHERE country = 'UZ'
      GROUP BY region 
      ORDER BY count DESC 
      LIMIT 14
    `);
    const regions = regionsStmt.all() as { region: string; count: number }[];

    // Global Countries breakdown
    const countriesStmt = getDatabase().prepare(`
      SELECT country, COUNT(*) as count 
      FROM clicks 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 12
    `);
    const countries = countriesStmt.all() as { country: string; count: number }[];

    // Referrers breakdown
    const referrersStmt = getDatabase().prepare(`
      SELECT referer, COUNT(*) as count 
      FROM clicks 
      GROUP BY referer 
      ORDER BY count DESC 
      LIMIT 6
    `);
    const referrers = referrersStmt.all() as { referer: string; count: number }[];

    // Devices breakdown
    const devicesStmt = getDatabase().prepare(`
      SELECT device_type, COUNT(*) as count 
      FROM clicks 
      GROUP BY device_type 
      ORDER BY count DESC
    `);
    const devices = devicesStmt.all() as { device_type: string; count: number }[];

    // OS breakdown
    const osStmt = getDatabase().prepare(`
      SELECT os, COUNT(*) as count 
      FROM clicks 
      GROUP BY os 
      ORDER BY count DESC
    `);
    const os = osStmt.all() as { os: string; count: number }[];

    // Daily clicks timeline (last 7 days)
    const timelineStmt = getDatabase().prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM clicks 
      GROUP BY date(created_at) 
      ORDER BY date ASC 
      LIMIT 14
    `);
    const timeline = timelineStmt.all() as { date: string; count: number }[];

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
      SELECT region, COUNT(*) as count FROM clicks WHERE link_id = ? GROUP BY region ORDER BY count DESC
    `);
    const regions = regionsStmt.all(linkId) as { region: string; count: number }[];

    const referrersStmt = getDatabase().prepare(`
      SELECT referer, COUNT(*) as count FROM clicks WHERE link_id = ? GROUP BY referer ORDER BY count DESC
    `);
    const referrers = referrersStmt.all(linkId) as { referer: string; count: number }[];

    return {
      link,
      clicks,
      regions,
      referrers,
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

  getBioPageByUserId(userId = 'demo_user'): (BioPageRecord & { links: BioLinkRecord[] }) | undefined {
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

  saveBioPage(userId = 'demo_user', data: {
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
        INSERT INTO bio_pages (id, user_id, handle, title, bio, avatar_url, theme, social_links)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

    return this.getBioPageByUserId(userId);
  },

  getApiKeys(userId = 'demo_user'): ApiKeyRecord[] {
    const stmt = getDatabase().prepare('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as ApiKeyRecord[];
  },

  createApiKey(userId = 'demo_user', name: string) {
    const rawKey = `urls_live_${crypto.randomBytes(16).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
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

  deleteApiKey(id: string, userId = 'demo_user'): boolean {
    const res = getDatabase().prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  verifyApiKey(rawKey: string): boolean {
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const key = getDatabase().prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(hash) as ApiKeyRecord | undefined;
    if (key) {
      getDatabase().prepare('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(key.id);
      return true;
    }
    return false;
  }
};
