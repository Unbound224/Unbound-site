import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { SiteFooter, SiteHeader, TestnetBanner } from '@/components/SiteChrome';
import { RevealObserver } from '@/components/Reveal';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import { SessionProvider } from '@/lib/session';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Unbound - redeemable merchant credit on Stellar', template: '%s | Unbound' },
  description:
    'Exchange genuinely redeemable, issuer-authorized store credit for other Stellar assets at a real quote, signed on your device. Open source, Stellar Testnet preview.',
  icons: { icon: '/brand/icon.svg', apple: '/brand/icon-192.png' },
  openGraph: {
    title: 'Unbound - redeemable merchant credit on Stellar',
    description: 'Issuer-authorized store credit you can actually redeem or exchange through native Stellar liquidity. Testnet preview.',
    images: ['/brand/icon-512.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0724' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme and marks JS before first paint (no flash, no-JS users see all content). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-card"
        >
          Skip to content
        </a>
        <SessionProvider>
          <TestnetBanner />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </SessionProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
