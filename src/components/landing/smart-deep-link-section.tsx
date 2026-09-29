'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Cpu,
  Zap,
  RefreshCw,
  Play,
  Share2,
  Store,
} from 'lucide-react';

interface AppPreset {
  id: string;
  name: string;
  category: string;
  shortSlug: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  iosUrl: string;
  iosScheme: string;
  androidUrl: string;
  androidScheme: string;
  huaweiUrl: string;
  huaweiScheme: string;
  desktopUrl: string;
  rating: string;
  reviews: string;
  size: string;
  developer: string;
  description: string;
}

const PRESETS: AppPreset[] = [
  {
    id: 'payme',
    name: 'Payme Uzbekistan',
    category: 'Fintech & To‘lovlar',
    shortSlug: 'urls.uz/payme-p2p',
    badge: 'UZ_FINTECH',
    iconBg: 'bg-[#00CCCC]/10 border-[#00CCCC]/30',
    iconColor: 'text-[#00CCCC]',
    iosUrl: 'https://apps.apple.com/uz/app/payme/id1044439055',
    iosScheme: 'payme://transfer?amount=50000',
    androidUrl: 'https://play.google.com/store/apps/details?id=uz.payme.android',
    androidScheme: 'market://details?id=uz.payme.android',
    huaweiUrl: 'https://appgallery.huawei.com/app/C101438781',
    huaweiScheme: 'appmarket://details?id=C101438781',
    desktopUrl: 'https://payme.uz/dashboard',
    rating: '4.8 ★',
    reviews: '340K sharh',
    size: '48.2 MB',
    developer: 'Paycom Technologies LLC',
    description: 'Barcha kartalar o‘rtasida 0% gacha pul o‘tkazmalari va qulay to‘lovlar.',
  },
  {
    id: 'uzum',
    name: 'Uzum Market',
    category: 'E-Commerce & Do‘kon',
    shortSlug: 'urls.uz/uzum-flash',
    badge: 'ECOMMERCE',
    iconBg: 'bg-[#7000FF]/10 border-[#7000FF]/30',
    iconColor: 'text-[#7000FF]',
    iosUrl: 'https://apps.apple.com/uz/app/uzum-market/id1640483863',
    iosScheme: 'uzum://product/98124',
    androidUrl: 'https://play.google.com/store/apps/details?id=uz.uzum.app',
    androidScheme: 'market://details?id=uz.uzum.app',
    huaweiUrl: 'https://appgallery.huawei.com/app/C107293021',
    huaweiScheme: 'appmarket://details?id=C107293021',
    desktopUrl: 'https://uzum.uz/product/98124',
    rating: '4.9 ★',
    reviews: '850K sharh',
    size: '62.4 MB',
    developer: 'Uzum Market LLC',
    description: '1 kunda bepul yetkazib berish bilan 600,000 dan ortiq tovarlar.',
  },
  {
    id: 'telegram',
    name: 'Telegram Messenger',
    category: 'Aloqa & Kanallar',
    shortSlug: 'urls.uz/community',
    badge: 'MESSENGER',
    iconBg: 'bg-[#229ED9]/10 border-[#229ED9]/30',
    iconColor: 'text-[#229ED9]',
    iosUrl: 'https://apps.apple.com/app/telegram-messenger/id686449807',
    iosScheme: 'tg://resolve?domain=urls_uz',
    androidUrl: 'https://play.google.com/store/apps/details?id=org.telegram.messenger',
    androidScheme: 'market://details?id=org.telegram.messenger',
    huaweiUrl: 'https://appgallery.huawei.com/app/C101449801',
    huaweiScheme: 'appmarket://details?id=C101449801',
    desktopUrl: 'https://web.telegram.org/k/#@urls_uz',
    rating: '4.7 ★',
    reviews: '12M sharh',
    size: '89.1 MB',
    developer: 'Telegram FZ-LLC',
    description: 'Tezkor, xavfsiz va barcha qurilmalarda sinxronlashuvchi global messenjer.',
  },
  {
    id: 'yandex',
    name: 'Yandex Go Superapp',
    category: 'Taksi & Yetkazish',
    shortSlug: 'urls.uz/ride-home',
    badge: 'SUPERAPP',
    iconBg: 'bg-[#FC3F1D]/10 border-[#FC3F1D]/30',
    iconColor: 'text-[#FC3F1D]',
    iosUrl: 'https://apps.apple.com/app/yandex-go/id472650586',
    iosScheme: 'yandextaxi://route?end-lat=41.311081&end-lon=69.240562',
    androidUrl: 'https://play.google.com/store/apps/details?id=ru.yandex.taxi',
    androidScheme: 'market://details?id=ru.yandex.taxi',
    huaweiUrl: 'https://appgallery.huawei.com/app/C101166687',
    huaweiScheme: 'appmarket://details?id=C101166687',
    desktopUrl: 'https://taxi.yandex.uz',
    rating: '4.8 ★',
    reviews: '4.5M sharh',
    size: '74.8 MB',
    developer: 'Ridetech International B.V.',
    description: 'Shahar bo‘ylab qulay taksi, ovqat yetkazish va kuryerlik xizmati.',
  },
];

