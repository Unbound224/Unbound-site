import type { CSSProperties } from 'react';

/**
 * Animated, purely illustrative hero: a store credit flows through a Stellar path payment into another asset,
 * and the settlement state advances only after "confirmed on ledger". Every value is synthetic and labelled so.
 */
function Flow({ label }: { label: string }) {
  return (
    <div className="relative flex h-20 items-center justify-center" aria-hidden="true">
      <svg className="absolute inset-y-0 left-1/2 h-full w-6 -translate-x-1/2 overflow-visible" viewBox="0 0 24 80" preserveAspectRatio="none">
        <line x1="12" y1="0" x2="12" y2="80" stroke="var(--line)" strokeWidth="2" />
        <line x1="12" y1="0" x2="12" y2="80" stroke="var(--brand-primary)" strokeWidth="2" strokeDasharray="4 8" className="flow-dash" />
      </svg>
      {[0, 0.8, 1.6].map((delay) => (
        <span
          key={delay}
          className="flow-dot absolute left-1/2 top-0 -ml-[5px] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--brand-primary)]"
          style={{ animationDelay: `${delay}s`, '--flow-distance': '74px' } as CSSProperties}
        />
      ))}
      <span className="relative z-10 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[0.7rem] font-medium text-muted shadow-card">{label}</span>
    </div>
  );
}

export function HeroVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-[26rem]">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
      <div aria-hidden="true" className="float-slow">
        {/* 1. The credit the holder actually has */}
        <div className="relative overflow-hidden credit-card rounded-3xl p-5 text-ondark shadow-card ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative inline brand mark */}
          <img src="/brand/mark.svg" alt="" className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 opacity-[0.12]" />
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-accent">You hold</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-medium">Redeemable</span>
          </div>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-medium tracking-tight">50.00</span>
            <span className="text-lg font-semibold text-accent">SHOP</span>
          </p>
          <p className="mt-1 text-sm text-white/75">Store credit · issued by Example Outfitters</p>
          <div className="mt-4 flex flex-wrap gap-1.5 text-[0.7rem]">
            <span className="rounded-md bg-white/10 px-2 py-1">Signed redemption policy</span>
            <span className="rounded-md bg-white/10 px-2 py-1">Transfer permitted</span>
            <span className="rounded-md bg-white/10 px-2 py-1">Auth required</span>
          </div>
        </div>

        <Flow label="Stellar path payment · strict-send" />

        {/* 2. The quote: real route or nothing */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-link">You receive at least</p>
            <span className="font-mono text-[0.7rem] text-muted">SHOP → XLM</span>
          </div>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-medium tracking-tight">412.30</span>
            <span className="text-base font-semibold text-muted">XLM</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted">Slippage cap</dt>
            <dd className="text-right font-mono">1.0%</dd>
            <dt className="text-muted">Network fee</dt>
            <dd className="text-right font-mono">0.00001 XLM</dd>
            <dt className="text-muted">Quote expires</dt>
            <dd className="text-right font-mono">30 s</dd>
          </dl>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-soft">
            <div className="expiry-bar h-full rounded-full bg-primary" />
          </div>

          {/* 3. Honest settlement states */}
          <ol className="mt-5 grid grid-cols-3 gap-2 text-[0.68rem] font-medium text-muted">
            {['Signed on device', 'Submitted', 'Confirmed on ledger'].map((s, i) => (
              <li key={s} className="flex flex-col gap-1.5">
                <span className="state-step block h-1.5 rounded-full" style={{ '--step-delay': `${i * 1.6}s` } as CSSProperties} />
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted">Illustration with synthetic Testnet assets. Real quotes depend on live liquidity.</figcaption>
    </figure>
  );
}
