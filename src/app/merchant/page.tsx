import type { Metadata } from 'next';
import Link from 'next/link';
import { Dashboard } from '@/components/Dashboard';

export const metadata: Metadata = { title: 'Merchant console' };

export default function MerchantPage() {
  return (
    <div className="container-page space-y-6 py-14">
      <h1 className="text-3xl font-bold">Merchant issuer console</h1>
      <p className="max-w-2xl text-muted">
        Skeleton. It shows your verified credit programs and the redemption queue from the Unbound API. Confirm a redemption only after you have honored
        it with the customer. New here?{' '}
        <Link href="/merchant/apply" className="font-semibold text-primary underline underline-offset-4">
          Apply as an issuer
        </Link>
        .
      </p>
      <Dashboard />
    </div>
  );
}
