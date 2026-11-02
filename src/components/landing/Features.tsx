import { ICONS, Icon, SectionHeading, delay } from '@/components/landing/Section';

const FEATURES = [
  {
    title: 'Real quotes or none',
    body: 'Quotes come from actual Stellar order-book paths, carry a minimum-output floor and expire. Thin or missing liquidity means no quote, never a made-up price.',
    icon: ICONS.chart,
  },
  {
    title: 'Signed on your device',
    body: 'The app decodes the unsigned transaction locally and checks it against the quote before your key, held in the OS keystore, signs anything.',
    icon: ICONS.key,
  },
  {
    title: 'Ledger-truthful status',
    body: 'Submitted, reconciling, confirmed or failed. Nothing is shown as settled until the Stellar ledger says so.',
    icon: ICONS.clock,
  },
  {
    title: 'Signed redemption policies',
    body: 'Every credit program carries an ed25519-signed policy from the issuer key, with an explicit statement that tokenization and transfer are permitted.',
    icon: ICONS.doc,
  },
  {
    title: 'Idempotent and recoverable',
    body: 'Idempotency keys, write-ahead submission and reconciliation by transaction hash. A lost response never turns into a double payment.',
    icon: ICONS.repeat,
  },
  {
    title: 'Open and auditable',
    body: 'Four MIT-licensed repositories with versioned contracts, shared fixtures and an audit trail of who did what, when.',
    icon: ICONS.code,
  },
] as const;

export function Features() {
  return (
    <section aria-labelledby="features-title" id="features" className="border-y border-line bg-soft py-16 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          id="features-title"
          eyebrow="Built for financial truth"
          title="Designed so the screen never lies about money"
          lead="Motion and polish never get ahead of the ledger. These are the guarantees the code is built and tested around."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <li key={f.title} data-reveal style={delay((i % 3) * 80)} className="card card-hover group p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-soft text-link transition-colors group-hover:border-accent">
                <Icon d={f.icon} />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
