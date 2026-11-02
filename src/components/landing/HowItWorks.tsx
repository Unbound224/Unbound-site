import { ICONS, Icon, SectionHeading, delay } from '@/components/landing/Section';

export const STEPS = [
  {
    key: 'issuer',
    label: 'Issuer',
    title: 'A real retailer opts in',
    body: 'The merchant is verified by a person and signs a redemption policy with its Stellar issuer key: face value, limits, expiry, jurisdiction, refunds. No issuer means no usable credit.',
    icon: ICONS.store,
  },
  {
    key: 'credit',
    label: 'Credit',
    title: 'Credit is issued on Stellar',
    body: 'The store credit is a native Stellar asset with authorization required. You add a trustline, the issuer authorizes it, and the credit lands in your wallet.',
    icon: ICONS.coin,
  },
  {
    key: 'exchange',
    label: 'Exchange',
    title: 'Exchange at a real quote',
    body: 'Unbound asks the Stellar order books for a strict-send path. You see the minimum you receive, fees, slippage cap and expiry, then sign on your device. No route, no quote.',
    icon: ICONS.swap,
  },
  {
    key: 'redemption',
    label: 'Redemption',
    title: 'Or redeem with the issuer',
    body: 'Return the credit to the issuer on the ledger. The merchant can only mark the redemption fulfilled after that return is confirmed, and a rejection flags a refund.',
    icon: ICONS.receipt,
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" id="how-it-works" className="py-16 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From a merchant's promise to value you can move"
          lead="Four steps, each enforced in code and on the ledger. The issuer stays responsible for redemption the whole way through."
        />
        <div className="relative">
        <div aria-hidden="true" className="absolute left-0 right-0 top-[2.9rem] hidden h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent lg:block" />
        <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.key} data-reveal style={delay(i * 90)} className="card card-hover relative p-6">
              <div className="flex items-center justify-between">
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                  <Icon d={s.icon} />
                </span>
                <span className="font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, '0')} · {s.label}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
