'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, Globe, Laptop, ScanLine, Smartphone } from 'lucide-react';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { detectDeviceFromUserAgent } from '@/lib/deep-link';
import { DEVICE_DEMO_APPS, type DeviceDemoApp } from '@/lib/device-demo';
import { copyToClipboard, shortUrl } from '@/lib/utils';
import { SITE_NAME } from '@/lib/site';

type Device = 'ios' | 'android' | 'huawei' | 'desktop';

const DEVICES: { id: Device; label: string; store: string; icon: typeof Smartphone }[] = [
  { id: 'ios', label: 'iPhone / iPad', store: 'App Store', icon: Smartphone },
  { id: 'android', label: 'Android', store: 'Google Play', icon: Smartphone },
  { id: 'huawei', label: 'Huawei', store: 'AppGallery', icon: Smartphone },
  { id: 'desktop', label: 'Kompyuter', store: 'Veb-sayt', icon: Laptop },
];

/** Where the app's short link sends each device (the same rules the redirect uses). */
function destinationFor(app: DeviceDemoApp, device: Device): { url: string; fallback: boolean } {
  if (device === 'ios') return { url: app.ios, fallback: false };
  if (device === 'android') return { url: app.android, fallback: false };
  if (device === 'huawei') return app.huawei ? { url: app.huawei, fallback: false } : { url: app.web, fallback: true };
  return { url: app.web, fallback: false };
}

const noSubscribe = () => () => {};

/** The visitor's own device, read from the browser (null while rendering on the server). */
function useVisitorDevice(): Device | null {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      const type = detectDeviceFromUserAgent(navigator.userAgent).deviceType;
      return type === 'other' ? null : type;
    },
    () => null
  );
}

/**
 * "One link, every device": real short links from the demo workspace. The
 * table shows where each device goes; the QR code can be scanned with a phone
 * to see the routing happen.
 */
export default function SmartDeepLinkSection() {
  const [app, setApp] = useState(DEVICE_DEMO_APPS[0]);
  const visitorDevice = useVisitorDevice();
  const [picked, setPicked] = useState<Device | null>(null);
  const device = picked ?? visitorDevice ?? 'ios';
  const [copied, setCopied] = useState(false);

  const link = shortUrl(app.slug);
  const linkLabel = link.replace(/^https?:\/\//, '');
  const onMobile = visitorDevice !== null && visitorDevice !== 'desktop';

  const copy = async () => {
    if (!(await copyToClipboard(link))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="device-routing" className="relative py-20 border-t border-zinc-800/80 bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 pb-6 border-b border-zinc-800/80">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Qurilma bo‘yicha yo‘naltirish</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Bitta havola — har bir qurilma o‘z do‘koniga</h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Havolani kim ochganini {SITE_NAME} aniqlaydi: iPhone — App Store, Android — Google Play, Huawei — AppGallery, kompyuter — veb-sayt.
            QR kodni telefoningiz bilan skanerlab, o‘zingiz sinab ko‘ring.
          </p>
        </div>

        {/* 1. The app */}
        <div className="mb-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2.5">1. Ilovani tanlang</div>
          <div role="radiogroup" aria-label="Ilova" className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {DEVICE_DEMO_APPS.map((a) => {
              const selected = a.id === app.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setApp(a)}
                  className={`text-left p-3 rounded-lg border transition-all duration-150 flex items-center gap-3 min-w-0 ${
                    selected ? 'bg-zinc-900 border-zinc-600 shadow-sm' : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0"
                    style={{ color: a.color, backgroundColor: `${a.color}1A`, borderColor: `${a.color}4D` }}
                    aria-hidden
                  >
                    {a.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-white truncate">{a.name}</span>
                    <span className="block text-[11px] text-zinc-400 truncate">{a.category}</span>
                    <span className="block text-[10px] font-mono text-zinc-500 truncate">/{a.slug}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* 2. Where each device goes */}
          <div className="lg:col-span-7 bg-[#101014] border border-zinc-800 rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800/80">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">2. Qaysi qurilma qayerga boradi</div>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-200"
                title="Havoladan nusxa olish"
              >
                {linkLabel}
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
            </div>

            <ul className="space-y-2">
              {DEVICES.map((d) => {
                const dest = destinationFor(app, d.id);
                const active = d.id === device;
                const Icon = d.icon;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setPicked(d.id)}
                      aria-pressed={active}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        active ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-xs font-semibold text-white">
                          <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          {d.label}
                          {visitorDevice === d.id && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">SIZ</span>
                          )}
                        </span>
                        <span className={`flex items-center gap-1.5 text-[11px] font-medium ${dest.fallback ? 'text-amber-300' : 'text-zinc-300'}`}>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                          {dest.fallback ? 'Veb-sayt (zaxira)' : d.store}
                        </span>
                      </div>
                      <div className="mt-1.5 pl-6 text-[11px] font-mono text-zinc-500 truncate" title={dest.url}>
                        {decodeURI(dest.url)}
                      </div>
                      {dest.fallback && (
                        <div className="mt-1 pl-6 text-[11px] text-amber-200/80">AppGallery’da ilova yo‘q — foydalanuvchi veb-saytga o‘tadi.</div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed flex gap-2">
              <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Qoidasi yo‘q qurilmalar asosiy manzilga boradi. Har bir o‘tish analitikada qurilma, OS va viloyat bilan hisoblanadi.
            </p>
          </div>

          {/* 3. Try it on a real phone */}
          <div className="lg:col-span-5 bg-[#101014] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5" /> 3. Telefoningizda sinab ko‘ring
            </div>
            <QrCanvas value={link} size={200} fgColor="#0f172a" bgColor="#ffffff" bodyShape="rounded" eyeFrameShape="rounded" eyeBallShape="rounded" centerLogo="none" frameStyle="none" showControls={false} />
            <div>
              <div className="text-sm font-mono text-white">{linkLabel}</div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Kamera bilan skanerlang: iPhone’da App Store, Android’da Google Play, Huawei’da AppGallery ochiladi.
              </p>
            </div>
            {onMobile && (
              // A phone can't scan its own screen: open the link directly instead
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
              >
                Shu telefonda ochish <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
