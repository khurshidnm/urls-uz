import React from 'react';
import { BRAND } from '@/lib/site';

/**
 * The urls.uz mark (a chain link on a rounded tile), as plain SVG so it also
 * renders inside next/og images (apple-icon, Open Graph). Same drawing as app/icon.svg.
 */
export default function LogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="60" height="60" rx="14" fill={BRAND.tile} stroke={BRAND.tileBorder} strokeWidth="3" />
      <g transform="translate(14 14) scale(1.5)" fill="none" stroke={BRAND.mark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <line x1="8" x2="16" y1="12" y2="12" />
      </g>
    </svg>
  );
}
