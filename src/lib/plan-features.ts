import { PLAN_LIMITS } from '@/lib/plans';
import type { Locale } from '@/lib/translations';
import { formatNumber } from '@/lib/utils';

/**
 * What each plan includes, for the landing pricing section and the billing
 * page. Only features that exist; numbers come from PLAN_LIMITS (what the code
 * enforces), so the copy can't promise more than the product does.
 */

const free = PLAN_LIMITS.free;
const pro = PLAN_LIMITS.pro;
const enterprise = PLAN_LIMITS.enterprise;

type Plan = 'free' | 'pro' | 'enterprise';

const retention = (days: number, locale: Locale) => {
  const years = days % 365 === 0 ? days / 365 : 0;
  if (locale === 'ru') return years ? `${years} ${years === 1 ? 'год' : 'года'}` : `${days} дн.`;
  if (locale === 'en') return years ? `${years} year${years === 1 ? '' : 's'}` : `${days} days`;
  return years ? `${years} yil` : `${days} kun`;
};

function features(l: Locale): Record<Plan, string[]> {
  const r = (days: number) => retention(days, l);
  if (l === 'ru')
    return {
      free: [
        `${formatNumber(free.activeLinks)} активных коротких ссылок`,
        `${free.deepLinks} ссылки, открывающиеся в приложении (Telegram, Instagram, YouTube)`,
        `${free.deviceTargeting} ссылки с переадресацией по устройству (App Store / Google Play / AppGallery)`,
        'Динамические QR-коды: ссылка, vCard, событие, локация, текст',
        `Страница Link-in-Bio: ${free.bioLinks} кнопок, ${free.bioThemes?.length ?? 0} темы`,
        'Аналитика по регионам, устройствам и источникам, экспорт CSV',
        `Журнал переходов ${r(free.rawClickRetentionDays)}, дневная статистика бессрочно`,
        'Пароль, срок действия и лимит переходов',
        'Telegram-бот и двухфакторная защита (2FA)',
      ],
      pro: [
        'Безлимитные активные ссылки',
        'Безлимитные ссылки в приложение и с переадресацией по устройству',
        `Link-in-Bio: ${pro.bioLinks} кнопок, все темы`,
        'Ключи REST API (300 запросов в минуту на ключ)',
        `Журнал переходов ${r(pro.rawClickRetentionDays)}`,
        'Все возможности бесплатного тарифа',
      ],
      enterprise: ['Все возможности тарифа Pro', `Журнал переходов ${r(enterprise.rawClickRetentionDays)}`, 'Индивидуальные условия и счёт-фактура для организации'],
    };
  if (l === 'en')
    return {
      free: [
        `${formatNumber(free.activeLinks)} active short links`,
        `${free.deepLinks} links that open in the app (Telegram, Instagram, YouTube)`,
        `${free.deviceTargeting} links routed by device (App Store / Google Play / AppGallery)`,
        'Dynamic QR codes: link, vCard, event, location, text',
        `Link-in-Bio page: ${free.bioLinks} buttons, ${free.bioThemes?.length ?? 0} themes`,
        'Analytics by region, device and source, CSV export',
        `Visit log kept ${r(free.rawClickRetentionDays)}, daily stats forever`,
        'Password, expiry date and click limit',
        'Telegram bot and two-factor authentication (2FA)',
      ],
      pro: [
        'Unlimited active links',
        'Unlimited in-app and device-routed links',
        `Link-in-Bio: ${pro.bioLinks} buttons, all themes`,
        'REST API keys (300 requests per minute per key)',
        `Visit log kept ${r(pro.rawClickRetentionDays)}`,
        'Everything in Free',
      ],
      enterprise: ['Everything in Pro', `Visit log kept ${r(enterprise.rawClickRetentionDays)}`, 'Custom terms and invoicing for organisations'],
    };
  return {
    free: [
      `${formatNumber(free.activeLinks)} ta faol qisqa havola`,
      `${free.deepLinks} ta ilovada ochiladigan havola (Telegram, Instagram, YouTube)`,
      `${free.deviceTargeting} ta qurilma bo‘yicha yo‘naltiriladigan havola (App Store / Google Play / AppGallery)`,
      'Dinamik QR kodlar: havola, vCard, tadbir, joylashuv, matn',
      `Link-in-Bio sahifa: ${free.bioLinks} ta tugma, ${free.bioThemes?.length ?? 0} ta mavzu`,
      'Viloyatlar, qurilmalar va manbalar bo‘yicha analitika, CSV eksport',
      `Tashriflar jurnali ${r(free.rawClickRetentionDays)}, kunlik statistika muddatsiz`,
      'Parol, amal qilish muddati va bosishlar limiti',
      'Telegram bot va ikki bosqichli himoya (2FA)',
    ],
    pro: [
      'Cheksiz faol havolalar',
      'Cheksiz ilovada ochiladigan va qurilma bo‘yicha yo‘naltiriladigan havolalar',
      `Link-in-Bio: ${pro.bioLinks} ta tugma, barcha mavzular`,
      'REST API kalitlari (har bir kalit uchun daqiqasiga 300 so‘rov)',
      `Tashriflar jurnali ${r(pro.rawClickRetentionDays)}`,
      'Bepul tarifdagi barcha imkoniyatlar',
    ],
    enterprise: ['Pro tarifdagi barcha imkoniyatlar', `Tashriflar jurnali ${r(enterprise.rawClickRetentionDays)}`, 'Tashkilot uchun alohida shartlar va hisob-faktura'],
  };
}

export const PLAN_FEATURES: Record<Locale, Record<Plan, string[]>> = { uz: features('uz'), ru: features('ru'), en: features('en') };

/** Announced but not built yet; shown separately as "planned", never as included. */
export const PLANNED_FEATURES: Record<Locale, string[]> = {
  uz: ['Shaxsiy domen (go.kompaniya.uz)', 'Jamoa a’zolari va rollar', 'Webhooklar'],
  ru: ['Свой домен (go.kompaniya.uz)', 'Участники команды и роли', 'Вебхуки'],
  en: ['Custom domain (go.company.uz)', 'Team members and roles', 'Webhooks'],
};
