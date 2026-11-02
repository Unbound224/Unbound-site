import Image from 'next/image';
import Link from 'next/link';
import { MobileMenu } from '@/components/MobileMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ORG_URL, REPOS } from '@/lib/site-config';

export const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#trust', label: 'Trust & safety' },
  { href: '/#merchants', label: 'Merchants' },
  { href: '/#open-source', label: 'Open source' },
  { href: '/#faq', label: 'FAQ' },
] as const;

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight text-ink">
      <Image src="/brand/icon.svg" alt="" width={32} height={32} className="rounded-lg" priority />
      <span className="text-lg">Unbound</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-muted transition-colors hover:bg-soft hover:text-ink">
              {l.label}
            </Link>
          ))}
          <Link href="/docs" className="rounded-lg px-3 py-2 text-muted transition-colors hover:bg-soft hover:text-ink">
            Partner docs
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/merchant" className="btn btn-primary hidden !min-h-10 !px-4 !py-2 text-sm sm:inline-flex">
            Merchant console
          </Link>
          <MobileMenu links={[...NAV_LINKS, { href: '/docs', label: 'Partner docs' }, { href: '/merchant', label: 'Merchant console' }]} />
        </div>
      </div>
    </header>
  );
}

export function TestnetBanner() {
  return (
    <p role="note" className="bg-deep px-4 py-2 text-center text-xs font-medium text-ondark sm:text-sm">
      <span className="mr-2 inline-block rounded-full bg-primary px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider text-white">Testnet</span>
      Testnet demo with synthetic assets only. No real funds, no cash-out, no live store listings.
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid grid-cols-2 gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 space-y-4 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-muted">Turn stranded value into something usable. Issuer-authorized store credit on Stellar.</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Product</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/#how-it-works" className="hover:text-ink">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/#app" className="hover:text-ink">
                Mobile app (beta)
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-ink">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Merchants</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/merchant/apply" className="hover:text-ink">
                Apply as an issuer
              </Link>
            </li>
            <li>
              <Link href="/merchant" className="hover:text-ink">
                Merchant console
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-ink">
                Partner docs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Open source</h2>
          <ul className="space-y-2 text-sm text-muted">
            {REPOS.map((r) => (
              <li key={r.name}>
                <a href={r.url} className="hover:text-ink">
                  {r.name}
                </a>
              </li>
            ))}
            <li>
              <a href={`${ORG_URL}/Unbound-site/blob/main/SECURITY.md`} className="hover:text-ink">
                Security policy
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-muted md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl">
            Unbound exchanges only credits that a verified issuer has agreed to issue, transfer and honor. Liquidity is never guaranteed and quotes expire.
            This is pre-release software; there is no mobile app in any store and no approved partner programme.
          </p>
          <p className="shrink-0">MIT licensed · Stellar Testnet</p>
        </div>
      </div>
    </footer>
  );
}
