import type { Metadata } from 'next';
import { ApplyForm } from '@/components/ApplyForm';

export const metadata: Metadata = { title: 'Apply as an issuer' };

export default function ApplyPage() {
  return (
    <div className="container-page space-y-6 py-14">
      <h1 className="text-3xl font-bold">Apply as a merchant issuer</h1>
      <p className="max-w-2xl text-muted">
        Applications are reviewed by a person. Testnet only: you will be asked to publish a signed redemption policy and issue a synthetic sample credit.
      </p>
      <ApplyForm />
    </div>
  );
}
