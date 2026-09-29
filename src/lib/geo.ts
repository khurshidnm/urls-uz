/**
 * Uzbekistan Regions & Geo Analytics Helper
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

export function resolveRegionFromHeaders(headers: Headers): {
  country: string;
  region: string;
  city: string;
} {
  const cfCountry = headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || 'UZ';
  const cfCity = headers.get('cf-ipcity') || headers.get('x-vercel-ip-city') || 'Tashkent';
  const cfRegion = headers.get('cf-region') || headers.get('x-vercel-ip-country-region') || 'Toshkent shahri';

  if (cfCountry.toUpperCase() === 'UZ') {
    // Check if matched region or fallback to realistic region distribution
    const matched = UZBEKISTAN_REGIONS.find(r => 
      cfRegion.toLowerCase().includes(r.toLowerCase()) || 
      cfCity.toLowerCase().includes(r.toLowerCase())
    );
    return {
      country: 'UZ',
      region: matched || 'Toshkent shahri',
      city: cfCity || 'Toshkent',
    };
  }

  return {
    country: cfCountry || 'Global',
    region: cfRegion || 'International',
    city: cfCity || 'Unknown',
  };
}
