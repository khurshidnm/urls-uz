import { PLAN_LIMITS } from '@/lib/plans';
import { formatNumber } from '@/lib/utils';

/**
 * What each plan includes, for the landing pricing section and the billing
 * page. Only features that exist; numbers come from PLAN_LIMITS (what the code
 * enforces), so the copy can't promise more than the product does.
 */

const free = PLAN_LIMITS.free;
const pro = PLAN_LIMITS.pro;
const enterprise = PLAN_LIMITS.enterprise;

const retention = (days: number) => (days % 365 === 0 ? `${days / 365} yil` : `${days} kun`);

export const PLAN_FEATURES: Record<'free' | 'pro' | 'enterprise', string[]> = {
  free: [
    `${formatNumber(free.activeLinks)} ta faol qisqa havola`,
    `${free.deepLinks} ta ilovada ochiladigan havola (Telegram, Instagram, YouTube)`,
    `${free.deviceTargeting} ta qurilma bo‘yicha yo‘naltiriladigan havola (App Store / Google Play / AppGallery)`,
    'Dinamik QR kodlar: havola, vCard, tadbir, joylashuv, matn',
    `Link-in-Bio sahifa: ${free.bioLinks} ta tugma, ${free.bioThemes?.length ?? 0} ta mavzu`,
    'Viloyatlar, qurilmalar va manbalar bo‘yicha analitika, CSV eksport',
    `Tashriflar jurnali ${retention(free.rawClickRetentionDays)}, kunlik statistika muddatsiz`,
    'Parol, amal qilish muddati va bosishlar limiti',
    'Telegram bot va ikki bosqichli himoya (2FA)',
  ],
  pro: [
    'Cheksiz faol havolalar',
    'Cheksiz ilovada ochiladigan va qurilma bo‘yicha yo‘naltiriladigan havolalar',
    `Link-in-Bio: ${pro.bioLinks} ta tugma, barcha mavzular`,
    'REST API kalitlari (har bir kalit uchun daqiqasiga 300 so‘rov)',
    `Tashriflar jurnali ${retention(pro.rawClickRetentionDays)}`,
    'Bepul tarifdagi barcha imkoniyatlar',
  ],
  enterprise: [
    'Pro tarifdagi barcha imkoniyatlar',
    `Tashriflar jurnali ${retention(enterprise.rawClickRetentionDays)}`,
    'Tashkilot uchun alohida shartlar va hisob-faktura',
  ],
};

/** Announced but not built yet; shown separately as "planned", never as included. */
export const PLANNED_FEATURES = ['Shaxsiy domen (go.kompaniya.uz)', 'Jamoa a’zolari va rollar', 'Webhooklar'];
