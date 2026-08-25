import { SiteHeader } from '@/components/SiteHeader';
import { Hero } from '@/components/Hero';
import { QuickCheck } from '@/components/QuickCheck';
import { SampleDigest } from '@/components/SampleDigest';
import { PricingTeaser } from '@/components/PricingTeaser';
import { About } from '@/components/About';
import { ClosingSignup } from '@/components/ClosingSignup';
import { SiteFooter } from '@/components/SiteFooter';
import { AuthHashHandler } from '@/components/auth/AuthHashHandler';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-paper font-sans text-graphite">
      <AuthHashHandler />
      <SiteHeader />
      <Hero />
      <QuickCheck />
      <SampleDigest />
      <PricingTeaser />
      <About />
      <ClosingSignup />
      <SiteFooter />
    </main>
  );
}
