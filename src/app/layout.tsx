import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/language-context';
import { AuthProvider } from '@/lib/auth-context';
import AuthModal from '@/components/auth/auth-modal';
import { phoneLoginAvailable } from '@/lib/login-flow';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'urls.uz — Havolalarni qisqartirish, Smart Deep Linklar va QR Studio',
  description: 'Oʻzbekiston va global bozor uchun professional havola ekotizimi. Qisqa havolalar, mobil ilovalarga toʻgʻridan-toʻgʻri oʻtuvchi deep linklar, dinamik QR-kodlar, Link-in-Bio va viloyatlar kesimida chuqur analitika.',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col text-slate-100"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <AuthModal phoneLoginAvailable={phoneLoginAvailable()} />
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
