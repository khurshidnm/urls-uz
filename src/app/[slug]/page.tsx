import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import { detectAndBuildDeepLink, resolveDeviceRedirect } from '@/lib/deep-link';
import { resolveRegionFromHeaders } from '@/lib/geo';
import { getClientIp } from '@/lib/auth';
import { hashIp, isUnlocked, unlockCookieName } from '@/lib/link-unlock';
import { isReservedSlug, appendUtmParams } from '@/lib/utils';
import { UAParser } from 'ua-parser-js';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import PasswordUnlockForm from './password-form';
import DeepLinkRedirector from './deep-link-redirector';
import HostedQrPage from './hosted-qr-page';
import { qrRepo } from '@/lib/qr/qr-repo';
import { isHostedType } from '@/lib/qr/content';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SlugRedirectPage({ params }: Props) {
  const { slug } = await params;

  // Reserved paths guard (e.g. /api, /dashboard, /login, /settings, /bio, etc.)
  if (isReservedSlug(slug) || ['favicon.ico', '_next', 'robots.txt'].includes(slug)) {
    notFound();
  }

  const link = await db.getLinkBySlug(slug);

  if (!link) {
    notFound();
  }

  // 1. Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 rounded-xl p-8 text-center border border-zinc-800 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            STATUS // EXPIRED_LINK
          </span>
          <h2 className="text-lg font-semibold text-white mb-2 tracking-tight">Havola muddati tugagan</h2>
          <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
            Ushbu qisqa havolaning amal qilish muddati o‘tib ketgan. Yangi maʼlumot olish uchun havola egasi bilan bog‘laning.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>urls.uz Bosh sahifasi</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Check click limit
  if (link.click_limit && link.click_count >= link.click_limit) {
    return <ClickLimitReached />;
  }

  // 3. Password protection (the destination is never sent to the browser before unlock)
  const cookieStore = await cookies();
  if (link.password && !isUnlocked(link, cookieStore.get(unlockCookieName(link))?.value)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 rounded-xl p-8 border border-zinc-800 shadow-xl">
          <div className="w-12 h-12 bg-zinc-800 text-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4 border border-zinc-700">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center mb-6">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 mb-2">
              AUTH // SECURED_REDIRECT
            </span>
            <h2 className="text-lg font-semibold text-white tracking-tight">Havola parol bilan himoyalangan</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Manzilga xavfsiz o‘tish uchun belgilangan parolni kiriting.
            </p>
          </div>
          <PasswordUnlockForm slug={slug} />
        </div>
      </div>
    );
  }

  // 4. Resolve headers, UA and Geo for Analytics Tracking
  const headerList = await headers();
  const userAgentStr = headerList.get('user-agent') || '';
  const refererStr = headerList.get('referer') || 'Direct';

  const parser = new UAParser(userAgentStr);
  // ua-parser-js leaves device type empty for desktops
  const deviceType = parser.getDevice().type || (userAgentStr ? 'desktop' : 'Unknown');
  const osName = parser.getOS().name || 'Unknown';
  const browserName = parser.getBrowser().name || 'Unknown';

  const geoInfo = resolveRegionFromHeaders(headerList);

  // 4. Analytics Async Isolation: Tracking failures must never interrupt the redirect flow.
  // Link-preview crawlers (Telegram, WhatsApp, ...) are not visitors and are not counted.
  let withinLimit = true;
  if (!BOT_UA.test(userAgentStr)) {
    try {
      withinLimit = await db.recordClick({
        link_id: link.id,
        ip_hash: hashIp(getClientIp(headerList)),
        referer: refererStr.includes('t.me') ? 'Telegram' : refererStr.includes('instagram') ? 'Instagram' : refererStr.includes('google') ? 'Google' : 'Direct',
        country: geoInfo.country,
        region: geoInfo.region,
        city: geoInfo.city,
        device_type: deviceType,
        os: osName,
        browser: browserName,
      });
    } catch (trackingErr) {
      // Non-fatal telemetry failure log; client redirect proceeds unaffected
      console.error('[Analytics Async Isolation] Telemetry warning:', trackingErr);
    }
  }

  // Another request used the last allowed click between the check above and now
  if (!withinLimit) {
    return <ClickLimitReached />;
  }

  // Dynamic vCard / event / text QR codes open their (editable) page instead of redirecting
  if (link.source === 'qr') {
    const qr = await qrRepo.getByLinkId(link.id);
    if (qr && isHostedType(qr.type)) return <HostedQrPage qr={qr} />;
  }

  // 5. Intelligent Device Routing (iOS, Huawei, Android, Desktop, Fallback)
  const deviceResolution = resolveDeviceRedirect(
    {
      destination_url: link.destination_url,
      ios_url: link.ios_url,
      android_url: link.android_url,
      huawei_url: link.huawei_url,
      desktop_url: link.desktop_url,
    },
    userAgentStr,
    osName
  );

  // 6. UTM Parameter Integrity: Append query parameters while preserving any existing ones
  const targetUrl = appendUtmParams(deviceResolution.targetUrl, {
    source: link.utm_source,
    medium: link.utm_medium,
    campaign: link.utm_campaign,
    term: link.utm_term,
    content: link.utm_content,
  });

  // 6. Smart deep link detection
  const deepLink = detectAndBuildDeepLink(targetUrl);

  if (link.open_in_app && deepLink.isDeepLinkable) {
    return (
      <DeepLinkRedirector
        deepLink={deepLink}
        title={link.title}
        targetUrl={targetUrl}
        matchedDevice={deviceResolution.matchedRule}
      />
    );
  }

  // Direct fast HTTP 307 redirect (sub-15ms)
  redirect(targetUrl);
}

const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|discord|embedly|vkshare|skypeuripreview|headless/i;

function ClickLimitReached() {
  return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 rounded-xl p-8 text-center border border-zinc-800 shadow-xl">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            STATUS // CLICK_LIMIT_REACHED
          </span>
          <h2 className="text-lg font-semibold text-white mb-2 tracking-tight">Bosishlar limiti tugagan</h2>
          <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
            Ushbu havola uchun ajratilgan maksimal tashriflar soniga yetib bo‘lingan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>urls.uz Bosh sahifasi</span>
          </Link>
        </div>
      </div>
  );
}
