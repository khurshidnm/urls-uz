/**
 * Anti-Phishing and Security Filter for urls.uz
 * Blocks malicious, phishing, and scam domains from abusing the shortening service.
 */

// Known deceptive patterns targeting Uzbekistan financial institutions and users
const SUSPICIOUS_DOMAINS = [
  'click-uz',
  'click-pay',
  'payme-uz',
  'payme-security',
  'uzumbank-',
  'kapital24',
  'agrobank-',
  'sqb-online',
  'hamkorbank-',
  'ipotekabank-',
  'nbu-online',
  'olx-dostavka',
  'uzpost-pay',
  'telegram-premium-free',
  'free-tg-stars',
  'yandex-dostavka-pay',
];

const BANNED_EXTENSIONS = ['.exe', '.apk', '.bat', '.scr', '.vbs', '.msi'];

export interface SecurityCheckResult {
  isSafe: boolean;
  reason?: string;
}

export function checkUrlSafety(rawUrl: string): SecurityCheckResult {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    // 1. Raw IPv4 / IPv6 addresses are commonly used by malicious phishing kits
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[') || hostname.includes('::');
    if (isIpAddress) {
      return {
        isSafe: false,
        reason: 'Xavfsizlik qoidasi: To‘g‘ridan-to‘g‘ri IP manzillarga havola qisqartirish taqiqlangan (Fishingdan himoya).',
      };
    }

    // 2. Check for phishing domain imitations (Click, Payme, Uzum, Bank fakes)
    for (const pattern of SUSPICIOUS_DOMAINS) {
      if (hostname.includes(pattern) && !hostname.endsWith('click.uz') && !hostname.endsWith('payme.uz') && !hostname.endsWith('uzumbank.uz')) {
        return {
          isSafe: false,
          reason: 'Ushbu havola O‘zbekiston to‘lov tizimlari va banklariga taqlid qiluvchi fishing belgilariga ega.',
        };
      }
    }

    // 3. Dangerous file downloads (Trojan/malware executables)
    for (const ext of BANNED_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return {
          isSafe: false,
          reason: `Xavfli fayl turi (${ext}) aniqlandi. Zararli dasturlarni tarqatish taqiqlangan.`,
        };
      }
    }

    // 4. Disallow self-referencing loops
    if (hostname === 'urls.uz' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        isSafe: false,
        reason: 'urls.uz havolalarini qayta-qisqartirish (loop) mumkin emas.',
      };
    }

    return { isSafe: true };
  } catch {
    return {
      isSafe: false,
      reason: 'Kiritilgan URL manzil formati noto‘g‘ri.',
    };
  }
}
