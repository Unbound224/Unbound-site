
const STATIONS = [
  { name: 'Your phone', repo: 'Unbound-mobile', does: 'Decodes every transaction locally and signs with a key that never leaves the device.' },
  { name: 'Unbound API', repo: 'Unbound-core', does: 'Checks issuer verification, signed policy, limits and idempotency; keeps an audit trail.' },
  { name: 'Stellar gateway', repo: 'Unbound-stellar', does: 'Finds strict-send paths, builds unsigned transactions and Soroban escrow calls, submits them.' },
  { name: 'Stellar Testnet', repo: 'the ledger', does: 'Trustlines, order-book path payments and the redemption escrow contract decide what really happened.' },
] as const;

const HOPS = [
  { forward: 'quote, intent', back: 'unsigned XDR' },
  { forward: 'build, submit', back: 'outcome' },
  { forward: 'signed tx', back: 'ledger events' },
] as const;

/** The data path, animated: requests flow right, ledger truth flows back. Static with reduced motion. */
export function UnderTheHood() {
  return (
    <section aria-labelledby="hood-title" id="under-the-hood" className="border-y border-white/10 bg-deep py-16 text-ondark sm:py-24 lg:py-28">
      <div className="container-page">
        <div data-reveal className="mb-10 max-w-2xl space-y-4 sm:mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">Under the hood</p>
          <h2 id="hood-title" className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Nothing counts until the ledger says so
          </h2>
          <p className="text-lg text-pretty opacity-85">
            Every action is an unsigned transaction you inspect and sign, sent to Stellar, and then reconciled by hash. A timeout is “still checking”, never “failed”, and never a fake success.
          </p>
        </div>
        <ol className="grid gap-0 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
          {STATIONS.map((s, i) => (
            <li key={s.name} className="contents">
              <div data-reveal className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')} · {s.repo}</p>
                <h3 className="mt-2 text-lg font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm opacity-80">{s.does}</p>
                {i === 3 ? (
                  <p className="mt-3 inline-flex rounded-full bg-primary px-2.5 py-0.5 font-mono text-[0.7rem] text-white">Soroban: redemption escrow only</p>
                ) : null}
              </div>
              {i < HOPS.length ? <Hop forward={HOPS[i]!.forward} back={HOPS[i]!.back} /> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Hop({ forward, back }: { forward: string; back: string }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center py-3 lg:w-28 lg:py-0">
      {/* vertical on phones, horizontal from lg */}
      <div className="relative h-16 w-px bg-white/25 lg:h-px lg:w-full">
        <span className="pipe-dot pipe-y absolute -left-1 top-0 h-2 w-2 rounded-full bg-accent lg:hidden" />
        <span className="pipe-dot absolute -top-1 left-0 hidden h-2 w-2 rounded-full bg-accent lg:block" style={{ ['--pipe-distance' as string]: '6.5rem' }} />
        <span className="pipe-dot absolute -top-1 right-0 hidden h-2 w-2 rounded-full bg-white lg:block" style={{ ['--pipe-distance' as string]: '-6.5rem', ['--pipe-delay' as string]: '1.4s' }} />
        <span className="absolute left-3 top-1 whitespace-nowrap font-mono text-[0.65rem] text-accent lg:-top-5 lg:left-1/2 lg:-translate-x-1/2">{forward} →</span>
        <span className="absolute left-3 bottom-1 whitespace-nowrap font-mono text-[0.65rem] opacity-70 lg:-bottom-5 lg:top-auto lg:left-1/2 lg:-translate-x-1/2">← {back}</span>
      </div>
    </div>
  );
}
