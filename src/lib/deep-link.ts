/**
 * Intelligent Deep Link & Device Targeting Engine for urls.uz
 * 
 * Supports:
 * - Dynamic Device Targeting: iOS, Android, Huawei (HarmonyOS/EMUI), Desktop (macOS/Win/Linux), Fallback
 * - Native Mobile App URI schemes (Telegram, Instagram, YouTube, WhatsApp, Payme, Click, Uzum, Yandex)
 * - Official Store Intents (Apple App Store, Google Play Store, Huawei AppGallery)
 */

export interface DeepLinkResult {
  isDeepLinkable: boolean;
  appName: string;
  nativeScheme: string;
  fallbackUrl: string;
  intentUrl?: string; // Android intent URL
  storeType?: 'app_store' | 'google_play' | 'app_gallery' | 'native_app' | 'web';
}

export interface DeviceRoutingConfig {
  iosUrl?: string;          // App Store yoki iOS Universal Link
  androidUrl?: string;      // Google Play yoki Android Intent/App Link
  huaweiUrl?: string;       // Huawei AppGallery linki
  desktopUrl?: string;      // Windows / macOS / Linux uchun veb-sayt
  fallbackUrl: string;      // Qolgan barcha holatlar uchun asosiy URL
}

/**
 * Parses user agent string and returns detected device profile
 */
export function detectDeviceFromUserAgent(userAgent: string, osName = ''): {
  deviceType: 'ios' | 'android' | 'huawei' | 'desktop' | 'other';
  os: string;
  isMobile: boolean;
} {
  const ua = (userAgent || '').toLowerCase();
  const osLower = (osName || '').toLowerCase();

  // 1. Check Huawei / HarmonyOS / Honor first (since Huawei Android UA also contains 'android')
  const isHuawei =
    /huawei|honor|harmonyos|openharmony|hmscore|hmsclient|appgallery|huaweibrowser/i.test(ua) ||
    osLower.includes('harmony') ||
    osLower.includes('huawei') ||
    osLower.includes('honor');
  if (isHuawei) {
    return { deviceType: 'huawei', os: 'HarmonyOS / Huawei', isMobile: true };
  }

  // 2. Check Apple iOS
  const isIos = /iphone|ipad|ipod/i.test(ua) || osLower.includes('ios') || (ua.includes('macintosh') && 'ontouchend' in {});
  if (isIos) {
    return { deviceType: 'ios', os: 'iOS', isMobile: true };
  }

  // 3. Check Standard Android
  const isAndroid = /android/i.test(ua) || osLower.includes('android');
  if (isAndroid) {
    return { deviceType: 'android', os: 'Android', isMobile: true };
  }

  // 4. Check Desktop OS
  const isDesktop = /macintosh|mac os x|windows nt|linux|cros/i.test(ua) && !/mobile|android|iphone/i.test(ua);
  if (isDesktop) {
    return { deviceType: 'desktop', os: 'Desktop', isMobile: false };
  }

  return { deviceType: 'other', os: osName || 'Unknown', isMobile: /mobile/i.test(ua) };
}

/**
 * Evaluates a link's device targeting rules against the client User-Agent
 */
export function resolveDeviceRedirect(
  link: {
    destination_url: string;
    ios_url?: string | null;
    android_url?: string | null;
    huawei_url?: string | null;
    desktop_url?: string | null;
  },
  userAgent: string,
  osName = ''
): {
  targetUrl: string;
  matchedRule: 'ios' | 'android' | 'huawei' | 'desktop' | 'fallback';
  deviceProfile: ReturnType<typeof detectDeviceFromUserAgent>;
} {
  const deviceProfile = detectDeviceFromUserAgent(userAgent, osName);

  if (deviceProfile.deviceType === 'ios' && link.ios_url?.trim()) {
    return { targetUrl: link.ios_url.trim(), matchedRule: 'ios', deviceProfile };
  }

  if (deviceProfile.deviceType === 'huawei' && link.huawei_url?.trim()) {
    return { targetUrl: link.huawei_url.trim(), matchedRule: 'huawei', deviceProfile };
  }

  if (deviceProfile.deviceType === 'android' && link.android_url?.trim()) {
    return { targetUrl: link.android_url.trim(), matchedRule: 'android', deviceProfile };
  }

  if (deviceProfile.deviceType === 'desktop' && link.desktop_url?.trim()) {
    return { targetUrl: link.desktop_url.trim(), matchedRule: 'desktop', deviceProfile };
  }

  // Fallback to primary destination URL
  return { targetUrl: link.destination_url.trim(), matchedRule: 'fallback', deviceProfile };
}

/**
 * Detects native deep links and transforms them to OS-specific URI schemes
 */
