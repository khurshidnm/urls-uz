'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  Smartphone,
  QrCode,
  Layers,
  MapPin,
  Lock,
  Code2,
  ArrowUpRight,
} from 'lucide-react';

export default function Features() {
  const { locale, t } = useLanguage();

  const features = [
    {
      icon: Smartphone,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      title: locale === 'uz' ? 'Smart Deep Links (Ilovada ochish)' : locale === 'ru' ? 'Smart Deep Links (Прямо в приложение)' : 'Smart Deep Links',
      description: locale === 'uz'
        ? 'Telegram kanallar, guruhlar, Instagram profillari va YouTube videolari brauzerda qotib qolmasdan to‘g‘ridan-to‘g‘ri mobil ilovada ochiladi.'
        : locale === 'ru'
        ? 'Ссылки на Telegram, Instagram и YouTube открываются сразу в мобильных приложениях без зависания во встроенных браузерах.'
        : 'Telegram channels, Instagram profiles and YouTube links open directly inside native mobile apps for higher conversion.',
      badge: '1-click Launch',
    },
    {
      icon: QrCode,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      title: locale === 'uz' ? 'Dinamik QR Kod Studio' : locale === 'ru' ? 'Динамическая QR Студия' : 'Dynamic QR Studio',
      description: locale === 'uz'
        ? 'Logotip qo‘yish, ranglar, ramkalar va "SCAN ME" matnini o‘zgartiring. Eng muhimi: QR-kod chop etilgandan keyin ham manzilni yangilash mumkin.'
        : locale === 'ru'
        ? 'Кастомные цвета, логотипы, рамки со слоганом "SCAN ME" и возможность менять целевой адрес даже после печати.'
        : 'Customizable colors, central logos, frames with "SCAN ME", and the superpower to update destinations even after printing.',
      badge: 'Vector SVG/PNG',
    },
    {
      icon: Layers,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      title: locale === 'uz' ? 'Link-in-Bio Sahifalar' : locale === 'ru' ? 'Страницы Link-in-Bio' : 'Link-in-Bio Builder',
      description: locale === 'uz'
        ? 'Instagram, TikTok va Telegram profilingiz uchun shaxsiy @nomli zamonaviy mikro-sahifa. Barcha havolalar, ijtimoiy tarmoqlar bitta joyda.'
        : locale === 'ru'
        ? 'Стильная мобильная страница с собственным @юзернеймом для Instagram и Telegram. Все ваши контакты и ссылки в одном месте.'
        : 'Create stunning mobile bio pages with custom themes, social icons, and animated buttons for Instagram and TikTok.',
      badge: '@handle Pages',
    },
    {
      icon: MapPin,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: locale === 'uz' ? 'O‘zbekiston viloyatlari analitikasi' : locale === 'ru' ? 'Аналитика по регионам Узбекистана' : 'Uzbekistan Regional Analytics',
      description: locale === 'uz'
        ? 'Toshkent shahri, Samarqand, Farg‘ona, Buxoro va boshqa barcha viloyatlar bo‘yicha bosishlar, qurilma turlari va manbalar (Telegram/Instagram).'
        : locale === 'ru'
        ? 'Подробная статистика переходов по городам и областям Узбекистана (Ташкент, Самарканд, Бухара и др.), устройствам и источникам.'
        : 'Deep insights with real-time tracking across all 14 Uzbekistan regions, referrers (Telegram, Instagram), and device operating systems.',
      badge: 'Real-time',
    },
    {
      icon: Lock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: locale === 'uz' ? 'Parol va Amal qilish muddati' : locale === 'ru' ? 'Защита паролем и тайм-лимиты' : 'Security & Expiration Limits',
      description: locale === 'uz'
        ? 'Muhim havolalaringizni maxfiy parol bilan himoyalang, amal qilish muddati yoki maksimal bosishlar sonini (masalan, dastlabki 100 kishi uchun) belgilang.'
        : locale === 'ru'
        ? 'Защищайте конфиденциальные ссылки паролем, устанавливайте дату сгорания или лимит кликов для эксклюзивных акций.'
        : 'Protect sensitive links with passwords, set auto-expiration dates, and enforce click caps for exclusive campaigns.',
      badge: 'Enterprise Security',
    },
    {
      icon: Code2,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      title: locale === 'uz' ? 'Dasturchilar uchun REST API' : locale === 'ru' ? 'REST API для разработчиков' : 'Developer REST API',
      description: locale === 'uz'
        ? 'Havolalarni avtomatlashtirilgan tarzda qisqartirish, API kalitlar yaratish va CRM, Telegram bot hamda tizimlarga bir necha daqiqada integratsiya qilish.'
        : locale === 'ru'
        ? 'Автоматическое создание ссылок, API ключи и готовые эндпоинты для быстрой интеграции с вашим CRM и Telegram-ботами.'
        : 'Automate shortening, manage API keys, and seamlessly connect urls.uz to your CRM, bots, and backend services.',
      badge: 'SDK & Playground',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <span>{locale === 'uz' ? 'Barcha qulayliklar bitta joyda' : locale === 'ru' ? 'Всё необходимое в одном месте' : 'All-in-one Toolkit'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {locale === 'uz'
              ? 'Zamonaviy biznes va kontent yaratuvchilar uchun qudratli vositalar'
              : locale === 'ru'
              ? 'Мощные инструменты для бизнеса и создателей контента'
              : 'Built for High-Growth Brands & Content Creators'}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {locale === 'uz'
              ? 'Oddiy havolani to‘laqonli marketing kanaliga aylantiring. url.uz va Bitlyning eng yaxshi xususiyatlari birlashtirildi.'
              : locale === 'ru'
              ? 'Превратите обычные ссылки в мощные каналы конверсий с возможностями лучших мировых сервисов.'
              : 'Turn everyday links into high-converting branded assets with the best features of Bitly and url.uz.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-3xl p-7 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400">
                  <span>{locale === 'uz' ? 'Batafsil' : locale === 'ru' ? 'Подробнее' : 'Learn more'}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
