import { Icon, SectionHeading } from '@/components/landing/Section';

export const FAQ = [
  {
    q: 'Can I exchange any gift card or loyalty points?',
    a: 'No. Only store credit that a verified retailer has issued on Stellar, with a signed redemption policy that explicitly permits tokenization and transfer. Without an issuer there is nothing to redeem.',
  },
  {
    q: 'Is there real money involved?',
    a: 'Not today. Unbound runs on Stellar Testnet with synthetic assets. There is no cash-out, no bank withdrawal and no Mainnet deployment.',
  },
  {
    q: 'Will I always be able to exchange my credit?',
    a: 'No. Exchanges use real Stellar order-book liquidity. If there is no route, or the price moves beyond your slippage cap before settlement, the exchange fails safely and nothing is spent. Quotes expire.',
  },
  {
    q: 'Who holds my keys?',
    a: 'You do. The mobile app keeps your key in the device keystore and signs only after you approve a transaction that matches the quote. Neither this site nor the backend ever receives a secret key.',
  },
  {
    q: 'What happens if a transaction’s outcome is unknown?',
    a: 'It is marked as reconciling, never as failed or settled. Unbound looks it up by transaction hash and never re-signs with different parameters, so a lost response cannot become a double payment.',
  },
  {
    q: 'How does a merchant join?',
    a: 'Apply through the merchant console. A person reviews your identity; applying does not approve you. You then sign a redemption policy offline with your issuer key and configure authorization on your issuer account.',
  },
  {
    q: 'Where can I get the app?',
    a: 'It is not in the App Store or Google Play. An Android beta APK for Testnet is published on GitHub Releases; iOS is coming later.',
  },
  {
    q: 'Can I contribute?',
    a: 'Yes. All four repositories are MIT licensed. Each has a CONTRIBUTING guide and a list of scoped contributor issues tied to real acceptance tests.',
  },
] as const;

export function Faq() {
  return (
    <section aria-labelledby="faq-title" id="faq" className="border-t border-line bg-soft py-16 sm:py-24 lg:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading id="faq-title" eyebrow="FAQ" title="Straight answers" lead="If something here sounds too good to be true, it is not something Unbound claims." />
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} data-reveal className="faq card group p-0">
              <summary className="flex items-center justify-between gap-4 rounded-[1.25rem] px-5 py-4 font-semibold">
                {f.q}
                <span className="chev inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-link">
                  <Icon d="M12 5v14M5 12h14" className="h-3.5 w-3.5" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
