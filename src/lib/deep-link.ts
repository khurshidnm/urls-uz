/**
 * Deep Link Helper
 * Transforms web URLs into native mobile URI schemes so they open directly in installed apps
 * (e.g. Telegram, Instagram, YouTube, WhatsApp) instead of getting stuck in standard browser webviews.
 */

export interface DeepLinkResult {
  isDeepLinkable: boolean;
  appName: string;
  nativeScheme: string;
  fallbackUrl: string;
  intentUrl?: string; // Android intent URL
}

export function detectAndBuildDeepLink(originalUrl: string): DeepLinkResult {
  const url = originalUrl.trim();

  // 1. Telegram links (t.me, telegram.me)
  // e.g. https://t.me/durov or https://t.me/c/123/456 or https://t.me/+joinchat
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
    };
  }

  // 2. Instagram links
  // e.g. https://instagram.com/p/CODE or https://instagram.com/username
  const instagramMatch = url.match(/^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?$/i);
  if (instagramMatch) {
    const handle = instagramMatch[1];
    return {
      isDeepLinkable: true,
      appName: 'Instagram',
      nativeScheme: `instagram://user?username=${handle}`,
      fallbackUrl: url,
    };
  }

  // 3. YouTube links
  // e.g. https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
  const ytMatch1 = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i);
  const ytMatch2 = url.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  const ytVideoId = ytMatch1?.[1] || ytMatch2?.[1];
  if (ytVideoId) {
    return {
      isDeepLinkable: true,
      appName: 'YouTube',
      nativeScheme: `vnd.youtube://${ytVideoId}`,
      fallbackUrl: url,
    };
  }

  // 4. WhatsApp links
  // e.g. https://wa.me/998901234567 or https://api.whatsapp.com/send?phone=...
  const waMatch = url.match(/^https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)([0-9]+)/i);
  if (waMatch) {
    const phone = waMatch[1];
    return {
      isDeepLinkable: true,
      appName: 'WhatsApp',
      nativeScheme: `whatsapp://send?phone=${phone}`,
      fallbackUrl: url,
    };
  }

  return {
    isDeepLinkable: false,
    appName: 'Web',
    nativeScheme: url,
    fallbackUrl: url,
  };
}
