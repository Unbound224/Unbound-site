import { SectionHeading, delay } from '@/components/landing/Section';

const AUDIENCES = [
  {
    key: 'shoppers',
    title: 'Shoppers',
    lead: 'Holding credit you will not use?',
    points: ['See which credits a real issuer stands behind', 'Swap for another asset at a quote you approve', 'Or redeem it; the escrow protects you if the shop never answers'],
    art: <ShopperArt />,
  },
  {
    key: 'merchants',
    title: 'Merchants',
    lead: 'Issue credit people can actually use.',
    points: ['Publish a signed redemption policy', 'Confirm or reject redemptions from the console', 'Every step is a ledger record, not a spreadsheet'],
    art: <MerchantArt />,
  },
  {
    key: 'developers',
    title: 'Developers',
    lead: 'Open source, end to end.',
    points: ['TypeScript API, Stellar SDK and a Soroban contract', 'Flutter wallet that decodes XDR before signing', 'Testnet fixtures and failure-path tests to build on'],
    art: <DeveloperArt />,
  },
] as const;

export function Audiences() {
  return (
    <section aria-labelledby="who-title" id="who" className="py-16 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading id="who-title" eyebrow="Who it is for" title="One ledger, three ways in" lead="Unbound is useful only when all three sides show up: people holding credit, retailers who honor it, and builders who can check the work." />
        <ul className="grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <li key={a.key} data-reveal style={delay(i * 90)} className="card card-hover overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-soft">{a.art}</div>
              <div className="space-y-3 p-6">
                <h3 className="text-xl font-semibold">{a.title}</h3>
                <p className="font-medium">{a.lead}</p>
                <ul className="space-y-1.5 text-sm text-muted">
                  {a.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Flat brand illustrations (inline SVG, colours from the theme tokens). */
function ShopperArt() {
  return (
    <svg viewBox="0 0 200 140" className="h-32 w-auto" aria-hidden="true">
      <rect x="40" y="46" width="72" height="74" rx="10" fill="var(--brand-primary)" />
      <path d="M58 46v-8a18 18 0 0 1 36 0v8" fill="none" stroke="var(--brand-deep)" strokeWidth="6" strokeLinecap="round" />
      <rect x="54" y="72" width="44" height="8" rx="4" fill="var(--brand-on-deep)" opacity="0.85" />
      <g className="float-slow">
        <circle cx="140" cy="58" r="20" fill="var(--brand-accent)" />
        <text x="140" y="63" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" fill="var(--brand-deep)">
          SHOP
        </text>
      </g>
      <circle cx="158" cy="102" r="14" fill="var(--surface)" stroke="var(--brand-primary)" strokeWidth="3" />
      <path d="M151 102l5 5 9-10" fill="none" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MerchantArt() {
  return (
    <svg viewBox="0 0 200 140" className="h-32 w-auto" aria-hidden="true">
      <rect x="36" y="40" width="128" height="84" rx="8" fill="var(--surface)" stroke="var(--brand-deep)" strokeWidth="4" />
      <path d="M30 40l12-22h116l12 22z" fill="var(--brand-primary)" />
      <path d="M30 40h140" stroke="var(--brand-deep)" strokeWidth="4" />
      <rect x="54" y="70" width="36" height="54" rx="4" fill="var(--brand-accent)" />
      <rect x="104" y="64" width="44" height="30" rx="4" fill="var(--bg-soft)" stroke="var(--brand-deep)" strokeWidth="3" />
      <path d="M114 79l7 7 15-15" fill="none" stroke="var(--brand-primary)" strokeWidth="4" strokeLinecap="round" />
      <g className="float-slow">
        <rect x="140" y="8" width="44" height="24" rx="6" fill="var(--brand-deep)" />
        <text x="162" y="24" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--brand-on-deep)">
          policy
        </text>
      </g>
    </svg>
  );
}

function DeveloperArt() {
  return (
    <svg viewBox="0 0 200 140" className="h-32 w-auto" aria-hidden="true">
      <rect x="26" y="22" width="148" height="100" rx="10" fill="var(--brand-deep)" />
      <circle cx="42" cy="36" r="4" fill="var(--brand-accent)" />
      <circle cx="54" cy="36" r="4" fill="var(--brand-primary)" />
      <text x="40" y="64" fontFamily="var(--font-mono)" fontSize="11" fill="var(--brand-accent)">
        $ npm run check
      </text>
      <text x="40" y="82" fontFamily="var(--font-mono)" fontSize="11" fill="var(--brand-on-deep)">
        ✓ tests passed
      </text>
      <text x="40" y="100" fontFamily="var(--font-mono)" fontSize="11" fill="var(--brand-on-deep)" opacity="0.8">
        cargo test
      </text>
      <rect x="112" y="92" width="7" height="12" fill="var(--brand-accent)" className="pulse-cursor" />
    </svg>
  );
}
