import type { MetadataRoute } from 'next';
import { BRAND, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

/** Lets phones add urls.uz to the home screen as an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/dashboard',
    display: 'standalone',
    background_color: BRAND.background,
    theme_color: BRAND.background,
    lang: 'uz',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
