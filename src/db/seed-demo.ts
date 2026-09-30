import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import type { Database } from './client';
import { apiKeys, bioLinks, bioPages, clicks, links, workspaces } from './schema';
import { DEMO_WORKSPACE_ID, hashLinkPassword, sha256 } from '@/lib/db';

/**
 * (Re)creates the read-only demo workspace shown to visitors who aren't
 * logged in. Everything in it is sample data and is excluded from the
 * public landing-page statistics.
 */
export async function seedDemo(pg: Database) {
  await pg.transaction(async (tx) => {
    // Deleting the workspace cascades to its links, clicks, bio page and keys
    await tx.delete(workspaces).where(eq(workspaces.id, DEMO_WORKSPACE_ID));
    await tx.insert(workspaces).values({
      id: DEMO_WORKSPACE_ID,
      name: 'ApexTech Solutions (Demo)',
      slug: 'demo',
      plan: 'free',
      is_demo: true,
    });

    // Sample clicks over the last 30 days, generated first so every link's
    // click_count equals its click rows (the dashboard shows both)
    const clickRows = demoClicks();
    const clicksFor = (linkId: string) => clickRows.filter((c) => c.link_id === linkId).length;

    const base = { workspace_id: DEMO_WORKSPACE_ID, created_by: null };
    await tx.insert(links).values([
      {
        ...base,
        id: 'demo_1',
        title: '📱 ApexPay Mobil Ilova (Universal Deep Link)',
        destination_url: 'https://apextech.uz/download',
        slug: 'apex-app',
        click_count: clicksFor('demo_1'),
        ios_url: 'https://apps.apple.com/uz/app/apexpay/id15243890',
        android_url: 'https://play.google.com/store/apps/details?id=uz.apexpay.android',
        huawei_url: 'https://appgallery.huawei.com/app/C10459201',
        desktop_url: 'https://apextech.uz/web-app',
        tags: ['Fintech', 'Ilova', 'Mobile'],
      },
      {
        ...base,
        id: 'demo_2',
        title: '🤖 Rasmiy Telegram Bot & Hamjamiyat',
        destination_url: 'https://t.me/apextech_bot',
        slug: 'tg-bot',
        click_count: clicksFor('demo_2'),
        open_in_app: true,
        utm_source: 'telegram',
        utm_medium: 'channel',
        utm_campaign: 'community_growth',
        tags: ['Telegram', 'Bot'],
      },
      {
        ...base,
        id: 'demo_3',
        title: '🔒 Investorlar Uchun Yillik Hisobot 2025',
        destination_url: 'https://apextech.uz/ir/annual-report-2025.pdf',
        slug: 'investor-report',
        click_count: clicksFor('demo_3'),
        password: hashLinkPassword('investor2025'),
        tags: ['Investor', 'Maxfiy'],
      },
      {
        ...base,
        id: 'demo_4',
        title: '🚀 Bahorgi Keshbek & Promo Aksiya',
        destination_url: 'https://apextech.uz/promotions/spring-cashback',
        slug: 'bahor-promo',
        click_count: clicksFor('demo_4'),
        utm_source: 'instagram',
        utm_medium: 'stories',
        utm_campaign: 'navruz_cashback',
        tags: ['Marketing', 'Promo'],
      },
      {
        ...base,
        id: 'demo_5',
        title: '💼 ApexTech Karyera & Ochiq Vakansiyalar',
        destination_url: 'https://careers.apextech.uz',
        slug: 'vakansiyalar',
        click_count: clicksFor('demo_5'),
        tags: ['HR', 'Ish'],
      },
      {
        ...base,
        id: 'demo_6',
        title: '⚡ API & Integratsiya Dasturchilar Markazi',
        destination_url: 'https://docs.apextech.uz/v2/api',
        slug: 'api-docs',
        click_count: clicksFor('demo_6'),
        tags: ['Dev', 'API'],
      },
    ]);


    await tx.insert(bioPages).values({
      id: 'bio_demo',
      workspace_id: DEMO_WORKSPACE_ID,
      handle: 'apextech',
      title: 'ApexTech Solutions',
      bio: 'O‘zbekistondagi yetakchi fintex ekotizimi · Tezkor to‘lovlar, biznes xizmatlari va raqamli innovatsiyalar 🚀',
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      theme: 'midnight',
      verified: true,
      social_links: {
        telegram: 'apextech_uz',
        instagram: 'apextech.uz',
        youtube: '@apextech',
        website: 'https://apextech.uz',
        github: 'apextech',
      },
      view_count: 4120,
    });

    // Bio buttons are backed by short links (source "bio"), like real ones
    const buttons = [
      { n: 1, title: '📱 ApexPay Mobil Ilovasi', url: 'https://apextech.uz/download', icon: 'smartphone', style: 'solid' },
      { n: 2, title: '💳 Biznes Uchun To‘lovlar', url: 'https://apextech.uz/business', icon: 'zap', style: 'glass' },
      { n: 3, title: '💼 Vakansiyalar va Jamoa', url: 'https://careers.apextech.uz', icon: 'file', style: 'glass' },
      { n: 4, title: '📞 24/7 Qo‘llab-quvvatlash', url: 'https://t.me/apextech_support', icon: 'phone', style: 'glass' },
    ];
    await tx.insert(links).values(
      buttons.map((b) => ({
        ...base,
        id: `demo_bio_${b.n}`,
        title: b.title,
        destination_url: b.url,
        slug: `apex-bio-${b.n}`,
        click_count: clicksFor(`demo_bio_${b.n}`),
        source: 'bio' as const,
      }))
    );
    await tx.insert(bioLinks).values(
      buttons.map((b) => ({
        id: `bl_demo_${b.n}`,
        bio_page_id: 'bio_demo',
        link_id: `demo_bio_${b.n}`,
        title: b.title,
        url: b.url,
        icon: b.icon,
        style: b.style,
        sort_order: b.n,
      }))
    );
    await tx.insert(clicks).values(clickRows);

    // Display-only key: its hash matches no real key, so it can never authenticate
    await tx.insert(apiKeys).values({
      id: 'key_demo',
      workspace_id: DEMO_WORKSPACE_ID,
      name: 'Production App Key',
      key_hash: sha256(crypto.randomBytes(32).toString('hex')),
      key_prefix: 'urls_live_9f83',
    });
  });
}

