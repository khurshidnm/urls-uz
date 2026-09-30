import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import StatsBand from '@/components/landing/stats-band';
import Features from '@/components/landing/features';
import SmartDeepLinkSection from '@/components/landing/smart-deep-link-section';
import QrPreviewSection from '@/components/landing/qr-preview-section';
import BioPreviewSection from '@/components/landing/bio-preview-section';
import PricingSection from '@/components/landing/pricing-section';
import Footer from '@/components/landing/footer';
import { db } from '@/lib/db';

// Landing stats are real database counts, refreshed at most once a minute
export const revalidate = 60;

export default async function HomePage() {
  const stats = await db.getPublicStats();

  return (
    <main className="min-h-screen bg-mesh flex flex-col bg-grid-pattern">
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
