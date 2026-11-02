import Link from 'next/link';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { ICONS, Icon, delay } from '@/components/landing/Section';
import { ORG_URL } from '@/lib/site-config';

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="hero-backdrop relative overflow-hidden">
      <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0" />
      <div className="container-page relative grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pb-28 lg:pt-24">
        <div className="space-y-7">
          <p data-reveal className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1.5 pr-3 text-xs font-medium text-muted shadow-card">
            <span className="relative flex h-5 items-center rounded-full bg-primary px-2 font-mono text-[0.65rem] uppercase tracking-wider text-white">Preview</span>
            Open source · Built on Stellar · Testnet only
          </p>
          <h1 id="hero-title" data-reveal className="text-[2.5rem] font-extrabold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-[3.6rem] xl:text-[3.9rem]">
            Turn stranded value into something <span className="text-link">usable.</span>
          </h1>
          <p data-reveal style={delay(80)} className="max-w-xl text-lg text-muted text-pretty sm:text-xl">
            Unbound lets you exchange store credit that a retailer has genuinely issued and promised to honor for other Stellar assets, at a real
            quote, signed on your own device. Or redeem it with the merchant who issued it.
          </p>
          <div data-reveal style={delay(160)} className="flex flex-col gap-3 sm:flex-row">
            <Link href="/merchant/apply" className="btn btn-primary">
              Become an issuer
              <Icon d={ICONS.arrow} className="h-4 w-4" />
            </Link>
            <a href={ORG_URL} className="btn btn-ghost">
              <Icon d={ICONS.github} className="h-4 w-4" />
              Explore the code
            </a>
          </div>
          <ul data-reveal style={delay(240)} className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {['Issuer-authorized credit only', 'No guaranteed liquidity', 'You sign every transaction'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon d={ICONS.check} className="h-4 w-4 text-link" />
                {t}
              </li>
            ))}
          </ul>
          <p data-reveal style={delay(300)} className="text-sm text-muted">
            Consumer app:{' '}
            <a href="#app" className="font-semibold text-link underline decoration-1 underline-offset-4">
              Android beta (APK) · iOS coming soon
            </a>
          </p>
        </div>
        <div data-reveal style={delay(120)}>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