type DeviceTarget = 'ios' | 'android' | 'huawei' | 'desktop';

interface DeviceSpec {
  id: DeviceTarget;
  label: string;
  osName: string;
  deviceModel: string;
  uaSnippet: string;
  badge: string;
}

const DEVICES: DeviceSpec[] = [
  {
    id: 'ios',
    label: 'Apple iOS',
    osName: 'iOS 18.1 Safari',
    deviceModel: 'iPhone 16 Pro',
    uaSnippet: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    badge: 'APP STORE / UNIVERSAL',
  },
  {
    id: 'android',
    label: 'Google Android',
    osName: 'Android 15 Chrome',
    deviceModel: 'Galaxy S24 Ultra',
    uaSnippet: 'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36',
    badge: 'GOOGLE PLAY / INTENT',
  },
  {
    id: 'huawei',
    label: 'Huawei HarmonyOS',
    osName: 'HarmonyOS 4.2 Petal',
    deviceModel: 'HUAWEI Mate 60 Pro',
    uaSnippet: 'Mozilla/5.0 (Linux; Android 12; ALN-AL00; HMSCore 6.13) AppleWebKit/537.36 PetalBrowser/14.0',
    badge: 'HUAWEI APPGALLERY',
  },
  {
    id: 'desktop',
    label: 'Desktop Workstation',
    osName: 'macOS / Windows 11',
    deviceModel: 'MacBook Pro 16"',
    uaSnippet: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
    badge: 'RESPONSIVE WEB APP',
  },
];

