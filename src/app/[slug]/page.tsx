import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { detectAndBuildDeepLink } from '@/lib/deep-link';
import { resolveRegionFromHeaders } from '@/lib/geo';
import { UAParser } from 'ua-parser-js';
import { Lock, AlertCircle, ExternalLink, Smartphone } from 'lucide-react';
import PasswordUnlockForm from './password-form';
import DeepLinkRedirector from './deep-link-redirector';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SlugRedirectPage({ params }: Props) {
  const { slug } = await params;

  // Reserved paths guard
  if (['dashboard', 'api', 'b', 'favicon.ico', '_next'].includes(slug)) {
    notFound();
  }

  const link = db.getLinkBySlug(slug);

  if (!link) {
    notFound();
  }

  // 1. Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Havola muddati tugagan</h2>
          <p className="text-slate-400 text-sm mb-6">
            Ushbu qisqa havolaning amal qilish muddati o‘tib ketgan. Yangi maʼlumot olish uchun havola egasi bilan bog‘laning.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            urls.uz Bosh sahifasiga qaytish
          </a>
        </div>
      </div>
    );
  }

  // 2. Check click limit
  if (link.click_limit && link.click_count >= link.click_limit) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Bosishlar limiti tugagan</h2>
          <p className="text-slate-400 text-sm mb-6">
            Ushbu havola uchun ajratilgan maksimal tashriflar soniga yetib bo‘lingan.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            urls.uz Bosh sahifasiga qaytish
          </a>
        </div>
      </div>
    );
  }

  // 3. Password protection
  if (link.password) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-1">Havola parol bilan himoyalangan</h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Manzilga o‘tish uchun belgilangan parolni kiriting.
          </p>
          <PasswordUnlockForm slug={slug} destinationUrl={link.destination_url} />
        </div>
      </div>
    );
  }

  // 4. Resolve headers, UA and Geo for Analytics Tracking
  const headerList = await headers();
  const userAgentStr = headerList.get('user-agent') || '';
  const refererStr = headerList.get('referer') || 'Direct';

  const parser = new UAParser(userAgentStr);
  const deviceType = parser.getDevice().type || 'desktop';
  const osName = parser.getOS().name || 'Other';
  const browserName = parser.getBrowser().name || 'Other';

  const geoInfo = resolveRegionFromHeaders(headerList);

  // Record click in database
  db.recordClick({
    link_id: link.id,
    referer: refererStr.includes('t.me') ? 'Telegram' : refererStr.includes('instagram') ? 'Instagram' : refererStr.includes('google') ? 'Google' : 'Direct',
    country: geoInfo.country,
    region: geoInfo.region,
    city: geoInfo.city,
    device_type: deviceType,
    os: osName,
    browser: browserName,
  });

  // 5. Device targeting routing
  let targetUrl = link.destination_url;
  if (osName.toLowerCase().includes('ios') && link.ios_url) {
    targetUrl = link.ios_url;
  } else if (osName.toLowerCase().includes('android') && link.android_url) {
    targetUrl = link.android_url;
  }

  // Append UTM parameters if defined
  try {
    const urlObj = new URL(targetUrl);
    if (link.utm_source) urlObj.searchParams.set('utm_source', link.utm_source);
    if (link.utm_medium) urlObj.searchParams.set('utm_medium', link.utm_medium);
    if (link.utm_campaign) urlObj.searchParams.set('utm_campaign', link.utm_campaign);
    if (link.utm_term) urlObj.searchParams.set('utm_term', link.utm_term);
    if (link.utm_content) urlObj.searchParams.set('utm_content', link.utm_content);
    targetUrl = urlObj.toString();
  } catch {
    // If invalid URL, keep targetUrl
  }

  // 6. Smart deep link detection
  const deepLink = detectAndBuildDeepLink(targetUrl);

  if (link.open_in_app && deepLink.isDeepLinkable) {
    return (
      <DeepLinkRedirector
        deepLink={deepLink}
        title={link.title}
        targetUrl={targetUrl}
      />
    );
  }

  // Direct fast redirect (sub-30ms)
  redirect(targetUrl);
}
