import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import StatsBand from '@/components/landing/stats-band';
import Features from '@/components/landing/features';
import SmartDeepLinkSection from '@/components/landing/smart-deep-link-section';
import QrPreviewSection from '@/components/landing/qr-preview-section';
import BioPreviewSection from '@/components/landing/bio-preview-section';
import PricingSection from '@/components/landing/pricing-section';
import Footer from '@/components/landing/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mesh flex flex-col bg-grid-pattern">
      <Navbar />
      <Hero />
      <StatsBand />
      <Features />
      <SmartDeepLinkSection />
      <QrPreviewSection />
      <BioPreviewSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
