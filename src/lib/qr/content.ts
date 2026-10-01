import { z } from 'zod';
import {
  generateEventString,
  generateLocationString,
  generateVCardString,
  generateWifiString,
  type EventPayload,
  type LocationPayload,
  type QrDataType,
  type VCardPayload,
  type WifiPayload,
} from '@/lib/qr-payloads';

/*
 * What a saved QR code holds for each type, shared by the studio and the API.
 * No server-only imports: the studio uses these to build the QR payload.
 */

const text = (max: number) => z.string().trim().max(max).optional().default('');

export const vcardContentSchema = z.object({
  version: z.enum(['2.1', '3.0']).default('3.0'),
  firstName: z.string().trim().max(100),
  lastName: text(100),
  organization: text(200),
  jobTitle: text(200),
  phoneWork: text(50),
  phonePrivate: text(50),
  phoneMobile: text(50),
  faxWork: text(50),
  faxPrivate: text(50),
  email: text(200),
  website: text(500),
  street: text(200),
  zipCode: text(20),
  city: text(100),
  state: text(100),
  country: text(100),
});

export const wifiContentSchema = z.object({
  ssid: z.string().trim().min(1, 'Wi-Fi tarmoq nomini kiriting').max(64),
  password: text(128),
  encryption: z.enum(['WPA', 'WEP', 'nopass']).default('WPA'),
  hidden: z.boolean().optional().default(false),
});

export const locationContentSchema = z.object({
  latitude: z.string().trim().max(32),
  longitude: z.string().trim().max(32),
  addressSearch: text(300),
  format: z.enum(['google_maps', 'geo_uri']).default('google_maps'),
});

export const eventContentSchema = z.object({
  title: z.string().trim().min(1, 'Tadbir nomini kiriting').max(200),
  location: text(300),
  description: text(2000),
  startDate: z.string().trim().max(10),
  startTime: z.string().trim().max(5),
  endDate: z.string().trim().max(10),
  endTime: z.string().trim().max(5),
  allDay: z.boolean().optional().default(false),
});

export const textContentSchema = z.object({ text: z.string().trim().min(1, 'Matn kiriting').max(2000) });
export const urlContentSchema = z.object({ url: z.string().trim().min(1, 'URL kiriting').max(2048) });

export const QR_CONTENT_SCHEMAS = {
  url: urlContentSchema,
  text: textContentSchema,
  vcard: vcardContentSchema,
  location: locationContentSchema,
  wifi: wifiContentSchema,
  event: eventContentSchema,
} satisfies Record<QrDataType, z.ZodType>;

export type QrContent = {
  url: z.infer<typeof urlContentSchema>;
  text: z.infer<typeof textContentSchema>;
  vcard: VCardPayload;
  location: LocationPayload;
  wifi: WifiPayload;
  event: EventPayload;
};

/**
 * Types that can be dynamic. Wi-Fi can't: phones join a network from the
 * credentials inside the QR and never open a URL.
 */
export const DYNAMIC_QR_TYPES: readonly QrDataType[] = ['url', 'vcard', 'location', 'event', 'text'];
/** Dynamic types whose short link opens a page on urls.uz (the rest redirect). */
export const HOSTED_QR_TYPES: readonly QrDataType[] = ['vcard', 'event', 'text'];

export const canBeDynamic = (type: QrDataType) => DYNAMIC_QR_TYPES.includes(type);
export const isHostedType = (type: QrDataType) => HOSTED_QR_TYPES.includes(type);

/** What a static QR encodes. */
export function staticPayload(type: QrDataType, content: Record<string, unknown>): string {
  switch (type) {
    case 'url':
      return String(content.url || '').trim() || 'https://urls.uz';
    case 'text':
      return String(content.text || '') || 'urls.uz';
    case 'vcard':
      return generateVCardString(content as unknown as VCardPayload);
    case 'wifi':
      return generateWifiString(content as unknown as WifiPayload);
    case 'location':
      return generateLocationString(content as unknown as LocationPayload);
    case 'event':
      return generateEventString(content as unknown as EventPayload);
  }
}

/** Where a dynamic url/location QR's link sends visitors. */
export function redirectTarget(type: QrDataType, content: Record<string, unknown>): string | null {
  if (type === 'url') return String(content.url || '').trim();
  // A redirect has to be a web URL, so dynamic locations always open Google Maps
  if (type === 'location') return generateLocationString({ ...(content as unknown as LocationPayload), format: 'google_maps' });
  return null;
}

/** A short human label for lists ("Sherzod Qosimov", "UrlsUz_Office_5G", ...). */
export function describeContent(type: QrDataType, content: Record<string, unknown>): string {
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  switch (type) {
    case 'url':
      return s(content.url);
    case 'text':
      return s(content.text).slice(0, 80);
    case 'vcard':
      return [s(content.firstName), s(content.lastName)].filter(Boolean).join(' ') || s(content.organization);
    case 'wifi':
      return s(content.ssid);
    case 'location':
      return s(content.addressSearch) || `${s(content.latitude)}, ${s(content.longitude)}`;
    case 'event':
      return s(content.title);
  }
}
