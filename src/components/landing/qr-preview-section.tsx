'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';
import QrStudio from '@/components/qr-studio/qr-studio';

/**
 * The QR studio on the landing page, usable without an account. Turning a URL
 * into a dynamic (trackable, editable) QR asks the visitor to sign up; the
 * URL becomes their first short link.
 */
export default function QrPreviewSection() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { openAuthModal } = useAuth();
  const { showToast } = useToast();

  /** After an in-modal login: create the link and open it in the dashboard studio. */
  const createDynamicQr = async (url: string) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination_url: url, source: 'landing' }),
    });
    const data = await res.json();
    if (data.success) router.push(`/dashboard/qr?link=${data.link.id}`);
    else showToast('error', data.error || 'Havola yaratib bo‘lmadi');
  };

  return (
    <section id="qr-studio" className="py-20 md:py-28 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>DINAMIK VA STATIK QR KODLAR</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
            {locale === 'uz'
              ? 'Professional vCard va Ko‘p Formatli QR Kod Generator'
              : locale === 'ru'
                ? 'Профессиональный генератор vCard и QR-кодов'
                : 'Professional vCard & Multi-Format QR Code Generator'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {locale === 'uz'
              ? 'vCard, Wi-Fi, joylashuv, tadbir va havolalar uchun QR kodlar: 2000px gacha PNG va SVG. Havola QR kodlarini dinamik qiling — manzilni keyin o‘zgartirish va skanerlarni kuzatish mumkin.'
              : locale === 'ru'
                ? 'QR-коды для vCard, Wi-Fi, геолокации, событий и ссылок: PNG и SVG до 2000px. Сделайте QR-код ссылки динамическим — меняйте адрес и отслеживайте сканирования.'
                : 'QR codes for vCards, Wi-Fi, locations, events and links: PNG and SVG up to 2000px. Make link QR codes dynamic to change the destination later and track scans.'}
          </p>
        </div>

        <QrStudio
          links={[]}
          initialLinkId={null}
          canWrite={false}
          initialType="vcard"
          showHeader={false}
          guest={{ onSignup: (url) => openAuthModal(url, () => createDynamicQr(url)) }}
        />
      </div>
    </section>
  );
}
