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

    const base = { workspace_id: DEMO_WORKSPACE_ID, created_by: null };
    await tx.insert(links).values([
      {
        ...base,
        id: 'demo_1',
        title: '📱 ApexPay Mobil Ilova (Universal Deep Link)',
        destination_url: 'https://apextech.uz/download',
        slug: 'apex-app',
        click_count: 3840,
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
        click_count: 2450,
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
        click_count: 620,
        password: hashLinkPassword('investor2025'),
        tags: ['Investor', 'Maxfiy'],
      },
      {
        ...base,
        id: 'demo_4',
        title: '🚀 Bahorgi Keshbek & Promo Aksiya',
        destination_url: 'https://apextech.uz/promotions/spring-cashback',
        slug: 'bahor-promo',
        click_count: 1890,
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
        click_count: 730,
        tags: ['HR', 'Ish'],
      },
      {
        ...base,
        id: 'demo_6',
        title: '⚡ API & Integratsiya Dasturchilar Markazi',
        destination_url: 'https://docs.apextech.uz/v2/api',
        slug: 'api-docs',
        click_count: 1120,
        tags: ['Dev', 'API'],
      },
    ]);

    // Sample clicks across Uzbekistan regions and abroad
    const referrers = ['Telegram', 'Instagram', 'Direct', 'Google', 'YouTube'];
    const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
    const osList = ['iOS', 'Android', 'Android', 'macOS', 'Windows'];
    const linkIds = ['demo_1', 'demo_2', 'demo_3', 'demo_4', 'demo_5', 'demo_6'];
    const day = 24 * 60 * 60 * 1000;

    const places = [
      { country: 'UZ', region: 'Toshkent shahri', city: 'Toshkent shahri', weight: 45, days: 14 },
      { country: 'UZ', region: 'Samarqand', city: 'Samarqand', weight: 15, days: 14 },
      { country: 'UZ', region: 'Farg‘ona', city: 'Farg‘ona', weight: 10, days: 14 },
      { country: 'UZ', region: 'Andijon', city: 'Andijon', weight: 8, days: 14 },
      { country: 'UZ', region: 'Buxoro', city: 'Buxoro', weight: 7, days: 14 },
      { country: 'UZ', region: 'Namangan', city: 'Namangan', weight: 5, days: 14 },
      { country: 'UZ', region: 'Qashqadaryo', city: 'Qashqadaryo', weight: 4, days: 14 },
      { country: 'UZ', region: 'Xorazm', city: 'Xorazm', weight: 3, days: 14 },
      { country: 'UZ', region: 'Navoiy', city: 'Navoiy', weight: 2, days: 14 },
      { country: 'UZ', region: 'Surxondaryo', city: 'Surxondaryo', weight: 1, days: 14 },
      { country: 'RU', region: 'Moskva', city: 'Moscow', weight: 22, days: 10 },
      { country: 'KZ', region: 'Almati', city: 'Almaty', weight: 14, days: 10 },
      { country: 'TR', region: 'Istanbul', city: 'Istanbul', weight: 11, days: 10 },
      { country: 'US', region: 'California', city: 'Los Angeles', weight: 8, days: 10 },
      { country: 'AE', region: 'Dubay', city: 'Dubai', weight: 7, days: 10 },
      { country: 'KR', region: 'Seul', city: 'Seoul', weight: 5, days: 10 },
      { country: 'DE', region: 'Berlin', city: 'Berlin', weight: 4, days: 10 },
    ];

    const clickRows: (typeof clicks.$inferInsert)[] = [];
    for (const place of places) {
      for (let i = 0; i < place.weight; i++) {
        const device = devices[i % devices.length];
        const os = osList[i % osList.length];
        clickRows.push({
          id: `click_demo_${clickRows.length + 1}`,
          link_id: linkIds[i % linkIds.length],
          ip_hash: crypto.randomBytes(16).toString('hex'),
          referer: referrers[i % referrers.length],
          country: place.country,
          region: place.region,
          city: place.city,
          device_type: device,
          os,
          browser: place.country === 'UZ' && device === 'mobile' && os === 'iOS' ? 'Safari' : 'Chrome',
          created_at: new Date(Date.now() - (i % place.days) * day),
        });
      }
    }
    await tx.insert(clicks).values(clickRows);

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
      { n: 1, title: '📱 ApexPay Mobil Ilovasi', url: 'https://apextech.uz/download', icon: 'smartphone', style: 'solid', clicks: 1840 },
      { n: 2, title: '💳 Biznes Uchun To‘lovlar', url: 'https://apextech.uz/business', icon: 'zap', style: 'glass', clicks: 1210 },
      { n: 3, title: '💼 Vakansiyalar va Jamoa', url: 'https://careers.apextech.uz', icon: 'file', style: 'glass', clicks: 840 },
      { n: 4, title: '📞 24/7 Qo‘llab-quvvatlash', url: 'https://t.me/apextech_support', icon: 'phone', style: 'glass', clicks: 630 },
    ];
    await tx.insert(links).values(
      buttons.map((b) => ({
        ...base,
        id: `demo_bio_${b.n}`,
        title: `Bio: ${b.title}`,
        destination_url: b.url,
        slug: `apex-bio-${b.n}`,
        click_count: b.clicks,
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