export default function SmartDeepLinkSection() {
  const [activePreset, setActivePreset] = useState<AppPreset>(PRESETS[0]);
  const [activeDevice, setActiveDevice] = useState<DeviceTarget>('ios');
  const [isSimulating, setIsSimulating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(4);
  const [copiedLink, setCopiedLink] = useState(false);
  const [latency, setLatency] = useState(7.4);

  const selectedDevice = DEVICES.find((d) => d.id === activeDevice) || DEVICES[0];

  // Resolve target url and scheme based on active device
  const getResolution = () => {
    switch (activeDevice) {
      case 'ios':
        return {
          targetUrl: activePreset.iosUrl,
          scheme: activePreset.iosScheme,
          channel: 'Apple App Store (StoreKit Intent)',
          statusCode: '307 Temporary Redirect',
        };
      case 'android':
        return {
          targetUrl: activePreset.androidUrl,
          scheme: activePreset.androidScheme,
          channel: 'Google Play Store (Market Intent)',
          statusCode: '307 Temporary Redirect',
        };
      case 'huawei':
        return {
          targetUrl: activePreset.huaweiUrl,
          scheme: activePreset.huaweiScheme,
          channel: 'Huawei AppGallery (HMS Core)',
          statusCode: '307 Temporary Redirect',
        };
      case 'desktop':
      default:
        return {
          targetUrl: activePreset.desktopUrl,
          scheme: activePreset.desktopUrl,
          channel: 'Production Web Application',
          statusCode: '307 Temporary Redirect',
        };
    }
  };

  const resolution = getResolution();

  const handleSimulate = () => {
    setIsSimulating(true);
    setPipelineStep(1);
    setLatency(Number((6.2 + Math.random() * 3.5).toFixed(1)));

    setTimeout(() => setPipelineStep(2), 200);
    setTimeout(() => setPipelineStep(3), 420);
    setTimeout(() => {
      setPipelineStep(4);
      setIsSimulating(false);
    }, 650);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <section className="relative py-20 border-t border-zinc-800/80 bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SPEC // DYNAMIC_DEVICE_ROUTING_V2</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Bitta havola — Har bir qurilmaga aniq yo‘l
            </h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              <span className="font-mono text-zinc-200">urls.uz</span> har bir so‘rovni <span className="font-mono text-emerald-400">sub-10ms</span> da tahlil qiladi va foydalanuvchini mos ekotizim (App Store, Google Play, AppGallery yoki Web) hamda native ilovaga yo‘naltiradi.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              ENGINE SLA: <span className="text-emerald-400 font-semibold tabular-nums">99.995%</span>
            </span>
          </div>
        </div>

        {/* Interactive App Preset Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              1. ILUSTROTIV TEST PRESETNI TANLANG:
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Active Slug: <span className="text-white font-medium">{activePreset.shortSlug}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = activePreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setActivePreset(preset);
                    handleSimulate();
                  }}
                  className={`text-left p-3 rounded-lg border transition-all duration-150 ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-600 shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white tracking-tight truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{preset.badge}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mb-1">
                    {preset.category}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{preset.rating}</span>
                    <span className="text-zinc-400">{preset.shortSlug.replace('urls.uz/', '')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Device Hardware Target Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              2. TAHLIL QILINAYOTGAN FOYDALANUVCHI QURILMASI (USER-AGENT EMULATION):
            </span>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Re-run Routing ({latency}ms)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DEVICES.map((dev) => {
              const isSelected = activeDevice === dev.id;
              return (
                <button
                  key={dev.id}
                  onClick={() => {
                    setActiveDevice(dev.id);
                    handleSimulate();
                  }}
                  className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-500 ring-1 ring-zinc-500 shadow-md'
                      : 'bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {dev.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 truncate">
                    {dev.deviceModel}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1 truncate">
                    {dev.osName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Console: Left Edge Inspector & Right Live Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Console: Edge Telemetry & Resolution Pipeline (7 cols) */}
          <div className="lg:col-span-7 bg-[#101014] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80 text-xs font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>EDGE_DISPATCH_INSPECTOR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <Zap className="w-3 h-3" />
                    <span className="tabular-nums font-semibold">{latency}ms</span> latency
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">HTTP/2</span>
                </div>
              </div>

              {/* Simulated Incoming Request Packet */}
              <div className="mb-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800/90 font-mono text-xs">
                <div className="text-[10px] uppercase text-zinc-500 mb-1 flex items-center justify-between">
                  <span>INCOMING INGRESS REQUEST</span>
                  <span className="text-emerald-400">EDGE POP: TAS-01 (TASHKENT)</span>
                </div>
                <div className="text-zinc-200">
                  <span className="text-indigo-400 font-semibold">GET</span> /{activePreset.shortSlug.replace('urls.uz/', '')} HTTP/2.0
                </div>
                <div className="text-zinc-400 text-[11px] truncate mt-0.5">
                  Host: urls.uz
                </div>
                <div className="text-zinc-500 text-[10px] truncate mt-0.5">
                  User-Agent: {selectedDevice.uaSnippet}
                </div>
              </div>

              {/* 4-Step Decision Pipeline */}
              <div className="space-y-2 mb-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  ROUTING DECISION PIPELINE:
                </div>

                {/* Step 1 */}
                <div className={`p-2.5 rounded-lg border text-xs font-mono transition-all duration-150 ${
                  pipelineStep >= 1 ? 'bg-zinc-900/80 border-zinc-700/80 text-zinc-200' : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">[01]</span>
                      <span>INSPECT_CLIENT_PLATFORM</span>
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      MATCH: {selectedDevice.id.toUpperCase()} ({selectedDevice.osName})
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-2.5 rounded-lg border text-xs font-mono transition-all duration-150 ${
                  pipelineStep >= 2 ? 'bg-zinc-900/80 border-zinc-700/80 text-zinc-200' : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">[02]</span>
                      <span>POLICY_EVALUATION</span>
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      RULE: {activeDevice.toUpperCase()}_URL DEFINED $\rightarrow$ TRUE
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-2.5 rounded-lg border text-xs font-mono transition-all duration-150 ${
                  pipelineStep >= 3 ? 'bg-zinc-900/80 border-zinc-700/80 text-zinc-200' : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">[03]</span>
                      <span>DEEP_LINK_SCHEME_RESOLUTION</span>
                    </span>
                    <span className="text-[10px] text-indigo-400 truncate max-w-[200px]">
                      {resolution.scheme}
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`p-2.5 rounded-lg border text-xs font-mono transition-all duration-150 ${
                  pipelineStep >= 4 ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-500">[04]</span>
                      <span>DISPATCH_REDIRECT</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400">
                      HTTP 307 ({latency}ms)
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolved Destination Box */}
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>DISPATCHED_TARGET_DESTINATION</span>
                  <span className="text-emerald-400 font-medium">{resolution.channel}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-zinc-200 truncate select-all">
                    {resolution.targetUrl}
                  </code>
                  <button
                    onClick={() => handleCopy(resolution.targetUrl)}
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors shrink-0"
                    title="Nusxalash"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero interstitial delay • Direct protocol handoff</span>
              </span>
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate Redirect</span>
              </button>
            </div>
          </div>

          {/* Right Console: Realistic Hardware Viewport Simulator (5 cols) */}
          <div className="lg:col-span-5 bg-[#101014] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center">
            {/* Viewport Chassis Container */}
            <div className="w-full max-w-[320px]">
              {/* Device Frame */}
              <div className="bg-zinc-950 border border-zinc-700/80 rounded-3xl p-3 shadow-2xl relative overflow-hidden">
                {/* Dynamic Island / Camera Notch */}
                {activeDevice === 'ios' && (
                  <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>
                )}
                {activeDevice === 'android' && (
                  <div className="w-3 h-3 bg-zinc-900 rounded-full mx-auto mb-3" />
                )}
                {activeDevice === 'huawei' && (
                  <div className="flex justify-center gap-1.5 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                  </div>
                )}
                {activeDevice === 'desktop' && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] font-mono text-zinc-500">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span>urls.uz / engine</span>
                  </div>
                )}

                {/* Simulated Screen Body */}
                <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800/80 space-y-3.5">
                  {/* Browser URL pill */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1 text-zinc-300">
                      <span className="text-zinc-500">https://</span>
                      <span>{activePreset.shortSlug}</span>
                    </span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      307
                    </span>
                  </div>

                  {/* Native App Card / Intent Prompt */}
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/90">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${activePreset.iconBg} ${activePreset.iconColor}`}>
                        {activePreset.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white tracking-tight truncate">
                          {activePreset.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {activePreset.developer}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                      {activePreset.description}
                    </p>

                    {/* App Metadata grid */}
                    <div className="grid grid-cols-3 gap-1 py-2 mb-3 border-y border-zinc-800/80 text-center font-mono text-[10px]">
                      <div>
                        <div className="text-zinc-500">RATING</div>
                        <div className="text-zinc-200 font-semibold">{activePreset.rating}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">REVIEWS</div>
                        <div className="text-zinc-200 font-semibold">{activePreset.reviews}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">SIZE</div>
                        <div className="text-zinc-200 font-semibold">{activePreset.size}</div>
                      </div>
                    </div>

                    {/* Native Deep Link Handshake Button */}
                    <div className="space-y-1.5">
                      <a
                        href={resolution.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg text-xs transition-colors"
                      >
                        <span>{activeDevice === 'desktop' ? 'Veb-saytga o‘tish' : 'Ilovani ochish'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>

                      <div className="text-center">
                        <span className="text-[10px] font-mono text-zinc-500">
                          Scheme: <span className="text-zinc-400">{resolution.scheme.split('?')[0]}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device Specific Hardware Note */}
                  <div className="text-center">
                    <span className="inline-block text-[10px] font-mono text-zinc-500 uppercase">
                      TARGET: {selectedDevice.badge}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Technical Specification Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          <div className="p-3.5 bg-[#101014] border border-zinc-800 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 flex items-center justify-between">
              <span>SPEC-D01</span>
              <span className="text-emerald-400">iOS Universal</span>
            </div>
            <div className="text-xs font-semibold text-white mb-1">Apple App Store & Deep Links</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Safari brauzerida to‘xtalib qolmasdan to‘g‘ridan-to‘g‘ri App Store kartochkasi yoki o‘rnatilgan ilova ekraniga o‘tadi.
            </p>
          </div>

          <div className="p-3.5 bg-[#101014] border border-zinc-800 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 flex items-center justify-between">
              <span>SPEC-D02</span>
              <span className="text-emerald-400">Android Intents</span>
            </div>
            <div className="text-xs font-semibold text-white mb-1">Google Play & App Links</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Chrome intents protokoli orqali ilova mavjud bo‘lsa bir zumda ochiladi, aks holda Google Play o‘rnatish sahifasiga yo‘naladi.
            </p>
          </div>

          <div className="p-3.5 bg-[#101014] border border-zinc-800 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 flex items-center justify-between">
              <span>SPEC-D03</span>
              <span className="text-emerald-400">HMS Core</span>
            </div>
            <div className="text-xs font-semibold text-white mb-1">Huawei AppGallery Targeting</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Google servislarisiz ishlaydigan Huawei va Honor smartfonlarini aniqlab, Huawei AppGallery manziliga silliq uzatadi.
            </p>
          </div>

          <div className="p-3.5 bg-[#101014] border border-zinc-800 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 mb-1 flex items-center justify-between">
              <span>SPEC-D04</span>
              <span className="text-emerald-400">Desktop Web</span>
            </div>
            <div className="text-xs font-semibold text-white mb-1">Full-Scale Desktop Experience</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Kompyuter yoki noutbuk orqali kirgan foydalanuvchilar to‘g‘ridan-to‘g‘ri veb-sahifa yoki desktop dasturga yo‘naltiriladi.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
