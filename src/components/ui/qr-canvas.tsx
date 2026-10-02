'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Check, ZoomIn } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { copyToClipboard } from '@/lib/utils';
import { SITE_URL, SITE_NAME } from '@/lib/site';

export type BodyShape = 'square' | 'dots' | 'rounded' | 'diamond' | 'mosaic';
export type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'leaf';
export type EyeBallShape = 'square' | 'circle' | 'rounded' | 'diamond';
export type ColorMode = 'single' | 'gradient';
export type GradientType = 'linear' | 'radial';

export interface QrCanvasProps {
  value?: string;
  url?: string;
  size?: number;
  exportResolution?: number; // e.g. 1000px
  bgColor?: string;
  fgColor?: string;
  gradientColor2?: string;
  colorMode?: ColorMode;
  gradientType?: GradientType;
  customEyeColor?: boolean;
  eyeFrameColor?: string;
  eyeBallColor?: string;
  bodyShape?: BodyShape;
  eyeFrameShape?: EyeFrameShape;
  eyeBallShape?: EyeBallShape;
  centerLogo?: string;
  centerEmoji?: string | null;
  customLogoUrl?: string | null;
  removeBgBehindLogo?: boolean;
  frameText?: string;
  frameStyle?: 'bottom' | 'top' | 'none';
  showControls?: boolean;
  errorLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Authentic Vector SVG Assets for Brand Gallery
export const BUILTIN_LOGOS: Record<string, { label: string; labels?: [uz: string, ru: string, en: string]; svg: string }> = {
  vcard: {
    label: 'vCard',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#0284c7"/>
      <circle cx="50" cy="38" r="16" fill="#ffffff"/>
      <path fill="#ffffff" d="M22 78c0-14 12-22 28-22s28 8 28 22z"/>
    </svg>`,
  },
  wifi: {
    label: 'Wi-Fi',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#059669"/>
      <path fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" d="M24 38c14-14 38-14 52 0M32 49c10-10 26-10 36 0M41 60c5-5 13-5 18 0"/>
      <circle cx="50" cy="73" r="5" fill="#ffffff"/>
    </svg>`,
  },
  location: {
    label: 'Location',
    labels: ['Joylashuv', 'Локация', 'Location'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#dc2626"/>
      <path fill="#ffffff" d="M50 20c-13.25 0-24 10.75-24 24 0 18 24 38 24 38s24-20 24-38c0-13.25-10.75-24-24-24zm0 33a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/>
    </svg>`,
  },
  event: {
    label: 'Event',
    labels: ['Tadbir', 'Событие', 'Event'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#d97706"/>
      <rect x="22" y="27" width="56" height="50" rx="9" fill="#ffffff"/>
      <rect x="22" y="27" width="56" height="15" rx="5" fill="#b45309"/>
      <circle cx="36" cy="53" r="4" fill="#d97706"/>
      <circle cx="50" cy="53" r="4" fill="#d97706"/>
      <circle cx="64" cy="53" r="4" fill="#d97706"/>
      <circle cx="36" cy="65" r="4" fill="#d97706"/>
      <circle cx="50" cy="65" r="4" fill="#d97706"/>
    </svg>`,
  },
  telegram: {
    label: 'Telegram',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#229ED9"/>
      <path fill="#ffffff" d="M22 48.5c15.2-6.6 25.4-11 30.5-13.1 14.5-6 17.5-7.1 19.5-7.1 0.4 0 1.4 0.1 2 0.7 0.5 0.5 0.7 1.2 0.7 1.7 0 0.7-0.1 1.9-0.4 3.7l-7.3 34.3c-0.5 2.2-1.8 2.8-3.7 1.7l-11.2-8.3-5.4 5.2c-0.6 0.6-1.1 1.1-2.3 1.1l0.8-11.4 20.7-18.7c0.9-0.8-0.2-1.3-1.4-0.5l-25.6 16.1-11-3.4c-2.4-0.7-2.4-2.4 0.5-3.5z"/>
    </svg>`,
  },
  instagram: {
    label: 'Instagram',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fdf497"/>
          <stop offset="25%" stop-color="#fd5949"/>
          <stop offset="50%" stop-color="#d6249f"/>
          <stop offset="100%" stop-color="#285AEB"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#igGrad)"/>
      <rect x="18" y="18" width="64" height="64" rx="18" fill="none" stroke="#ffffff" stroke-width="7"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="#ffffff" stroke-width="7"/>
      <circle cx="67" cy="33" r="4.5" fill="#ffffff"/>
    </svg>`,
  },
  youtube: {
    label: 'YouTube',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect x="4" y="16" width="92" height="68" rx="22" fill="#FF0000"/>
      <polygon points="40,32 70,50 40,68" fill="#ffffff"/>
    </svg>`,
  },
  globe: {
    label: 'Web URL',
    labels: ['Veb-sayt', 'Сайт', 'Website'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#4f46e5"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#ffffff" stroke-width="6"/>
      <ellipse cx="50" cy="50" rx="16" ry="32" fill="none" stroke="#ffffff" stroke-width="6"/>
      <line x1="18" y1="50" x2="82" y2="50" stroke="#ffffff" stroke-width="6"/>
    </svg>`,
  },
  whatsapp: {
    label: 'WhatsApp',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#25D366"/>
      <path fill="#ffffff" d="M72 61.5c-1-0.5-5.9-2.9-6.8-3.2-0.9-0.4-1.6-0.5-2.2 0.5s-2.5 3.2-3.1 3.9c-0.6 0.7-1.1 0.7-2.1 0.2-1-0.5-4.2-1.5-8-4.9-3-2.6-5-5.9-5.6-6.9-0.6-1-0.1-1.6 0.4-2.1 0.5-0.5 1-1.1 1.5-1.7 0.5-0.6 0.7-1 1-1.6 0.3-0.7 0.2-1.2-0.1-1.7s-2.2-5.4-3.1-7.4c-0.8-1.9-1.6-1.7-2.2-1.7h-1.9c-0.6 0-1.7 0.2-2.6 1.2s-3.4 3.3-3.4 8.1 3.5 9.4 4 10.1c0.5 0.7 6.9 10.5 16.7 14.8 2.3 1 4.1 1.6 5.6 2 2.3 0.8 4.5 0.7 6.1 0.4 1.9-0.3 5.9-2.4 6.7-4.7 0.9-2.3 0.9-4.3 0.6-4.7s-1-0.7-2-1.2z"/>
    </svg>`,
  },
  tiktok: {
    label: 'TikTok',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#000000"/>
      <path fill="#ffffff" d="M60 41.5c4 2.8 7 3.5 10 3.5v-7c-3.5 0-7-2-8-5h-6v29c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c1 0 1.9.2 2.8.6v7.3c-.8-.5-1.8-.9-2.8-.9-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V25h8c.5 6 4.5 10.5 10 11.5v5z"/>
    </svg>`,
  },
  facebook: {
    label: 'Facebook',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#1877F2"/>
      <path fill="#ffffff" d="M57 50h-6v25h-10v-25h-5v-9h5v-6c0-7 4-11 11-11h7v9h-5c-3 0-4 1-4 4v4h9l-1 9z"/>
    </svg>`,
  },
  twitter: {
    label: 'X / Twitter',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#000000"/>
      <path fill="#ffffff" d="M58.7 30h5.4L52.3 43.5 66 61H55l-8.6-11.2L36.6 61h-5.4l12.6-14.4L31 30h11.3l7.8 10.3L58.7 30zm-1.9 27.8h3L41.3 33h-3.2l18.7 24.8z"/>
    </svg>`,
  },
  linkedin: {
    label: 'LinkedIn',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#0A66C2"/>
      <path fill="#ffffff" d="M33 42h7v23h-7V42zm3.5-11c2.3 0 4.1 1.8 4.1 4.1s-1.8 4.1-4.1 4.1-4.1-1.8-4.1-4.1 1.8-4.1 4.1-4.1zm11.5 11h6.7v3.1h.1c.9-1.8 3.2-3.6 6.7-3.6 7.2 0 8.5 4.7 8.5 10.9V65h-7V54.1c0-2.6 0-5.9-3.6-5.9-3.6 0-4.2 2.8-4.2 5.7V65h-7.2V42z"/>
    </svg>`,
  },
  github: {
    label: 'GitHub',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#181717"/>
      <path fill="#ffffff" d="M50 25c-13.8 0-25 11.2-25 25 0 11 7.2 20.4 17.1 23.7 1.3.2 1.7-.5 1.7-1.2v-4.5c-7 1.5-8.4-3-8.4-3-1.1-2.9-2.8-3.6-2.8-3.6-2.3-1.6.2-1.5.2-1.5 2.5.2 3.8 2.6 3.8 2.6 2.2 3.8 5.9 2.7 7.3 2.1.2-1.6.9-2.7 1.6-3.3-5.5-.6-11.4-2.8-11.4-12.3 0-2.7 1-4.9 2.6-6.6-.3-.6-1.1-3.2.3-6.6 0 0 2.1-.7 6.8 2.5 2-.6 4.1-.8 6.2-.8s4.2.3 6.2.8c4.7-3.2 6.8-2.5 6.8-2.5 1.4 3.4.5 6 .3 6.6 1.6 1.7 2.6 3.9 2.6 6.6 0 9.6-5.9 11.7-11.5 12.3.9.8 1.7 2.3 1.7 4.7v7c0 .7.5 1.5 1.7 1.2C67.8 70.4 75 61 75 50c0-13.8-11.2-25-25-25z"/>
    </svg>`,
  },
  spotify: {
    label: 'Spotify',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#1DB954"/>
      <path fill="#ffffff" d="M68.5 61.2c-.8 1.3-2.4 1.7-3.7.9-10.2-6.2-23-7.6-38.1-4.2-1.5.3-2.9-.6-3.3-2.1-.3-1.5.6-2.9 2.1-3.3 16.5-3.8 30.6-2.1 42.1 4.9 1.3.8 1.7 2.4.9 3.8zm3.6-8c-1 1.6-3.1 2.1-4.7 1.1-11.7-7.2-29.5-9.3-43.3-5.1-1.8.5-3.7-.5-4.2-2.3s.5-3.7 2.3-4.2c15.8-4.8 35.4-2.4 48.8 5.8 1.6 1 2.1 3.1 1.1 4.7zm.3-8.3c-14-8.3-37.1-9.1-50.6-5-2.1.6-4.4-.6-5.1-2.8-.6-2.1.6-4.4 2.8-5.1 15.4-4.7 41-3.7 57.2 5.9 1.9 1.1 2.5 3.6 1.4 5.5-1.1 2-3.6 2.6-5.7 1.5z"/>
    </svg>`,
  },
  phone: {
    label: 'Phone',
    labels: ['Telefon', 'Телефон', 'Phone'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#10B981"/>
      <path fill="#ffffff" d="M37 31c1.5-1.5 4-1.5 5.5 0l3 3c1.5 1.5 1.5 4 0 5.5l-2.2 2.2c1.7 3.5 4.5 6.3 8 8l2.2-2.2c1.5-1.5 4-1.5 5.5 0l3 3c1.5 1.5 1.5 4 0 5.5l-3.3 3.3c-2.3 2.3-5.8 2.8-8.6 1.3C40 55 31 46 25.7 36c-1.5-2.8-1-6.3 1.3-8.6L37 31z"/>
    </svg>`,
  },
  mail: {
    label: 'Email',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#6366F1"/>
      <path fill="#ffffff" d="M26 34h48c2.2 0 4 1.8 4 4v24c0 2.2-1.8 4-4 4H26c-2.2 0-4-1.8-4-4V38c0-2.2 1.8-4 4-4zm24 16.5L30 38h40L50 50.5z"/>
    </svg>`,
  },
};

export interface EmojiCategory {
  id: string;
  name: [uz: string, ru: string, en: string];
  icon: string;
  emojis: string[];
}

export const PHONE_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'popular',
    name: ['Mashhur', 'Популярные', 'Popular'],
    icon: '🔥',
    emojis: ['🔥', '⭐', '❤️', '🚀', '💡', '💎', '🎯', '✨', '🏆', '👑', '⚡', '🔔', '🎉', '💯', '👍', '💪'],
  },
  {
    id: 'business',
    name: ['Biznes va ofis', 'Бизнес и офис', 'Business & office'],
    icon: '💼',
    emojis: ['💼', '🏢', '📈', '💳', '🛒', '📦', '🏷️', '🤝', '📊', '📅', '📞', '✉️', '🏦', '📎', '💰', '📑'],
  },
  {
    id: 'tech',
    name: ['Texnika va aloqa', 'Техника и связь', 'Tech & communication'],
    icon: '📱',
    emojis: ['💬', '📱', '💻', '🌐', '📷', '🎮', '🎧', '🎵', '🔒', '🔑', '🤖', '📡', '🕹️', '📺', '🚀', '⚡'],
  },
  {
    id: 'lifestyle',
    name: ['Hayot, sayohat, taom', 'Жизнь, путешествия, еда', 'Life, travel, food'],
    icon: '☕',
    emojis: ['☕', '🍕', '🍔', '🍰', '🥗', '🍹', '✈️', '🚗', '🏠', '🎁', '🛍️', '🩺', '🌍', '🚴', '⚽', '🎨'],
  },
  {
    id: 'flags',
    name: ['Bayroqlar va belgilar', 'Флаги и символы', 'Flags & symbols'],
    icon: '🇺🇿',
    emojis: ['🇺🇿', '🇷🇺', '🇺🇸', '🇬🇧', '🇹🇷', '🇰🇿', '🏁', '✅', '⛔', '🟢', '🔴', '🔷', '🔶', '📍', '🌍', '⭐️'],
  },
];

export function QrCanvas({
  value,
  url,
  size = 280,
  exportResolution = 1000,
  bgColor = '#ffffff',
  fgColor = '#0f172a',
  gradientColor2 = '#4f46e5',
  colorMode = 'single',
  gradientType = 'linear',
  customEyeColor = false,
  eyeFrameColor = '#0f172a',
  eyeBallColor = '#0f172a',
  bodyShape = 'square',
  eyeFrameShape = 'square',
  eyeBallShape = 'square',
  centerLogo = 'none',
  centerEmoji = null,
  customLogoUrl = null,
  removeBgBehindLogo = true,
  frameText = 'SCAN ME',
  frameStyle = 'bottom',
  showControls = true,
  errorLevel = 'Q',
}: QrCanvasProps) {
  const finalValue = value || url || SITE_URL;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { t, tr } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Render method used for both preview and high-res export
  const renderQrToCanvas = (
    targetCanvas: HTMLCanvasElement,
    targetWidth: number,
    isExport: boolean
  ) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const qrData = QRCode.create(finalValue, { errorCorrectionLevel: errorLevel });
    const moduleCount = qrData.modules.size;

    const hasFrame = frameStyle !== 'none' && Boolean(frameText?.trim());
    const frameHeight = hasFrame ? Math.round(targetWidth * 0.16) : 0;
    const canvasHeight = targetWidth + frameHeight;

    targetCanvas.width = targetWidth;
    targetCanvas.height = canvasHeight;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, canvasHeight);

    // QR active drawing area
    const padding = Math.round(targetWidth * 0.06);
    const qrSize = targetWidth - padding * 2;
    const cellSize = qrSize / moduleCount;
    const qrX = padding;
    const qrY = frameStyle === 'top' && hasFrame ? frameHeight + padding : padding;

    // Determine Foreground Style (Solid vs Linear vs Radial Gradient)
    let fillStyle: string | CanvasGradient = fgColor;
    if (colorMode === 'gradient') {
      if (gradientType === 'radial') {
        const radGrad = ctx.createRadialGradient(
          qrX + qrSize / 2,
          qrY + qrSize / 2,
          0,
          qrX + qrSize / 2,
          qrY + qrSize / 2,
          qrSize * 0.7
        );
        radGrad.addColorStop(0, fgColor);
        radGrad.addColorStop(1, gradientColor2);
        fillStyle = radGrad;
      } else {
        const linGrad = ctx.createLinearGradient(qrX, qrY, qrX + qrSize, qrY + qrSize);
        linGrad.addColorStop(0, fgColor);
        linGrad.addColorStop(1, gradientColor2);
        fillStyle = linGrad;
      }
    }

    // Helper: Identify if module is within Eye zones (7x7 corners)
    const isEyeModule = (row: number, col: number) => {
      if (row < 7 && col < 7) return true; // Top-Left
      if (row < 7 && col >= moduleCount - 7) return true; // Top-Right
      if (row >= moduleCount - 7 && col < 7) return true; // Bottom-Left
      return false;
    };

    // Helper: Identify if module is within center logo zone (compact circular boundary)
    const activeEmoji =
      centerEmoji ||
      (centerLogo && centerLogo.startsWith('emoji:')
        ? centerLogo.replace('emoji:', '')
        : null);

    const hasLogo =
      Boolean(activeEmoji) ||
      Boolean(customLogoUrl) ||
      (Boolean(centerLogo) && centerLogo !== 'none' && Boolean(BUILTIN_LOGOS[centerLogo]));

    const logoPixelSize = Math.round(qrSize * 0.18);
    const logoRadiusInModules = (logoPixelSize / cellSize) / 2;
    const centerModule = (moduleCount - 1) / 2;

    const isCenterLogoModule = (row: number, col: number) => {
      if (!hasLogo || !removeBgBehindLogo) return false;
      const dist = Math.hypot(row - centerModule, col - centerModule);
      return dist <= logoRadiusInModules + 0.35;
    };

    // 1. Draw Body Modules
    ctx.fillStyle = fillStyle;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isEyeModule(row, col)) continue;
        if (isCenterLogoModule(row, col)) continue;

        if (qrData.modules.get(row, col)) {
          const x = qrX + col * cellSize;
          const y = qrY + row * cellSize;

          if (bodyShape === 'dots') {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.44, 0, Math.PI * 2);
            ctx.fill();
          } else if (bodyShape === 'rounded') {
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.32);
            } else {
              ctx.fillRect(x, y, cellSize, cellSize);
            }
            ctx.fill();
          } else if (bodyShape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(x + cellSize / 2, y);
            ctx.lineTo(x + cellSize, y + cellSize / 2);
            ctx.lineTo(x + cellSize / 2, y + cellSize);
            ctx.lineTo(x, y + cellSize / 2);
            ctx.closePath();
            ctx.fill();
          } else if (bodyShape === 'mosaic') {
            const inset = cellSize * 0.08;
            ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);
          } else {
            // Default square
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }

    // 2. Draw 3 Corner Eyes (Eye Frame & Eye Ball)
    const activeEyeFrameColor = customEyeColor ? eyeFrameColor : fillStyle;
    const activeEyeBallColor = customEyeColor ? eyeBallColor : fillStyle;

    const drawEye = (startRow: number, startCol: number) => {
      const eyeX = qrX + startCol * cellSize;
      const eyeY = qrY + startRow * cellSize;
      const eyeDim = 7 * cellSize;

      // Outer Frame
      ctx.fillStyle = activeEyeFrameColor;
      if (eyeFrameShape === 'circle') {
        ctx.beginPath();
        ctx.arc(eyeX + eyeDim / 2, eyeY + eyeDim / 2, eyeDim / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(eyeX + eyeDim / 2, eyeY + eyeDim / 2, eyeDim / 2 - cellSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyeFrameShape === 'rounded') {
        const rad = eyeDim * 0.28;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(eyeX, eyeY, eyeDim, eyeDim, rad);
        } else {
          ctx.fillRect(eyeX, eyeY, eyeDim, eyeDim);
        }
        ctx.fill();

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            eyeX + cellSize,
            eyeY + cellSize,
            eyeDim - 2 * cellSize,
            eyeDim - 2 * cellSize,
            rad * 0.65
          );
        } else {
          ctx.fillRect(eyeX + cellSize, eyeY + cellSize, eyeDim - 2 * cellSize, eyeDim - 2 * cellSize);
        }
        ctx.fill();
      } else if (eyeFrameShape === 'leaf') {
        // Asymmetric leaf eye (top-left & bottom-right curved)
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(eyeX, eyeY, eyeDim, eyeDim, [eyeDim * 0.45, 0, eyeDim * 0.45, 0]);
        } else {
          ctx.fillRect(eyeX, eyeY, eyeDim, eyeDim);
        }
        ctx.fill();

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            eyeX + cellSize,
            eyeY + cellSize,
            eyeDim - 2 * cellSize,
            eyeDim - 2 * cellSize,
            [eyeDim * 0.3, 0, eyeDim * 0.3, 0]
          );
        } else {
          ctx.fillRect(eyeX + cellSize, eyeY + cellSize, eyeDim - 2 * cellSize, eyeDim - 2 * cellSize);
        }
        ctx.fill();
      } else {
        // Square eye frame
        ctx.fillRect(eyeX, eyeY, eyeDim, eyeDim);
        ctx.fillStyle = bgColor;
        ctx.fillRect(eyeX + cellSize, eyeY + cellSize, eyeDim - 2 * cellSize, eyeDim - 2 * cellSize);
      }

      // Inner Eye Ball (3x3 modules)
      ctx.fillStyle = activeEyeBallColor;
      const ballX = eyeX + 2 * cellSize;
      const ballY = eyeY + 2 * cellSize;
      const ballDim = 3 * cellSize;

      if (eyeBallShape === 'circle') {
        ctx.beginPath();
        ctx.arc(ballX + ballDim / 2, ballY + ballDim / 2, ballDim / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyeBallShape === 'rounded') {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(ballX, ballY, ballDim, ballDim, ballDim * 0.35);
        } else {
          ctx.fillRect(ballX, ballY, ballDim, ballDim);
        }
        ctx.fill();
      } else if (eyeBallShape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(ballX + ballDim / 2, ballY);
        ctx.lineTo(ballX + ballDim, ballY + ballDim / 2);
        ctx.lineTo(ballX + ballDim / 2, ballY + ballDim);
        ctx.lineTo(ballX, ballY + ballDim / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Square eyeball
        ctx.fillRect(ballX, ballY, ballDim, ballDim);
      }
    };

    // Draw Top-Left, Top-Right, Bottom-Left Eyes
    drawEye(0, 0);
    drawEye(0, moduleCount - 7);
    drawEye(moduleCount - 7, 0);

    // 3. Draw Callout Frame Text (SCAN ME / etc.)
    if (hasFrame && frameText) {
      ctx.fillStyle = typeof fillStyle === 'string' ? fillStyle : fgColor;
      const fontSize = Math.max(12, Math.round(targetWidth * 0.044));
      ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textY =
        frameStyle === 'top'
          ? Math.round(frameHeight / 2)
          : targetWidth + Math.round(frameHeight / 2);

      const upper = frameText.toUpperCase();
      try {
        ctx.letterSpacing = '1.5px';
      } catch {}
      ctx.fillText(upper, targetWidth / 2, textY);
    }

    // 4. Draw Center Logo (Compact icon without oversized square)
    if (hasLogo) {
      const logoPixelSize = Math.round(qrSize * 0.18);
      const logoX = qrX + (qrSize - logoPixelSize) / 2;
      const logoY = qrY + (qrSize - logoPixelSize) / 2;
      const centerX = qrX + qrSize / 2;
      const centerY = qrY + qrSize / 2;
      const radius = logoPixelSize / 2;

      // Clean compact protective circular background (no square card, no heavy shadow)
      if (removeBgBehindLogo) {
        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (activeEmoji) {
        ctx.save();
        const emojiFontSize = Math.round(logoPixelSize * 0.85);
        ctx.font = `${emojiFontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeEmoji, centerX, centerY + Math.round(logoPixelSize * 0.04));
        ctx.restore();
      } else {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, logoX, logoY, logoPixelSize, logoPixelSize);
        };

        if (customLogoUrl) {
          img.src = customLogoUrl;
        } else if (BUILTIN_LOGOS[centerLogo]) {
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            BUILTIN_LOGOS[centerLogo].svg
          )}`;
        }
      }
    }
  };

  // Re-render preview canvas on parameter change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Retina High-DPI Scaling for preview
    const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 2, 2) : 2;
    const displaySize = size;
    const hasFrame = frameStyle !== 'none' && Boolean(frameText?.trim());
    const displayHeight = hasFrame ? displaySize + Math.round(displaySize * 0.16) : displaySize;

    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displayHeight}px`;

