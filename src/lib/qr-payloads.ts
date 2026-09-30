/**
 * QR Code Multi-Type Payload Generators
 * Byte-by-byte conforming with QRCode Monkey (https://www.qrcode-monkey.com/#vcard)
 * RFC 6350 (vCard 3.0), vCard 2.1, ZXing Wi-Fi, RFC 5545 (iCal VEVENT), RFC 5870 (Geo).
 */

export type QrDataType = 'url' | 'vcard' | 'text' | 'location' | 'wifi' | 'event';

export interface VCardPayload {
  version: '2.1' | '3.0';
  firstName: string;
  lastName: string;
  organization?: string;
  jobTitle?: string;
  phoneWork?: string;
  phonePrivate?: string;
  phoneMobile?: string;
  faxWork?: string;
  faxPrivate?: string;
  email?: string;
  website?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface WifiPayload {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface LocationPayload {
  latitude: string;
  longitude: string;
  addressSearch?: string;
  format: 'google_maps' | 'geo_uri';
}

export interface EventPayload {
  title: string;
  location?: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  allDay?: boolean;
}

/**
 * Encodes vCard string matching QRCode Monkey byte-by-byte
 */
export function generateVCardString(card: VCardPayload): string {
  const isV3 = card.version === '3.0';
  const parts: string[] = ['BEGIN:VCARD', isV3 ? 'VERSION:3.0' : 'VERSION:2.1'];

  const first = (card.firstName || '').trim();
  const last = (card.lastName || '').trim();
  const fullName = [first, last].filter(Boolean).join(' ') || 'Contact';

  if (isV3) {
    parts.push(`N:${last};${first};;;`);
  } else {
    parts.push(`N:${last};${first}`);
  }
  parts.push(`FN:${fullName}`);

  if (card.organization?.trim()) {
    parts.push(`ORG:${card.organization.trim()}`);
  }
  if (card.jobTitle?.trim()) {
    parts.push(`TITLE:${card.jobTitle.trim()}`);
  }

  // Work Phone
  if (card.phoneWork?.trim()) {
    parts.push(isV3 ? `TEL;TYPE=WORK,VOICE:${card.phoneWork.trim()}` : `TEL;WORK;VOICE:${card.phoneWork.trim()}`);
  }
  // Private / Home Phone
  if (card.phonePrivate?.trim()) {
    parts.push(isV3 ? `TEL;TYPE=HOME,VOICE:${card.phonePrivate.trim()}` : `TEL;HOME;VOICE:${card.phonePrivate.trim()}`);
  }
  // Mobile Phone
  if (card.phoneMobile?.trim()) {
    parts.push(isV3 ? `TEL;TYPE=CELL,VOICE:${card.phoneMobile.trim()}` : `TEL;CELL;VOICE:${card.phoneMobile.trim()}`);
  }
  // Work Fax
  if (card.faxWork?.trim()) {
    parts.push(isV3 ? `TEL;TYPE=WORK,FAX:${card.faxWork.trim()}` : `TEL;WORK;FAX:${card.faxWork.trim()}`);
  }
  // Private Fax
  if (card.faxPrivate?.trim()) {
    parts.push(isV3 ? `TEL;TYPE=HOME,FAX:${card.faxPrivate.trim()}` : `TEL;HOME;FAX:${card.faxPrivate.trim()}`);
  }

  // Email
  if (card.email?.trim()) {
    parts.push(isV3 ? `EMAIL;TYPE=INTERNET,WORK:${card.email.trim()}` : `EMAIL;PREF;INTERNET:${card.email.trim()}`);
  }

  // Website
  if (card.website?.trim()) {
    let site = card.website.trim();
    if (!/^https?:\/\//i.test(site)) {
      site = `https://${site}`;
    }
    parts.push(`URL:${site}`);
  }

  // Address: ;;Street;City;State;ZipCode;Country
  const hasAddr = card.street || card.city || card.state || card.zipCode || card.country;
  if (hasAddr) {
    const street = (card.street || '').replace(/;/g, ' ');
    const city = (card.city || '').replace(/;/g, ' ');
    const state = (card.state || '').replace(/;/g, ' ');
    const zip = (card.zipCode || '').replace(/;/g, ' ');
    const country = (card.country || '').replace(/;/g, ' ');
    const addrVal = `;;${street};${city};${state};${zip};${country}`;
    parts.push(isV3 ? `ADR;TYPE=WORK:${addrVal}` : `ADR;WORK:${addrVal}`);
  }

  parts.push('END:VCARD');
  return parts.join('\n');
}

/**
 * Encodes ZXing standard Wi-Fi configuration string
 */
export function generateWifiString(wifi: WifiPayload): string {
  const escapeVal = (val?: string) => (val || '').replace(/([\\;,:"])/g, '\\$1');
  const ssid = escapeVal(wifi.ssid.trim());
  const type = wifi.encryption || 'WPA';
  const pass = type !== 'nopass' ? escapeVal(wifi.password || '') : '';
  const hidden = wifi.hidden ? 'true' : 'false';

  return `WIFI:T:${type};S:${ssid};P:${pass};H:${hidden};;`;
}

/**
 * Encodes Geographic location either as direct Google Maps search or RFC 5870 geo URI
 */
export function generateLocationString(loc: LocationPayload): string {
  const lat = (loc.latitude || '41.311081').trim();
  const lng = (loc.longitude || '69.240562').trim();

  if (loc.format === 'geo_uri') {
    return `geo:${lat},${lng}`;
  }

  if (loc.addressSearch?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.addressSearch.trim())}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Helper to convert date and time string to UTC compact iCal format YYYYMMDDTHHmmssZ
 */
function toICalDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = (timeStr || '00:00').replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Encodes RFC 5545 iCalendar VEVENT standard string
 */
export function generateEventString(evt: EventPayload): string {
  const parts: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//urls.uz//QR Studio//EN',
    'BEGIN:VEVENT',
  ];

  parts.push(`SUMMARY:${(evt.title || 'Meeting').trim()}`);

  if (evt.location?.trim()) {
    parts.push(`LOCATION:${evt.location.trim().replace(/\n/g, ' ')}`);
  }
  if (evt.description?.trim()) {
    parts.push(`DESCRIPTION:${evt.description.trim().replace(/\n/g, '\\n')}`);
  }

  if (evt.allDay) {
    const startDate = (evt.startDate || '').replace(/-/g, '');
    const endDate = (evt.endDate || evt.startDate || '').replace(/-/g, '');
    if (startDate) parts.push(`DTSTART;VALUE=DATE:${startDate}`);
    if (endDate) parts.push(`DTEND;VALUE=DATE:${endDate}`);
  } else {
    const start = toICalDateTime(evt.startDate, evt.startTime);
    const end = toICalDateTime(evt.endDate || evt.startDate, evt.endTime || evt.startTime);
    if (start) parts.push(`DTSTART:${start}`);
    if (end) parts.push(`DTEND:${end}`);
  }

  parts.push('END:VEVENT');
  parts.push('END:VCALENDAR');
  return parts.join('\n');
}

/**
 * Preset data samples matching QRCode Monkey testing
 */
export const QR_SAMPLE_DATA = {
  vcard: {
    version: '3.0' as const,
    firstName: 'Sherzod',
    lastName: 'Qosimov',
    organization: 'FinTech Innovation Lab',
    jobTitle: 'Senior Software Architect',
    phoneWork: '+998 71 200 00 00',
    phonePrivate: '+998 71 234 56 78',
    phoneMobile: '+998 90 123 45 67',
    faxWork: '+998 71 200 00 01',
    faxPrivate: '',
    email: 'sherzod@urls.uz',
    website: 'https://urls.uz/sherzod',
    street: 'Amir Temur shoh ko‘chasi 107',
    zipCode: '100084',
    city: 'Toshkent',
    state: 'Toshkent shahri',
    country: 'O‘zbekiston',
  },
  wifi: {
    ssid: 'UrlsUz_Office_5G',
    password: 'Toshkent2026!',
    encryption: 'WPA' as const,
    hidden: false,
  },
  location: {
    latitude: '41.311081',
    longitude: '69.240562',
    addressSearch: 'Amir Temur Xiyoboni, Toshkent',
    format: 'google_maps' as const,
  },
  event: {
    title: 'Tashkent Tech Summit 2026',
    location: 'Hilton Tashkent City, Grand Ballroom',
    description: 'Raqamli texnologiyalar va sunʼiy intellekt bo‘yicha xalqaro konferensiya',
    startDate: '2026-10-15',
    startTime: '10:00',
    endDate: '2026-10-15',
    endTime: '18:00',
    allDay: false,
  },
  text: 'urls.uz — O‘zbekiston uchun zamonaviy qisqa havolalar, dinamik QR-kodlar va Bio-sahifalar platformasi!',
};
