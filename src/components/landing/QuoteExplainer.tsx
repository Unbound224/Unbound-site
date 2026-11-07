'use client';

import { useId, useState } from 'react';
import { SectionHeading } from '@/components/landing/Section';
import { UNIT, explainQuote, formatUnits } from '@/lib/quote-math';

/** Illustrative only: 10 SHOP buys 9 USDC. Real rates come from the Stellar order books. */
const RATE = { n: 9n, d: 10n };
const SLIPPAGE = [50, 100, 200, 500, 1000] as const;

export function QuoteExplainer() {
  const id = useId();
  const [amount, setAmount] = useState(80);
  const [bps, setBps] = useState<number>(100);
  const q = explainQuote(BigInt(amount) * UNIT, RATE, bps);
  const minPct = Number((q.minUnits * 1000n) / q.expectedUnits) / 10;

  return (
    <section aria-labelledby="quote-title" id="quotes" className="bg-soft py-16 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          id="quote-title"
          eyebrow="Reading a quote"
          title="What “minimum received” protects you from"
          lead="Prices on an order book can move between the quote and the moment your transaction lands. You choose how much movement you accept; the ledger refuses anything worse, so the trade either meets your floor or nothing moves."
        />
        <div data-reveal className="card grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()} aria-describedby={`${id}-note`}>
            <div className="space-y-2">
              <label htmlFor={`${id}-amt`} className="flex items-baseline justify-between font-semibold">
                <span>You send</span>
                <output htmlFor={`${id}-amt`} className="font-mono text-lg">
                  {amount} SHOP
                </output>
              </label>
              <input
                id={`${id}-amt`}
                type="range"
                min={1}
                max={500}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-[var(--brand-primary)]"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="font-semibold">Slippage cap</legend>
              <div className="flex flex-wrap gap-2">
                {SLIPPAGE.map((s) => (
                  <label key={s} className={`cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-sm ${bps === s ? 'border-primary bg-primary text-white' : 'border-line bg-surface'}`}>
                    <input type="radio" name="slippage" value={s} checked={bps === s} onChange={() => setBps(s)} className="sr-only" />
                    {s / 100}%
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted">Unbound refuses caps above 10%.</p>
            </fieldset>
            <p id={`${id}-note`} className="text-xs text-muted">
              Illustrative rate (10 SHOP = 9 USDC) with synthetic Testnet assets. A real quote comes from the Stellar order books, expires after a short time, and may not exist at all.
            </p>
          </form>

          <div className="space-y-5" aria-live="polite">
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-bg p-4">
                <dt className="text-sm text-muted">Expected</dt>
                <dd className="font-mono text-2xl font-bold" data-testid="expected">
                  {formatUnits(q.expectedUnits)} <span className="text-base font-medium">USDC</span>
                </dd>
              </div>
              <div className="rounded-xl border border-primary bg-bg p-4">
                <dt className="text-sm text-muted">Minimum received</dt>
                <dd className="font-mono text-2xl font-bold text-link" data-testid="minimum">
                  {formatUnits(q.minUnits)} <span className="text-base font-medium">USDC</span>
                </dd>
              </div>
            </dl>
            <div aria-hidden="true" className="space-y-2">
              <div className="flex h-9 overflow-hidden rounded-lg border border-line">
                <div className="flex items-center bg-primary px-2 font-mono text-xs text-white transition-[width] duration-500" style={{ width: `${minPct}%` }}>
                  guaranteed floor
                </div>
                <div className="quote-buffer flex flex-1 items-center justify-center font-mono text-xs text-muted">buffer</div>
              </div>
              <div className="flex justify-between font-mono text-[0.7rem] text-muted">
                <span>0</span>
                <span>expected {formatUnits(q.expectedUnits)}</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-semibold">Market moves less than {bps / 100}%:</span> <span className="text-muted">the trade settles and you receive at least {formatUnits(q.minUnits)} USDC; the receipt shows the exact ledger amount.</span>
              </li>
              <li>
                <span className="font-semibold">Market moves more:</span> <span className="text-muted">the path payment fails on the ledger, nothing moves, and you are asked to approve a fresh quote.</span>
              </li>
              <li>
                <span className="font-semibold">Quote expires before you sign:</span> <span className="text-muted">the app refuses to sign it.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
