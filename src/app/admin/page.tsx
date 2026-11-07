import type { Metadata } from 'next';
import { AdminConsole } from '@/components/AdminConsole';

export const metadata: Metadata = { title: 'Reviewer console', robots: { index: false } };

export default function AdminPage() {
  return (
    <div className="container-page space-y-6 py-14">
      <h1 className="text-3xl font-bold">Reviewer console</h1>
      <p className="max-w-2xl text-muted">
        For Unbound reviewers: verify issuers against your own evidence, rule on disputes and check the maintenance jobs. Rulings record decisions; they never move funds.
      </p>
      <AdminConsole />
    </div>
  );
}
