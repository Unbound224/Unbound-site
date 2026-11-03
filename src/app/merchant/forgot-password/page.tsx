import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/PasswordReset';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page space-y-6 py-14">
      <h1 className="text-3xl font-bold">Forgot your password?</h1>
      <p className="max-w-2xl text-muted">Enter the email of your merchant or reviewer account. We will email a single-use link that expires after 30 minutes.</p>
      <ForgotPasswordForm />
    </div>
  );
}
