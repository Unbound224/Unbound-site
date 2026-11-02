import Image from 'next/image';
import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <Image src="/brand/icon-192.png" alt="" width={32} height={32} />
          <span>Unbound</span>
        </Link>
        <nav aria-label="Main" className="flex gap-5 text-sm">
          <Link href="/docs" className="underline-offset-4 hover:underline">
            Partner docs
          </Link>
          <Link href="/merchant" className="underline-offset-4 hover:underline">
            Merchant console
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function TestnetBanner() {
  return (
    <p role="note" className="bg-ink px-4 py-2 text-center text-sm text-ondark">
      Testnet demo with synthetic assets only. No real funds, no cash-out, no live store listings.
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
        <p>
          Unbound exchanges only credits that a verified issuer has agreed to issue, transfer and honor. Liquidity is never guaranteed and quotes expire.
          This is pre-release software; there is no mobile app in any store and no approved partner programme.
        </p>
      </div>
    </footer>
  );
}
