import { ImageResponse } from 'next/og';
import LogoMark from '@/components/brand/logo-mark';
import {BRAND, BRAND_PARTS, SITE_NAME } from '@/lib/site';

/** The preview shown when urls.uz is shared on Telegram, Facebook, X, LinkedIn, ... */
export const alt = `${SITE_NAME} — havolalarni qisqartirish, QR kodlar va Link-in-Bio`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The built-in font covers Latin; plain apostrophes keep Uzbek words readable
const FEATURES = ['Qisqa havolalar', 'Qurilmaga qarab yo\'naltirish', 'Dinamik QR kodlar', 'Link-in-Bio', 'Viloyatlar analitikasi'];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: `radial-gradient(circle at 85% 0%, rgba(99,102,241,0.28), transparent 55%), ${BRAND.background}`,
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <LogoMark size={88} />
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
            {BRAND_PARTS.name}<span style={{ color: '#71717a' }}>{BRAND_PARTS.tld}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5, maxWidth: 980 }}>
            Bitta havola — har bir qurilma o&apos;z do&apos;koniga
          </div>
          <div style={{ fontSize: 28, color: '#a1a1aa', maxWidth: 980 }}>
            O&apos;zbekiston uchun qisqa havolalar, QR kodlar va analitika
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {FEATURES.map((f) => (
            <div
              key={f}
              style={{ display: 'flex', padding: '10px 18px', borderRadius: 999, border: `2px solid ${BRAND.tileBorder}`, background: BRAND.tile, fontSize: 22, color: '#e4e4e7' }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
