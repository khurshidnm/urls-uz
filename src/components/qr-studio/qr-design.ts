import type { QrConfig } from '@/db/schema';

/** Every QR design field with a value; what the studio edits and what a link's qr_config stores. */
export type QrDesign = Required<QrConfig>;

export const DEFAULT_DESIGN: QrDesign = {
  fgColor: '#0f172a',
  gradientColor2: '#4f46e5',
  bgColor: '#ffffff',
  colorMode: 'single',
  gradientType: 'linear',
  customEyeColor: false,
  eyeFrameColor: '#0f172a',
  eyeBallColor: '#0f172a',
  bodyShape: 'square',
  eyeFrameShape: 'square',
  eyeBallShape: 'square',
  centerLogo: 'globe',
  centerEmoji: null,
  customLogoUrl: null,
  removeBgBehindLogo: true,
  frameText: 'SCAN ME',
  frameStyle: 'bottom',
  errorLevel: 'Q',
};

/** A link's saved design on top of the defaults. */
export function designFrom(config: QrConfig | null | undefined): QrDesign {
  return { ...DEFAULT_DESIGN, ...(config ?? {}) };
}

export type UpdateDesign = (patch: Partial<QrDesign>) => void;
