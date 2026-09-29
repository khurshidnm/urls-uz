'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, ExternalLink, ArrowRight } from 'lucide-react';
import { DeepLinkResult } from '@/lib/deep-link';

interface DeepLinkRedirectorProps {
  deepLink: DeepLinkResult;
  title: string;
  targetUrl: string;
}

export default function DeepLinkRedirector({
  deepLink,
  title,
  targetUrl,
}: DeepLinkRedirectorProps) {
  const [seconds, setSeconds] = useState(2);

  useEffect(() => {
    // Attempt automatic scheme opening
    const timer = setTimeout(() => {
      window.location.href = deepLink.nativeScheme;
    }, 400);

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
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
        {/* Animated App Icon Glow */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-slate-900 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <span>Smart Deep Link</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-6">
          {deepLink.appName} ilovasi ochilmoqda... Agar avtomatik ochilmasa, quyidagi tugmani bosing.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={deepLink.nativeScheme}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-btn text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all text-sm"
          >
            <span>{deepLink.appName} ilovasida ochish</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href={targetUrl}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium rounded-xl border border-slate-700/60 transition-colors text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Brauzerda davom etish</span>
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <span>Quvvatlanadi:</span>
          <span className="font-semibold text-slate-400">urls.uz</span>
        </div>
      </div>
    </div>
  );
}
