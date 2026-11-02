import { ICONS, Icon, SectionHeading, delay } from '@/components/landing/Section';
import { ORG_URL, REPOS } from '@/lib/site-config';

const STATUS = [
  { area: 'Issuer verification, signed policies, exchange-intent state machine, reconciliation', state: 'Built, tested offline' },
  { area: 'Stellar quotes, transaction builders, gateway service and chain worker', state: 'Built, tested on a local simulator' },
  { area: 'Flutter app with on-device XDR inspection and signing', state: 'Built, widget-tested; not yet run on devices' },
  { area: 'Landing site and merchant console', state: 'Built, tested against a real core process' },
  { area: 'Live Stellar Testnet run, app store listings, external security audit, Mainnet', state: 'Not yet' },
] as const;

function Diagram() {
  return (
    <figure data-reveal className="card flex flex-col justify-center gap-4 p-5 sm:p-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full" role="img" aria-labelledby="arch-title">
        <title id="arch-title">Mobile app and site call unbound-core; core calls unbound-stellar, which talks to the Stellar network and reports settlement back to core.</title>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="var(--brand-accent)" />
          </marker>
        </defs>
        <g fontFamily="var(--font-mono)" fontSize="13" fill="var(--ink)">
          <rect x="10" y="20" width="150" height="56" rx="12" fill="var(--bg-soft)" stroke="var(--line)" />
          <text x="85" y="46" textAnchor="middle" fontWeight="600">Unbound-mobile</text>
          <text x="85" y="64" textAnchor="middle" fontSize="11" fill="var(--muted)">Flutter wallet</text>

          <rect x="360" y="20" width="150" height="56" rx="12" fill="var(--bg-soft)" stroke="var(--line)" />
          <text x="435" y="46" textAnchor="middle" fontWeight="600">Unbound-site</text>
          <text x="435" y="64" textAnchor="middle" fontSize="11" fill="var(--muted)">Next.js console</text>

          <rect x="185" y="102" width="150" height="56" rx="12" fill="var(--brand-primary)" />
          <text x="260" y="128" textAnchor="middle" fontWeight="600" fill="#fff">Unbound-core</text>
          <text x="260" y="146" textAnchor="middle" fontSize="11" fill="#efe8ff">HTTP API v1</text>

          <rect x="185" y="190" width="150" height="56" rx="12" fill="var(--bg-soft)" stroke="var(--line)" />
          <text x="260" y="216" textAnchor="middle" fontWeight="600">Unbound-stellar</text>
          <text x="260" y="234" textAnchor="middle" fontSize="11" fill="var(--muted)">SDK · gateway · worker</text>

          <rect x="390" y="190" width="120" height="56" rx="12" fill="var(--brand-deep)" />
          <text x="450" y="216" textAnchor="middle" fontWeight="600" fill="#fbfaf8">Stellar</text>
          <text x="450" y="234" textAnchor="middle" fontSize="11" fill="#ad8aff">Testnet</text>
        </g>
        <g stroke="var(--brand-accent)" strokeWidth="2" fill="none" markerEnd="url(#arr)">
          <path d="M120 78 C120 110, 150 128, 182 128" className="flow-dash" strokeDasharray="5 6" />
          <path d="M400 78 C400 110, 370 128, 338 128" className="flow-dash" strokeDasharray="5 6" />
          <path d="M260 160 L260 186" />
          <path d="M338 218 L386 218" className="flow-dash" strokeDasharray="5 6" />
        </g>
      </svg>
      <figcaption className="text-center text-xs text-muted">Clients never build Stellar transactions; core never reimplements ledger logic.</figcaption>
    </figure>
  );
}

export function OpenSource() {
  return (
    <section aria-labelledby="oss-title" id="open-source" className="py-16 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          id="oss-title"
          eyebrow="Architecture · open source"
          title="Four repositories, one honest system"
          lead={
            <>
              Each repository owns one boundary, ships its own tests and CI, and states plainly what is built and what is not. All MIT licensed under{' '}
              <a href={ORG_URL} className="font-semibold text-link underline decoration-1 underline-offset-4">
                github.com/Unbound224
              </a>
              .
            </>
          }
        />
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <Diagram />
          <ul className="grid gap-4 sm:grid-cols-2">
            {REPOS.map((r, i) => (
              <li key={r.name} data-reveal style={delay(i * 70)}>
                <a href={r.url} className="card card-hover group flex h-full flex-col p-5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon d={ICONS.github} className="h-4 w-4" />
                      {r.name}
                    </span>
                    <Icon d={ICONS.arrow} className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-link" />
                  </span>
                  <span className="mt-1 text-xs font-medium text-link">{r.role}</span>
                  <span className="mt-3 text-sm text-muted">{r.owns}</span>
                  <span className="mt-auto pt-4 font-mono text-[0.7rem] text-muted">{r.stack}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal className="mt-12">
          <h3 id="status-title" className="mb-4 text-xl font-semibold">
            Where things stand
          </h3>
          <div className="card overflow-hidden">
            <table aria-labelledby="status-title" className="w-full text-left text-sm">
              <thead className="hidden border-b border-line bg-soft text-xs uppercase tracking-wide text-muted sm:table-header-group">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Area
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {STATUS.map((s) => (
                  <tr key={s.area} className="flex flex-col gap-1 border-b border-line px-5 py-4 last:border-0 sm:table-row sm:p-0">
                    <td className="sm:px-5 sm:py-3">{s.area}</td>
                    <td className={`font-medium sm:px-5 sm:py-3 sm:whitespace-nowrap ${s.state === 'Not yet' ? 'text-muted' : 'text-ok'}`}>{s.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
