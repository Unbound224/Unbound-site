import { ICONS, Icon, delay } from '@/components/landing/Section';

const PILLARS = [
  {
    title: 'Issuer-authorized redemption',
    body: 'Only credit whose issuer is verified, has signed a redemption policy and has not been revoked is eligible. Eligibility is re-checked every time, and revoking an issuer suspends its programs at once.',
    icon: ICONS.shield,
  },
  {
    title: 'No fake liquidity',
    body: 'Unbound does not make markets, promise a price or hold your funds. If the order books cannot fill an exchange within your slippage cap, it fails safely without spending.',
    icon: ICONS.ban,
  },
  {
    title: 'Testnet status',
    body: 'Everything today runs on Stellar Testnet with synthetic assets. Mainnet needs an external security review and legal and compliance work that has not happened.',
    icon: ICONS.flask,
  },
] as const;

const NOT_THIS = [
  'Converting any random gift card or loyalty point',
  'Guaranteed liquidity or a guaranteed price',
  'Bank withdrawals or fiat cash-out',
  'Anything with real money (Testnet only today)',
] as const;

export function Trust() {
  return (
    <section aria-labelledby="trust-title" id="trust" className="bg-deep py-24 text-ondark sm:py-28">
      <div className="container-page">
        <div data-reveal className="mb-12 max-w-2xl space-y-4">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-accent">Trust &amp; safety</p>
          <h2 id="trust-title" className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Credible by construction, not by claims
          </h2>
          <p className="text-lg text-white/75">
            A Stellar asset alone does not prove anyone will redeem it. Unbound is built around the issuer&apos;s obligation, and is upfront about what it
            cannot do.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <li key={p.title} data-reveal style={delay(i * 90)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-accent/60">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                <Icon d={p.icon} />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{p.body}</p>
            </li>
          ))}
        </ul>
        <div data-reveal className="mt-8 grid gap-6 rounded-2xl border border-white/10 p-6 md:grid-cols-[1fr_2fr] md:items-center">
          <h3 className="text-xl font-semibold">What Unbound is not</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {NOT_THIS.map((n) => (
              <li key={n} className="flex items-start gap-3 text-sm text-white/85">
                <Icon d={ICONS.ban} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
