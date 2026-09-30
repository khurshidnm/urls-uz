/**
 * Uzbekistan & Global Geo Analytics Helper
 */

export const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Farg‘ona',
  'Andijon',
  'Namangan',
  'Buxoro',
  'Qashqadaryo',
  'Surxondaryo',
  'Xorazm',
  'Navoiy',
  'Jizzax',
  'Sirdaryo',
  'Qoraqalpog‘iston',
] as const;

export type UzbekistanRegion = typeof UZBEKISTAN_REGIONS[number];

export const COUNTRY_META: Record<string, { nameUz: string; nameRu: string; nameEn: string; flag: string }> = {
  UZ: { nameUz: 'O‘zbekiston', nameRu: 'Узбекистан', nameEn: 'Uzbekistan', flag: '🇺🇿' },
  RU: { nameUz: 'Rossiya', nameRu: 'Россия', nameEn: 'Russia', flag: '🇷🇺' },
  KZ: { nameUz: 'Qozog‘iston', nameRu: 'Казахстан', nameEn: 'Kazakhstan', flag: '🇰🇿' },
  TR: { nameUz: 'Turkiya', nameRu: 'Турция', nameEn: 'Turkey', flag: '🇹🇷' },
  US: { nameUz: 'AQSH', nameRu: 'США', nameEn: 'United States', flag: '🇺🇸' },
  AE: { nameUz: 'BAA (Dubay)', nameRu: 'ОАЭ (Дубай)', nameEn: 'UAE', flag: '🇦🇪' },
  KR: { nameUz: 'Janubiy Koreya', nameRu: 'Южная Корея', nameEn: 'South Korea', flag: '🇰🇷' },
  DE: { nameUz: 'Germaniya', nameRu: 'Германия', nameEn: 'Germany', flag: '🇩🇪' },
  GB: { nameUz: 'Buyuk Britaniya', nameRu: 'Великобритания', nameEn: 'United Kingdom', flag: '🇬🇧' },
  KG: { nameUz: 'Qirg‘iziston', nameRu: 'Кыргызстан', nameEn: 'Kyrgyzstan', flag: '🇰🇬' },
  TJ: { nameUz: 'Tojikiston', nameRu: 'Таджикистан', nameEn: 'Tajikistan', flag: '🇹🇯' },
  CN: { nameUz: 'Xitoy', nameRu: 'Китай', nameEn: 'China', flag: '🇨🇳' },
  PL: { nameUz: 'Polsha', nameRu: 'Польша', nameEn: 'Poland', flag: '🇵🇱' },
};

export function getCountryInfo(countryCode: string) {
  const code = (countryCode || 'UZ').toUpperCase();
  return (
    COUNTRY_META[code] || {
      nameUz: code,
      nameRu: code,
      nameEn: code,
      flag: '🌐',
    }
  );
}

export function resolveRegionFromHeaders(headers: Headers): {
  country: string;
  region: string;
  city: string;
} {
  // Only record what the CDN actually reports; missing data stays 'Unknown'
  // instead of being attributed to Tashkent.
  const decode = (v: string | null) => {
    if (!v) return '';
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const country = (headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || '').toUpperCase();
  const city = decode(headers.get('cf-ipcity') || headers.get('x-vercel-ip-city'));
  const region = decode(headers.get('cf-region') || headers.get('x-vercel-ip-country-region'));

  if (!country || country === 'XX') {
    return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
  }

  if (country === 'UZ') {
    const matched = UZBEKISTAN_REGIONS.find((r) =>
      (region && region.toLowerCase().includes(r.toLowerCase())) ||
      (city && city.toLowerCase().includes(r.toLowerCase()))
    );
    return {
      country: 'UZ',
      region: matched || 'Unknown',
      city: city || 'Unknown',
    };
  }

  // International traffic
  const countryData = COUNTRY_META[country];
  return {
    country,
    region: region || countryData?.nameUz || country,
    city: city || 'Unknown',
  };
}
