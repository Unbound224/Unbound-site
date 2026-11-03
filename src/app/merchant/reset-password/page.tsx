import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/PasswordReset';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <div className="container-page space-y-6 py-14">
      <h1 className="text-3xl font-bold">Set a new password</h1>
      <p className="max-w-2xl text-muted">The link works once. Choosing a new password signs out every existing session of the account.</p>
      <ResetPasswordForm />
    </div>
  );
}
