/**
 * The apps in the landing page's "one link, every device" demo. They're real
 * short links in the demo workspace (seeded from this list), so the QR code on
 * the landing page can be scanned and routes like any customer's link.
 */

export interface DeviceDemoApp {
  id: string;
  name: string;
  category: string;
  /** Short link slug: urls.uz/<slug>. */
  slug: string;
  /** Brand color for the initial badge. */
  color: string;
  ios: string;
  android: string;
  /** null: no AppGallery app; Huawei phones get the website. */
  huawei: string | null;
  /** Computers, and the fallback for any other device. */
  web: string;
}

export const DEVICE_DEMO_APPS: DeviceDemoApp[] = [
  {
    id: 'uzum',
    name: 'Uzum Market',
    category: 'Onlayn do‘kon',
    slug: 'app-uzum',
    color: '#7000FF',
    ios: 'https://apps.apple.com/uz/app/uzum-market-internet-do-kon-uz/id1640483056',
    android: 'https://play.google.com/store/apps/details?id=uz.uzum.app&pcampaignid=web_share',
    huawei: null,
    web: 'https://uzum.uz/uz',
  },
  {
    id: 'yandexgo',
    name: 'Yandex Go',
    category: 'Taksi va yetkazib berish',
    slug: 'app-yandexgo',
    color: '#FC3F1D',
    ios: 'https://apps.apple.com/us/app/yandex-go-taxi-food-delivery/id472650686',
    android: 'https://play.google.com/store/apps/details?id=ru.yandex.taxi&pcampaignid=web_share',
    huawei: 'https://appgallery.huawei.com/app/C101411413',
    web: 'https://go.yandex/',
  },
  {
    id: 'payme',
    name: 'Payme',
    category: 'To‘lovlar',
    slug: 'app-payme',
    color: '#00CCCC',
    ios: 'https://apps.apple.com/uz/app/payme-%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4%D1%8B-%D0%B8-%D0%BF%D0%BB%D0%B0%D1%82%D0%B5%D0%B6%D0%B8/id1093525667',
    android: 'https://play.google.com/store/apps/details?id=uz.dida.payme&pcampaignid=web_share',
    huawei: 'https://appgallery.huawei.com/app/C103928695',
    web: 'https://payme.uz/',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'Messenjer',
    slug: 'app-telegram',
    color: '#229ED9',
    ios: 'https://apps.apple.com/us/app/telegram-messenger/id686449807',
    android: 'https://play.google.com/store/apps/details?id=org.telegram.messenger&pcampaignid=web_share',
    huawei: 'https://appgallery.huawei.com/app/C101184875',
    web: 'https://telegram.org/',
  },
];
