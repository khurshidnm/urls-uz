import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import StatsBand from '@/components/landing/stats-band';
import Features from '@/components/landing/features';
import SmartDeepLinkSection from '@/components/landing/smart-deep-link-section';
import QrPreviewSection from '@/components/landing/qr-preview-section';
import BioPreviewSection from '@/components/landing/bio-preview-section';
import PricingSection from '@/components/landing/pricing-section';
import Footer from '@/components/landing/footer';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

// Landing stats are real database counts, refreshed at most once a minute
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    // One page in three languages (switched on the page); Uzbek is the default
    languages: { uz: '/', ru: '/', en: '/', 'x-default': '/' },
  },
};

/**
 * Structured data for search engines: the organization, the site and the
 * product. Only facts: no ratings or review counts.
 */
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ['uz', 'ru', 'en'],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: SITE_DESCRIPTION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'UZS', description: 'Bepul tarif' },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default async function HomePage() {
  const stats = await db.getPublicStats();

  return (
    <main className="min-h-screen bg-mesh flex flex-col bg-grid-pattern">
      <script
        type="application/ld+json"
        // JSON from constants above; `<` is escaped so the data can't close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <Navbar />
      <Hero totalRedirects={stats.totalRedirects} />
      <StatsBand stats={stats} />
      <Features />
      <SmartDeepLinkSection />
      <QrPreviewSection />
      <BioPreviewSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
