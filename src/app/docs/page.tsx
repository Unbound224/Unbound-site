import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Partner docs' };

export default function DocsPage() {
  return (
    <article className="container-page max-w-3xl space-y-6 py-14">
      <h1 className="text-3xl font-bold">Partner onboarding</h1>
      <p className="text-muted">What a retailer must do to issue redeemable credit on the Unbound Testnet demo. Nothing here is a live offering.</p>

      <h2 className="text-2xl font-semibold">1. Be a verifiable issuer</h2>
      <p>A person reviews your legal identity. Verification needs an evidence reference; applying does not approve you. A Stellar asset alone is not proof that you will redeem it.</p>

      <h2 className="text-2xl font-semibold">2. Publish a signed redemption policy</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Legal identity and registration reference</li>
        <li>Asset code and issuer public key</li>
        <li>Unit of account, face value and redemption limits</li>
        <li>Expiry, jurisdiction, refund and cancellation policy, contact, KYC requirements</li>
        <li>An explicit statement that tokenization and transfer are permitted</li>
        <li>An ed25519 signature by the asset&apos;s issuer key over the canonical policy</li>
      </ul>
      <p className="text-sm text-muted">Sign offline. This site never asks for, receives or stores a secret key. A policy-signing helper is not built yet.</p>

      <h2 className="text-2xl font-semibold">3. Issue and authorize</h2>
      <p>Configure the issuer account to require authorization, so you approve each holder&apos;s trustline. Disclose clawback and revocation if you enable them; holders are shown these risks.</p>

      <h2 className="text-2xl font-semibold">4. Honor redemptions</h2>
      <p>
        A holder returns credit to your issuer account on the ledger. Only after the ledger confirms it can you mark the request fulfilled in the{' '}
        <Link href="/merchant" className="font-semibold text-primary underline underline-offset-4">
          merchant console
        </Link>
        . If you reject a returned redemption, a refund is owed and is flagged to the holder.
      </p>

      <h2 className="text-2xl font-semibold">What is not offered</h2>
      <p>No fiat withdrawal, no guaranteed liquidity or price, no conversion of arbitrary gift cards, and no real-money operation. Mainnet requires external review and compliance planning that has not happened.</p>
    </article>
  );
}
