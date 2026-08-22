import { SiteHeader } from '@/components/SiteHeader';
import { Hero } from '@/components/Hero';
import { PricingCheckDemo } from '@/components/PricingCheckDemo';
import { SampleDigest } from '@/components/SampleDigest';
import { PricingTeaser } from '@/components/PricingTeaser';
import { ClosingSignup } from '@/components/ClosingSignup';
import { SiteFooter } from '@/components/SiteFooter';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-paper font-sans text-graphite">
      <SiteHeader />
      <Hero />
      <PricingCheckDemo />
      <SampleDigest />
      <PricingTeaser />
      <ClosingSignup />
      <SiteFooter />
    </main>
  );
}
