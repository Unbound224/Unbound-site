import Link from 'next/link';
import { ICONS, Icon, SectionHeading } from '@/components/landing/Section';

const YOU_PROVIDE = [
  'A verifiable legal identity (reviewed by a person, applying does not approve you)',
  'A redemption policy signed offline with your issuer key',
  'An issuer account with authorization required, so you approve each holder',
  'Honored redemptions, confirmed only after the ledger shows the return',
] as const;

const PREVIEW_ROWS = [
  { id: 'red_8f2', amount: '30.00', state: 'Return confirmed', action: 'Confirm fulfilment' },
  { id: 'red_8e7', amount: '12.50', state: 'Return submitted', action: 'Waiting on ledger' },
  { id: 'red_8d1', amount: '5.00', state: 'Fulfilled', action: 'Done' },
] as const;

function ConsolePreview() {
  return (
    <figure className="relative">
      <div aria-hidden="true" className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-soft px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-3 font-mono text-[0.7rem] text-muted">Merchant console · Redemption queue</span>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div>
              <p className="font-semibold">SHOP</p>
              <p className="font-mono text-[0.7rem] text-muted">GA7Q…K2XD · auth required</p>
            </div>
            <span className="rounded-full bg-deep px-2.5 py-1 text-[0.7rem] font-medium text-ondark">ACTIVE</span>
          </div>
          {PREVIEW_ROWS.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-bg p-3 text-sm">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted">{r.id}</p>
                <p className="font-medium">
                  {r.amount} SHOP · <span className="text-muted">{r.state}</span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${r.action === 'Confirm fulfilment' ? 'bg-primary text-white' : 'border border-line text-muted'}`}
              >
                {r.action}
              </span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Simplified preview of the real console with synthetic data.</figcaption>
    </figure>
  );
}

export function Merchants() {
  return (
    <section aria-labelledby="merchants-title" id="merchants" className="border-y border-line bg-soft py-16 sm:py-24 lg:py-28">
      <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            id="merchants-title"
            eyebrow="For merchants"
            title="You keep the redemption promise. We make it portable."
            lead="Issue store credit your customers can actually move, while you stay in control of who holds it and how it is redeemed."
          />
          <ul data-reveal className="-mt-4 space-y-3">
            {YOU_PROVIDE.map((t) => (
              <li key={t} className="flex gap-3 text-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Icon d={ICONS.check} className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/merchant" className="btn btn-primary">
              Open the merchant console
              <Icon d={ICONS.arrow} className="h-4 w-4" />
            </Link>
            <Link href="/merchant/apply" className="btn btn-ghost">
              Apply as an issuer
            </Link>
          </div>
          <p data-reveal className="mt-5 text-sm text-muted">
            New to issuing on Stellar?{' '}
            <Link href="/docs" className="font-semibold text-link underline decoration-1 underline-offset-4">
              Read the partner docs
            </Link>
          </p>
        </div>
        <div data-reveal>
          <ConsolePreview />
        </div>
      </div>
    </section>
  );
}