    renderQrToCanvas(canvas, displaySize * dpr, false);
  }, [
    finalValue,
    size,
    bgColor,
    fgColor,
    gradientColor2,
    colorMode,
    gradientType,
    customEyeColor,
    eyeFrameColor,
    eyeBallColor,
    bodyShape,
    eyeFrameShape,
    eyeBallShape,
    centerLogo,
    centerEmoji,
    customLogoUrl,
    removeBgBehindLogo,
    frameText,
    frameStyle,
    errorLevel,
  ]);

  // High-Resolution Export
  const handleDownload = async (format: 'png' | 'svg' | 'pdf' | 'eps') => {
    const exportDim = exportResolution || 1000;
    const offscreen = document.createElement('canvas');
    renderQrToCanvas(offscreen, exportDim, true);

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `urls-uz-qr-${exportDim}x${exportDim}-${Date.now()}.png`;
      link.href = offscreen.toDataURL('image/png', 1.0);
      link.click();
    } else if (format === 'svg') {
      // Generate clean vector SVG
      try {
        const qrData = QRCode.create(finalValue, { errorCorrectionLevel: errorLevel });
        const moduleCount = qrData.modules.size;
        const cellSize = 10;
        const qrDim = moduleCount * cellSize;
        const pad = 30;
        const totalW = qrDim + pad * 2;
        const totalH = frameStyle !== 'none' && frameText ? totalW + 40 : totalW;

        const activeEmoji =
          centerEmoji ||
          (centerLogo && centerLogo.startsWith('emoji:')
            ? centerLogo.replace('emoji:', '')
            : null);

        const hasLogo =
          Boolean(activeEmoji) ||
          Boolean(customLogoUrl) ||
          (Boolean(centerLogo) && centerLogo !== 'none' && Boolean(BUILTIN_LOGOS[centerLogo]));

        const logoPixelSize = Math.round(qrDim * 0.18);
        const logoRadiusInModules = (logoPixelSize / cellSize) / 2;
        const centerModule = (moduleCount - 1) / 2;
        const isCenterZone = (row: number, col: number) => {
          if (!hasLogo || !removeBgBehindLogo) return false;
          const dist = Math.hypot(row - centerModule, col - centerModule);
          return dist <= logoRadiusInModules + 0.35;
        };

        let rects = '';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (isCenterZone(r, c)) continue;
            if (qrData.modules.get(r, c)) {
              rects += `<rect x="${pad + c * cellSize}" y="${pad + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fgColor}"/>`;
            }
          }
        }

        let logoSvgElem = '';
        const centerX = pad + qrDim / 2;
        const centerY = pad + qrDim / 2;
        if (hasLogo) {
          if (removeBgBehindLogo) {
            logoSvgElem += `<circle cx="${centerX}" cy="${centerY}" r="${logoPixelSize / 2 + 2}" fill="${bgColor}"/>`;
          }
          if (activeEmoji) {
            logoSvgElem += `<text x="${centerX}" y="${centerY + logoPixelSize * 0.3}" font-size="${Math.round(logoPixelSize * 0.8)}" text-anchor="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${activeEmoji}</text>`;
          }
        }

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
          <rect width="${totalW}" height="${totalH}" fill="${bgColor}"/>
          ${rects}
          ${logoSvgElem}
          ${
            frameStyle !== 'none' && frameText
              ? `<text x="${totalW / 2}" y="${totalH - 16}" font-family="sans-serif" font-weight="bold" font-size="14" fill="${fgColor}" text-anchor="middle">${frameText.toUpperCase()}</text>`
              : ''
          }
        </svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `urls-uz-qr-vector-${Date.now()}.svg`;
        link.click();
      } catch {}
    } else if (format === 'pdf' || format === 'eps') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const dataUrl = offscreen.toDataURL('image/png', 1.0);
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${SITE_NAME} QR Code Print</title>
              <style>
                body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #09090b; }
                .card { background: white; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                img { width: 340px; height: auto; }
                @media print { body { background: white; } .card { box-shadow: none; } }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${dataUrl}" alt="${SITE_NAME} QR Code" />
              </div>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (
        typeof window !== 'undefined' &&
        navigator.clipboard &&
        'write' in navigator.clipboard &&
        typeof ClipboardItem !== 'undefined'
      ) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            await copyToClipboard(finalValue);
          } else {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        await copyToClipboard(finalValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await copyToClipboard(finalValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Precision QR Frame Container */}
      <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl">
        <canvas ref={canvasRef} className="rounded-xl transition-transform" />
      </div>

      {showControls && (
        <div className="w-full space-y-2 mt-1">
          {/* Main Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDownload('png')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{tr('PNG yuklab olish', 'Скачать PNG', 'Download PNG')} ({exportResolution}px)</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => handleDownload('svg')}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-center transition-colors"
            >
              .SVG
            </button>
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-center transition-colors"
            >
              .PDF
            </button>
            <button
              type="button"
              onClick={() => handleDownload('eps')}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-center transition-colors"
            >
              .EPS
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-center transition-colors flex items-center justify-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-zinc-400" />}
              <span>{copied ? t.copied : t.copy}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
