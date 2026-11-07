'use client';

import { useEffect, useRef, useState } from 'react';

type NodeKey = 'issuer' | 'wallet' | 'market' | 'escrow';

/** Node centres in % of the stage (shared by the HTML nodes, the SVG links and the moving credit chip). */
const NODES: Record<NodeKey, { x: number; y: number; title: string; sub: string }> = {
  issuer: { x: 15, y: 24, title: 'Merchant issuer', sub: 'signed policy' },
  wallet: { x: 50, y: 24, title: 'Your wallet', sub: 'signs on device' },
  market: { x: 85, y: 24, title: 'Stellar DEX', sub: 'order books' },
  escrow: { x: 50, y: 78, title: 'Redemption escrow', sub: 'Soroban contract' },
};

type Link = { from: NodeKey; to: NodeKey; label: string };
const LINKS: Link[] = [
  { from: 'issuer', to: 'wallet', label: 'issue' },
  { from: 'wallet', to: 'market', label: 'path payment' },
  { from: 'wallet', to: 'escrow', label: 'return' },
  { from: 'escrow', to: 'issuer', label: 'confirm' },
];

export const FLOW_STEPS: { title: string; body: string; chip: NodeKey; chipLabel: string; active: NodeKey[]; links: number[] }[] = [
  {
    title: '1. The merchant opts in',
    body: 'A verified retailer signs a redemption policy with its Stellar issuer key: what one credit is worth, limits, expiry, refunds.',
    chip: 'issuer',
    chipLabel: 'SHOP',
    active: ['issuer'],
    links: [],
  },
  {
    title: '2. Credit lands in your wallet',
    body: 'You add a trustline, the issuer authorizes it, and the credit arrives as a native Stellar asset.',
    chip: 'wallet',
    chipLabel: 'SHOP',
    active: ['issuer', 'wallet'],
    links: [0],
  },
  {
    title: '3. Exchange at a real quote',
    body: 'A strict-send path payment through the order books, with a minimum you will receive. You sign it on your phone.',
    chip: 'market',
    chipLabel: 'USDC',
    active: ['wallet', 'market'],
    links: [1],
  },
  {
    title: '4. Or redeem: credit waits in escrow',
    body: 'Redeeming moves the credit into the Soroban redemption escrow, not straight to the merchant. Nobody can spend it while it waits.',
    chip: 'escrow',
    chipLabel: 'SHOP',
    active: ['wallet', 'escrow'],
    links: [2],
  },
  {
    title: '5. Confirm, reject, or time out',
    body: 'The merchant confirms (credit released to the issuer) or rejects (refunded to you). If the merchant never answers, you take it back after the deadline.',
    chip: 'issuer',
    chipLabel: 'SHOP',
    active: ['escrow', 'issuer', 'wallet'],
    links: [3, 2],
  },
];

const AUTOPLAY_MS = 3600;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animated, step-by-step diagram of the whole product. Plays only while visible, never with reduced motion, and can
 * always be driven by hand (buttons are real controls with an aria-live caption).
 */
export function FlowStory() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.35 });
    if (el && io) io.observe(el);
    const t = setTimeout(() => setPlaying(true), 0);
    return () => {
      clearTimeout(t);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const t = setInterval(() => setStep((s) => (s + 1) % FLOW_STEPS.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [playing, visible]);

  const cur = FLOW_STEPS[step]!;
  const chip = NODES[cur.chip];

  return (
    <div ref={ref} data-reveal className="card overflow-hidden p-4 sm:p-6">
      <div className="relative mx-auto aspect-square w-full max-w-3xl sm:aspect-[16/8]" role="img" aria-label={`Diagram, step ${step + 1} of ${FLOW_STEPS.length}: ${cur.title}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {LINKS.map((l, i) => {
            const a = NODES[l.from];
            const b = NODES[l.to];
            const on = cur.links.includes(i);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                vectorEffect="non-scaling-stroke"
                strokeWidth={on ? 2.5 : 1.5}
                strokeDasharray="6 6"
                className={on ? 'flow-dash' : ''}
                stroke={on ? 'var(--brand-primary)' : 'var(--line)'}
              />
            );
          })}
        </svg>
        {(Object.keys(NODES) as NodeKey[]).map((k) => {
          const n = NODES[k];
          const on = cur.active.includes(k);
          return (
            <div
              key={k}
              className={`absolute w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2 py-2 text-center transition-all duration-500 sm:px-3 ${
                on ? 'border-primary bg-surface shadow-card' : 'border-line bg-bg opacity-70'
              }`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <NodeIcon k={k} on={on} />
              <p className="mt-1 text-[0.7rem] font-semibold leading-tight sm:text-sm">{n.title}</p>
              <p className="hidden font-mono text-[0.65rem] text-muted sm:block">{n.sub}</p>
            </div>
          );
        })}
        <div
          aria-hidden="true"
          className="flow-chip absolute z-10 -translate-x-1/2 rounded-full bg-deep px-2.5 py-1 font-mono text-[0.7rem] font-semibold text-ondark shadow-card ring-2 ring-accent"
          style={{ left: `${chip.x}%`, top: `calc(${chip.y}% - var(--chip-lift))` }}
        >
          {cur.chipLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div aria-live="polite" className="min-h-[5.5rem]">
          <p className="text-lg font-semibold">{cur.title}</p>
          <p className="mt-1 text-sm text-muted">{cur.body}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW_STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
              aria-label={`Show step ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              className={`h-9 w-9 rounded-full border font-mono text-sm font-semibold ${i === step ? 'border-primary bg-primary text-white' : 'border-line bg-surface'}`}
            >
              {i + 1}
            </button>
          ))}
          <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost min-h-9 px-3 py-1.5 text-sm">
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NodeIcon({ k, on }: { k: NodeKey; on: boolean }) {
  const stroke = on ? 'var(--brand-primary)' : 'var(--muted)';
  const common = { fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true">
      {k === 'issuer' ? <path {...common} d="M3 9l1.5-5h15L21 9M3 9h18M5 12v8h14v-8M10 20v-5h4v5" /> : null}
      {k === 'wallet' ? <path {...common} d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" /> : null}
      {k === 'market' ? <path {...common} d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /> : null}
      {k === 'escrow' ? <path {...common} d="M5 10h14v10H5zM8 10V7a4 4 0 0 1 8 0v3M12 14v3" /> : null}
    </svg>
  );
}
