/**
 * Public links and download configuration for the landing site.
 *
 * Store badges are deliberately config-driven: the consumer app is NOT listed on the App Store or Google Play.
 * An official badge renders only when its env var is set at build time AND points at the vendor's own store
 * domain. Until then the site shows the Android beta APK (GitHub Releases) and an "iOS - coming soon" state.
 */

export const ORG_URL = 'https://github.com/Unbound224';
export const MOBILE_RELEASES_URL = 'https://github.com/Unbound224/Unbound-mobile/releases';

export type Repo = {
  name: string;
  url: string;
  stack: string;
  role: string;
  owns: string;
};

/** The four real repositories (names verified against `git remote -v`). */
export const REPOS: readonly Repo[] = [
  {
    name: 'Unbound-core',
    url: 'https://github.com/Unbound224/Unbound-core',
    stack: 'TypeScript · Node 22 · SQLite',
    role: 'Backend API',
    owns: 'Issuer verification, signed redemption policies, exchange-intent state machine, redemptions, disputes, audit trail.',
  },
  {
    name: 'Unbound-stellar',
    url: 'https://github.com/Unbound224/Unbound-stellar',
    stack: 'TypeScript · Stellar SDK',
    role: 'Stellar SDK + gateway',
    owns: 'Trustline and issuer-flag checks, strict-send path quotes, unsigned transaction builders, submission and ledger reconciliation.',
  },
  {
    name: 'Unbound-mobile',
    url: 'https://github.com/Unbound224/Unbound-mobile',
    stack: 'Flutter · Dart · Riverpod',
    role: 'Consumer wallet app',
    owns: 'Credit inventory, quote review, on-device XDR inspection and signing, exchange and redemption status.',
  },
  {
    name: 'Unbound-site',
    url: 'https://github.com/Unbound224/Unbound-site',
    stack: 'Next.js · React · Tailwind',
    role: 'Landing + merchant console',
    owns: 'This site: public landing, partner docs, issuer application and the merchant redemption console.',
  },
];

const STORE_HOSTS = {
  appStore: 'apps.apple.com',
  playStore: 'play.google.com',
} as const;

/** Official badge artwork, served by the vendors themselves (never redrawn or committed here). */
export const OFFICIAL_BADGES = {
  appStore: 'https://tools.applemarketingtools.com/api/badges/download-on-the-app-store/black/en-us',
  playStore: 'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png',
} as const;

function storeUrl(raw: string | undefined, host: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' && u.hostname === host ? u.toString() : null;
  } catch {
    return null;
  }
}

export type StoreLinks = { appStore: string | null; playStore: string | null };

/**
 * Reads NEXT_PUBLIC_APP_STORE_URL / NEXT_PUBLIC_PLAY_STORE_URL. Anything unset, malformed, non-https or not on the
 * vendor's store domain is treated as "no listing".
 */
export function getStoreLinks(): StoreLinks {
  return {
    appStore: storeUrl(process.env.NEXT_PUBLIC_APP_STORE_URL, STORE_HOSTS.appStore),
    playStore: storeUrl(process.env.NEXT_PUBLIC_PLAY_STORE_URL, STORE_HOSTS.playStore),
  };
}
