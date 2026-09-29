'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  Smartphone,
  QrCode,
  Layers,
  MapPin,
  Lock,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
} from 'lucide-react';

export default function Features() {
  const { locale, t } = useLanguage();

  const capabilities = [
    {
      id: '01',
      tag: 'PROTOCOL ROUTING',
      title: locale === 'uz' ? 'Smart Deep Link Mexanizmi' : locale === 'ru' ? 'Smart Deep Links (Прямо в приложение)' : 'Smart Deep Link Engine',
      description: locale === 'uz'
        ? 'Telegram kanallar, guruhlar, Instagram profillari va YouTube videolari brauzerda qotib qolmasdan to‘g‘ridan-to‘g‘ri mobil ilovada ochiladi.'
        : locale === 'ru'
        ? 'Ссылки на Telegram, Instagram и YouTube открываются сразу в мобильных приложениях без зависания во встроенных браузерах.'
        : 'Bypass internal in-app webview sandboxes. Directly launch native iOS and Android apps via intent schemes with sub-12ms execution.',
      spec: 'Intent Filters: tg:// · instagram:// · youtube://',
    },
    {
      id: '02',
      tag: 'GEO-TELEMETRY',
      title: locale === 'uz' ? 'O‘zbekiston Viloyatlari Tahlili' : locale === 'ru' ? 'Аналитика регионов Узбекистана' : 'Uzbekistan Regional Telemetry',
      description: locale === 'uz'
        ? 'Toshkent shahri, Samarqand, Farg‘ona, Buxoro va barcha 14 ta maʼmuriy hudud bo‘yicha bosishlar, qurilma turlari va manbalar (Telegram/Instagram).'
        : locale === 'ru'
        ? 'Подробная статистика переходов по городам и областям Узбекистана (Ташкент, Самарканд, Бухара и др.), устройствам и источникам.'
        : 'Granular telemetry across all 14 regions of Uzbekistan. Isolate conversion metrics by carrier, platform, and social referrer.',
      spec: '14 Administrative Regions · ISP & Device Attribution',
    },
    {
      id: '03',
      tag: 'VECTOR ENGINE',
      title: locale === 'uz' ? 'Dinamik QR Kod Studio' : locale === 'ru' ? 'Динамическая QR Студия' : 'Dynamic QR Code Studio',
      description: locale === 'uz'
        ? 'Logotip qo‘yish, ranglar, ramkalar va harakatga chaqiruvchi matn. Eng muhimi: QR-kod chop etilgandan keyin ham maqsadli manzilni yangilash mumkin.'
        : locale === 'ru'
        ? 'Кастомные цвета, логотипы, рамки со слоганом и возможность менять целевой адрес даже после печати флаеров.'
        : 'Render engineering-grade vector QR matrices up to 4096px. Hot-swap target destinations on the fly without reprinting packaging.',
      spec: 'Formats: SVG, High-DPI PNG · Levels: L, M, Q, H',
    },
    {
      id: '04',
      tag: 'CRYPTOGRAPHIC SECURITY',
      title: locale === 'uz' ? 'Parol & Muddat Himoyasi' : locale === 'ru' ? 'Защита паролем и лимиты' : 'Cryptographic Access Control',
      description: locale === 'uz'
        ? 'Muhim havolalaringizni maxfiy parol bilan himoyalang, amal qilish muddati yoki maksimal bosishlar sonini aniq belgilang.'
        : locale === 'ru'
        ? 'Защищайте конфиденциальные ссылки паролем, устанавливайте дату сгорания или лимит кликов для эксклюзивных акций.'
        : 'Enforce access protection with SHA-256 password gates, automated expiration TTLs, and click capacity thresholds.',
      spec: 'SHA-256 Hashing · Click Caps · Auto-TTL Expiry',
    },
    {
      id: '05',
      tag: 'DEVELOPER PLATFORM',
      title: locale === 'uz' ? 'Dasturchilar uchun REST API' : locale === 'ru' ? 'REST API для разработчиков' : 'High-Throughput REST API',
      description: locale === 'uz'
        ? 'Havolalarni avtomatlashtirilgan tarzda qisqartirish, API kalitlar yaratish va CRM, Telegram bot hamda tizimlarga bir necha daqiqada ulash.'
        : locale === 'ru'
        ? 'Автоматическое создание ссылок, API ключи и готовые эндпоинты для быстрой интеграции с вашим CRM и Telegram-ботами.'
        : 'Integrate link operations into backend services, bots, and CI/CD pipelines via standard REST endpoints with bearer token auth.',
      spec: 'Bearer Auth · Rate Limiting: 1,000 req/min · JSON Specs',
    },
    {
      id: '06',
      tag: 'RESPONSIVE PORTAL',
      title: locale === 'uz' ? 'Link-in-Bio Sahifalar' : locale === 'ru' ? 'Страницы Link-in-Bio' : 'Link-in-Bio Portal',
      description: locale === 'uz'
        ? 'Instagram, TikTok va Telegram profilingiz uchun shaxsiy @nomli zamonaviy mikro-sahifa. Barcha havolalar va kontaktlar bitta joyda.'
        : locale === 'ru'
        ? 'Стильная мобильная страница с собственным @юзернеймом для Instagram и Telegram. Все ваши контакты и ссылки в одном месте.'
        : 'Consolidate multiple digital channels into a high-converting, responsive micro-portal with custom branding and real-time CTR tracking.',
      spec: 'Custom @handle · Zero Third-party Trackers',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-zinc-950 border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
            <span>ENGINEERING SPECIFICATIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
            {locale === 'uz'
              ? 'Zamonaviy biznes va servislar uchun qudratli vositalar'
              : locale === 'ru'
              ? 'Инструменты корпоративного уровня для бизнеса и разработчиков'
              : 'Production-grade utility engine for modern teams'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {locale === 'uz'
              ? 'Oddiy havolani to‘laqonli marketing kanaliga aylantiring. Oliy darajadagi xavfsizlik, sub-15ms kechikish va chuqur analitika.'
              : locale === 'ru'
              ? 'Превратите обычные ссылки в мощные каналы конверсий с защитой корпоративного уровня и детальной аналитикой.'
              : 'Built for high reliability, minimal redirect latency, and zero dependency on bloated third-party trackers.'}
          </p>
        </div>

        {/* Linear-style Capability Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-zinc-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pb-3 border-b border-zinc-800/60 mb-3.5">
                  <span className="font-semibold text-zinc-400">{item.tag}</span>
                  <span className="text-zinc-600">SPEC-{item.id}</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-zinc-100 mb-2 tracking-tight">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Technical Spec Footnote */}
              <div className="pt-3 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500 truncate">
                {item.spec}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
