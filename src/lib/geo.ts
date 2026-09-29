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
  const cfCountry = headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || 'UZ';
  const cfCity = headers.get('cf-ipcity') || headers.get('x-vercel-ip-city') || 'Tashkent';
  const cfRegion = headers.get('cf-region') || headers.get('x-vercel-ip-country-region') || 'Toshkent shahri';

  const countryUpper = cfCountry.toUpperCase();

  if (countryUpper === 'UZ') {
    const matched = UZBEKISTAN_REGIONS.find((r) =>
      cfRegion.toLowerCase().includes(r.toLowerCase()) ||
      cfCity.toLowerCase().includes(r.toLowerCase())
    );
    return {
      country: 'UZ',
      region: matched || 'Toshkent shahri',
      city: cfCity || 'Toshkent',
    };
  }

  // International traffic
  const countryData = COUNTRY_META[countryUpper];
  return {
    country: countryUpper,
    region: cfRegion || countryData?.nameUz || countryUpper,
    city: cfCity || 'Unknown',
  };
}
