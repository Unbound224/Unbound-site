import { AppDownload } from '@/components/landing/AppDownload';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Merchants } from '@/components/landing/Merchants';
import { OpenSource } from '@/components/landing/OpenSource';
import { Trust } from '@/components/landing/Trust';

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Trust />
      <AppDownload />
      <Merchants />
      <OpenSource />
      <Faq />
    </>
  );
}
