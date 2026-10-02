'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, ExternalLink, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DeepLinkResult } from '@/lib/deep-link';
import { SITE_NAME } from '@/lib/site';

interface DeepLinkRedirectorProps {
  deepLink: DeepLinkResult;
  title: string;
  targetUrl: string;
  matchedDevice?: 'ios' | 'android' | 'huawei' | 'desktop' | 'fallback';
}

import { useLanguage } from '@/lib/language-context';

export default function DeepLinkRedirector({
  deepLink,
  title,
  targetUrl,
  matchedDevice = 'fallback',
}: DeepLinkRedirectorProps) {
  const { tr } = useLanguage();
  const [seconds, setSeconds] = useState(2);
  const [schemeFired, setSchemeFired] = useState(false);

  useEffect(() => {
    // Attempt automatic scheme opening
    const timer = setTimeout(() => {
      window.location.href = deepLink.nativeScheme;
      setSchemeFired(true);
    }, 300);

    const countdown = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [deepLink.nativeScheme]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900/90 rounded-xl p-6 sm:p-8 border border-zinc-800 shadow-xl text-center">
        {/* Engineering Indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-6 pb-3 border-b border-zinc-800">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ENGINE // SMART_DISPATCH
          </span>
          <span className="uppercase text-zinc-400">DEVICE: {matchedDevice}</span>
        </div>

        {/* App Icon Node */}
        <div className="relative mx-auto w-16 h-16 mb-5">
          <div className="w-full h-full bg-zinc-950 border border-zinc-700 rounded-xl flex items-center justify-center shadow-md">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-white mb-1 tracking-tight">{title}</h2>
        <p className="text-zinc-400 text-xs mb-4">
          {tr('Ilova ochilmoqda:', 'Открываем приложение', 'Opening')} <span className="text-zinc-200 font-medium">{deepLink.appName}</span>.{' '}
          {tr('Agar ilova avtomatik ochilmasa, pastdagi tugmani bosing.', 'Если оно не открылось само, нажмите кнопку ниже.', 'If it doesn’t open by itself, tap the button below.')}
        </p>

        {/* Monospace Deep Link Scheme Preview */}
        <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-left mb-5">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
            <span>TARGET_SCHEME</span>
            <span>{seconds > 0 ? `AUTO_FIRE IN ${seconds}s` : 'DISPATCHED'}</span>
          </div>
          <code className="text-[11px] font-mono text-zinc-300 break-all select-all">
            {deepLink.nativeScheme}
          </code>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={deepLink.nativeScheme}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-medium rounded-lg transition-colors text-xs"
          >
            <span>{tr(`${deepLink.appName} ilovasida ochish`, `Открыть в ${deepLink.appName}`, `Open in ${deepLink.appName}`)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <a
            href={targetUrl}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium rounded-lg border border-zinc-800 transition-colors text-xs font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{tr('Brauzer orqali davom etish', 'Продолжить в браузере', 'Continue in the browser')}</span>
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Anti-Phishing Verified</span>
          </span>
          <span className="text-zinc-400">{SITE_NAME}</span>
        </div>
      </div>
    </div>
  );
}
