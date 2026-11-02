import Link from 'next/link';

const steps = [
  { title: 'Issuer opts in', body: 'A retailer is verified and publishes signed redemption terms. Without an issuer there is no usable store credit.' },
  { title: 'Credit is issued on Stellar', body: 'The credit is a Stellar asset. Holders explicitly add a trustline and the issuer authorizes them.' },
  { title: 'You see the real quote', body: 'Actual order-book liquidity, fees, slippage cap and expiry. If there is no route, there is no quote.' },
  { title: 'You approve and sign', body: 'Exact amounts, on your device. Settlement is shown only after the ledger confirms it.' },
];

const notThis = [
  'Converting any random gift card or loyalty point',
  'Guaranteed liquidity or a guaranteed price',
  'Bank withdrawals or fiat cash-out',
  'Anything with real money (Testnet only today)',
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section aria-labelledby="hero" className="space-y-5">
        <h1 id="hero" className="text-4xl font-bold leading-tight md:text-5xl">
          Turn stranded value into something usable.
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          Unbound is an issuer-authorized marketplace for merchant credits that are genuinely redeemable and transferable. Hold a store credit, see what it
          can really fetch through native Stellar liquidity, and exchange it - or redeem it with the merchant that issued it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/merchant/apply" className="rounded-md bg-primary px-5 py-3 font-semibold text-white">
            Apply as a merchant issuer
          </Link>
          <Link href="/docs" className="rounded-md border border-ink px-5 py-3 font-semibold">
            Read the partner docs
          </Link>
        </div>
        <p className="text-sm text-muted">Consumer app: in development, not available in any app store.</p>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-4 text-2xl font-semibold">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-line p-5">
              <p className="text-sm font-semibold text-primary">Step {i + 1}</p>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="not" className="rounded-lg bg-ink p-6 text-ondark">
        <h2 id="not" className="mb-3 text-2xl font-semibold">
          What Unbound is not
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {notThis.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="merchants" className="space-y-3">
        <h2 id="merchants" className="text-2xl font-semibold">
          For merchants
        </h2>
        <p className="max-w-2xl text-muted">
          You keep the redemption promise. Unbound verifies you, records your signed policy (expiry, limits, jurisdiction, refunds) and gives you a console to
          confirm redemptions after the returned credit is confirmed on the ledger. Verification is a human review; applying does not approve you.
        </p>
        <Link href="/merchant" className="font-semibold text-primary underline underline-offset-4">
          Open the merchant console
        </Link>
      </section>
    </div>
  );
}