export function detectAndBuildDeepLink(originalUrl: string): DeepLinkResult {
  const url = (originalUrl || '').trim();

  // 1. Apple App Store
  // https://apps.apple.com/uz/app/payme/id1044439055
  const appStoreMatch = url.match(/apps\.apple\.com\/(?:[a-z]{2}\/)?app\/([^/]+)\/id([0-9]+)/i);
  if (appStoreMatch) {
    const [, appSlug, appId] = appStoreMatch;
    return {
      isDeepLinkable: true,
      appName: 'App Store',
      nativeScheme: `itms-apps://itunes.apple.com/app/id${appId}`,
      fallbackUrl: url,
      storeType: 'app_store',
    };
  }

  // 2. Google Play Store
  // https://play.google.com/store/apps/details?id=uz.payme.android
  const playStoreMatch = url.match(/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/i);
  if (playStoreMatch) {
    const pkg = playStoreMatch[1];
    return {
      isDeepLinkable: true,
      appName: 'Google Play',
      nativeScheme: `market://details?id=${pkg}`,
      fallbackUrl: url,
      intentUrl: `intent://details?id=${pkg}#Intent;scheme=market;package=com.android.vending;end`,
      storeType: 'google_play',
    };
  }

  // 3. Huawei AppGallery
  // https://appgallery.huawei.com/app/C101438781 or https://appgallery.cloud.huawei.com/... or appmarket://details?id=...
  const appGalleryMatch = url.match(/(?:appgallery\.(?:cloud\.)?huawei\.com\/(?:#\/)?(?:marketshare\/)?app\/|(?:appmarket:\/\/details\?id=))(C[0-9]+|[a-zA-Z0-9._]+)/i);
  if (appGalleryMatch) {
    const appId = appGalleryMatch[1];
    return {
      isDeepLinkable: true,
      appName: 'Huawei AppGallery',
      nativeScheme: `appmarket://details?id=${appId}`,
      fallbackUrl: url,
      storeType: 'app_gallery',
    };
  }

  // 4. Payme Uzbekistan
  // https://payme.uz/fallback or checkout.paycom.uz
  if (/payme\.uz|paycom\.uz/i.test(url)) {
    return {
      isDeepLinkable: true,
      appName: 'Payme',
      nativeScheme: url.replace(/^https?:\/\//i, 'payme://'),
      fallbackUrl: url,
      intentUrl: `intent://${url.replace(/^https?:\/\//i, '')}#Intent;package=uz.payme.android;scheme=payme;end`,
      storeType: 'native_app',
    };
  }

  // 5. Click Uzbekistan
  // https://click.uz/
  if (/click\.uz/i.test(url)) {
    return {
      isDeepLinkable: true,
      appName: 'Click Up',
      nativeScheme: url.replace(/^https?:\/\//i, 'clickuz://'),
      fallbackUrl: url,
      intentUrl: `intent://${url.replace(/^https?:\/\//i, '')}#Intent;package=uz.click.up;scheme=clickuz;end`,
      storeType: 'native_app',
    };
  }

  // 6. Uzum Market
  // https://uzum.uz/
  if (/uzum\.uz/i.test(url)) {
    return {
      isDeepLinkable: true,
      appName: 'Uzum Market',
      nativeScheme: url.replace(/^https?:\/\//i, 'uzum://'),
      fallbackUrl: url,
      intentUrl: `intent://${url.replace(/^https?:\/\//i, '')}#Intent;package=uz.uzum.market;scheme=uzum;end`,
      storeType: 'native_app',
    };
  }

  // 7. Telegram (t.me / telegram.me)
  const telegramMatch = url.match(/^https?:\/\/(?:t|telegram)\.me\/([a-zA-Z0-9_+/]+)(\?.*)?$/i);
  if (telegramMatch) {
    const path = telegramMatch[1];
    const query = telegramMatch[2] || '';
    let nativeScheme = `tg://resolve?domain=${path}`;
    if (path.startsWith('+') || path.startsWith('joinchat/')) {
      const inviteCode = path.replace(/^(\+|joinchat\/)/, '');
      nativeScheme = `tg://join?invite=${inviteCode}`;
    }
    return {
      isDeepLinkable: true,
      appName: 'Telegram',
      nativeScheme,
      fallbackUrl: url,
      intentUrl: `intent://${path}${query}#Intent;package=org.telegram.messenger;scheme=tg;end;`,
      storeType: 'native_app',
    };
  }

  // 8. Instagram
  const instagramMatch = url.match(/^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?$/i);
  if (instagramMatch) {
    const handle = instagramMatch[1];
    return {
      isDeepLinkable: true,
      appName: 'Instagram',
      nativeScheme: `instagram://user?username=${handle}`,
      fallbackUrl: url,
      storeType: 'native_app',
    };
  }

  // 9. YouTube
  const ytMatch1 = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i);
  const ytMatch2 = url.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  const ytVideoId = ytMatch1?.[1] || ytMatch2?.[1];
  if (ytVideoId) {
    return {
      isDeepLinkable: true,
      appName: 'YouTube',
      nativeScheme: `vnd.youtube://${ytVideoId}`,
      fallbackUrl: url,
      storeType: 'native_app',
    };
  }

  // 10. WhatsApp
  const waMatch = url.match(/^https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)([0-9]+)/i);
  if (waMatch) {
    const phone = waMatch[1];
    return {
      isDeepLinkable: true,
      appName: 'WhatsApp',
      nativeScheme: `whatsapp://send?phone=${phone}`,
      fallbackUrl: url,
      storeType: 'native_app',
    };
  }

  return {
    isDeepLinkable: false,
    appName: 'Web',
    nativeScheme: url,
    fallbackUrl: url,
    storeType: 'web',
  };
}