/** Share of the demo's clicks per link (bio buttons included). */
const LINK_WEIGHTS: [string, number][] = [
  ['demo_1', 38], ['demo_2', 25], ['demo_3', 6], ['demo_4', 19], ['demo_5', 7], ['demo_6', 11],
  ['demo_bio_1', 18], ['demo_bio_2', 12], ['demo_bio_3', 8], ['demo_bio_4', 6],
];
const PLACES: { country: string; region: string; city: string; weight: number }[] = [
  { country: 'UZ', region: 'Toshkent shahri', city: 'Toshkent shahri', weight: 45 },
  { country: 'UZ', region: 'Samarqand', city: 'Samarqand', weight: 15 },
  { country: 'UZ', region: 'Farg‘ona', city: 'Farg‘ona', weight: 10 },
  { country: 'UZ', region: 'Andijon', city: 'Andijon', weight: 8 },
  { country: 'UZ', region: 'Buxoro', city: 'Buxoro', weight: 7 },
  { country: 'UZ', region: 'Namangan', city: 'Namangan', weight: 5 },
  { country: 'UZ', region: 'Qashqadaryo', city: 'Qashqadaryo', weight: 4 },
  { country: 'UZ', region: 'Xorazm', city: 'Xorazm', weight: 3 },
  { country: 'UZ', region: 'Navoiy', city: 'Navoiy', weight: 2 },
  { country: 'UZ', region: 'Surxondaryo', city: 'Surxondaryo', weight: 1 },
  { country: 'RU', region: 'Moskva', city: 'Moscow', weight: 10 },
  { country: 'KZ', region: 'Almati', city: 'Almaty', weight: 6 },
  { country: 'TR', region: 'Istanbul', city: 'Istanbul', weight: 4 },
  { country: 'US', region: 'California', city: 'Los Angeles', weight: 3 },
  { country: 'AE', region: 'Dubay', city: 'Dubai', weight: 3 },
  { country: 'KR', region: 'Seul', city: 'Seoul', weight: 2 },
  { country: 'DE', region: 'Berlin', city: 'Berlin', weight: 2 },
];
const REFERRERS: [string, number][] = [['Telegram', 40], ['Instagram', 25], ['Direct', 18], ['Google', 12], ['YouTube', 5]];
const DEVICES: [{ device: string; os: string; browser: string }, number][] = [
  [{ device: 'mobile', os: 'Android', browser: 'Chrome' }, 48],
  [{ device: 'mobile', os: 'iOS', browser: 'Safari' }, 27],
  [{ device: 'desktop', os: 'Windows', browser: 'Chrome' }, 15],
  [{ device: 'desktop', os: 'macOS', browser: 'Safari' }, 7],
  [{ device: 'tablet', os: 'Android', browser: 'Chrome' }, 3],
];
const DEMO_CLICKS = 1500;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Deterministic sample clicks (same data on every reset), growing toward today. */
function demoClicks(): (typeof clicks.$inferInsert)[] {
  let state = 20260930;
  const rand = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = <T,>(items: [T, number][]): T => {
    const total = items.reduce((sum, [, w]) => sum + w, 0);
    let r = rand() * total;
    for (const [item, w] of items) if ((r -= w) < 0) return item;
    return items[items.length - 1][0];
  };
  // Recent days get more clicks
  const days: [number, number][] = Array.from({ length: 30 }, (_, d) => [d, 30 - d + 6]);

  return Array.from({ length: DEMO_CLICKS }, (_, i) => {
    const place = pick(PLACES.map((p) => [p, p.weight] as [typeof p, number]));
    const device = pick(DEVICES);
    const daysAgo = pick(days);
    return {
      id: `click_demo_${i + 1}`,
      link_id: pick(LINK_WEIGHTS.map(([id, w]) => [id, w] as [string, number])),
      ip_hash: crypto.createHash('sha256').update(`demo-visitor-${Math.floor(rand() * 900)}`).digest('hex').slice(0, 32),
      referer: pick(REFERRERS),
      country: place.country,
      region: place.region,
      city: place.city,
      device_type: device.device,
      os: device.os,
      browser: device.browser,
      created_at: new Date(Date.now() - daysAgo * DAY_MS - Math.floor(rand() * DAY_MS)),
    };
  });
}
