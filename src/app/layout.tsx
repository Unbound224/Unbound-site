import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader, TestnetBanner } from '@/components/SiteChrome';
import { SessionProvider } from '@/lib/session';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Unbound - redeemable merchant credit on Stellar', template: '%s | Unbound' },
  description: 'Issuer-authorized, genuinely redeemable merchant credits that can be exchanged through native Stellar liquidity. Testnet demo.',
  icons: { icon: '/brand/icon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-surface focus:p-2">
          Skip to content
        </a>
        <SessionProvider>
          <TestnetBanner />
          <SiteHeader />
          <main id="main" className="mx-auto max-w-5xl px-4 py-10">
            {children}
          </main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
