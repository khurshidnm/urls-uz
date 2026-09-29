import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/language-context';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'urls.uz — Havolalarni qisqartirish, Smart Deep Linklar va QR Studio',
  description: 'O‘zbekiston va global bozor uchun professional havola ekotizimi. Qisqa havolalar, mobil ilovalarga to‘g‘ridan-to‘g‘ri o‘tuvchi deep linklar, dinamik QR-kodlar, Link-in-Bio va viloyatlar kesimida chuqur analitika.',
  keywords: ['urls.uz', 'url.uz', 'havola qisqartirish', 'short link uzbekistan', 'qr code generator', 'link in bio', 'telegram deep link', 'bitly alternative uzbekistan'],
  authors: [{ name: 'urls.uz Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 font-sans">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
