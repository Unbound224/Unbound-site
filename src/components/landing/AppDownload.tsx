import { ICONS, Icon, SectionHeading } from '@/components/landing/Section';
import { MOBILE_RELEASES_URL, OFFICIAL_BADGES, getStoreLinks, type StoreLinks } from '@/lib/site-config';

/**
 * Store badges are config-driven. Official artwork is loaded from the vendors (never redrawn) and only when a real
 * listing URL is configured. Without one: Android beta APK from GitHub Releases, and an inert "iOS - coming soon".
 */
export function StoreButtons({ links }: { links: StoreLinks }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {links.playStore ? (
        <a href={links.playStore} className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element -- official Google Play badge, served by Google */}
          <img src={OFFICIAL_BADGES.playStore} alt="Get it on Google Play" height={60} className="h-[60px] w-auto" />
        </a>
      ) : (
        <a href={MOBILE_RELEASES_URL} className="btn btn-primary">
          <Icon d={ICONS.phone} className="h-4 w-4" />
          Download for Android (beta APK)
        </a>
      )}
      {links.appStore ? (
        <a href={links.appStore} className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element -- official Apple App Store badge, served by Apple */}
          <img src={OFFICIAL_BADGES.appStore} alt="Download on the App Store" height={40} className="h-10 w-auto" />
        </a>
      ) : (
        <p className="btn btn-ghost cursor-default text-muted hover:!translate-y-0">
          <Icon d={ICONS.clock} className="h-4 w-4" />
          iOS — coming soon
        </p>
      )}
    </div>
  );
}

export function AppDownload() {
  const links = getStoreLinks();
  const listed = Boolean(links.appStore || links.playStore);
  return (
    <section aria-labelledby="app-title" id="app" className="py-16 sm:py-24 lg:py-28">
      <div className="container-page">
        <div className="card relative grid gap-10 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
          <div className="relative">
            <SectionHeading
              id="app-title"
              eyebrow="Consumer app"
              title="Your credits, quotes and receipts in one wallet"
              lead="A Flutter app for Android and iOS: see what your credit is worth and who stands behind it, review every quote, and sign on your device."
            />
            <div data-reveal className="-mt-4 space-y-4">
              <StoreButtons links={links} />
              <p className="text-sm text-muted">
                {listed
                  ? 'Testnet only. Store availability may vary by region.'
                  : 'Not available in any app store yet. The Android beta is a Testnet-only build attached to tagged GitHub Releases, for people comfortable sideloading an APK.'}
              </p>
            </div>
          </div>
          <ul data-reveal className="relative grid gap-3 text-sm">
            {[
              ['Inventory', 'Credits classified as redeemable, supported, unverified, suspended, expired or frozen.'],
              ['Quote review', 'Live expiry countdown, re-derived slippage floor and full issuer disclosure.'],
              ['Local XDR check', 'The transaction is decoded and compared with the quote before signing.'],
              ['Status & receipts', 'Pending, reconciling and confirmed states that survive restarts.'],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-3 rounded-xl border border-line bg-bg p-4">
                <Icon d={ICONS.check} className="mt-0.5 h-4 w-4 shrink-0 text-link" />
                <span>
                  <span className="font-semibold">{t}.</span> <span className="text-muted">{b}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
