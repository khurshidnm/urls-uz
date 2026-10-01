import { ImageResponse } from 'next/og';
import LogoMark from '@/components/brand/logo-mark';
import { BRAND } from '@/lib/site';

/** Home-screen icon for iPhone / iPad (PNG, as iOS requires). */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.background }}>
        <LogoMark size={150} />
      </div>
    ),
    size
  );
}
