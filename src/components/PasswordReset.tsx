'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { describeError } from '@/lib/api/client';
import { NewPassword, ResetEmail } from '@/lib/api/schemas';
import { useSession } from '@/lib/session';

/** Step 1: ask core to email a reset link. The answer is the same whether or not the account exists. */
export function ForgotPasswordForm() {
  const id = useId();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const p = ResetEmail.safeParse({ email: new FormData(e.currentTarget).get('email') });
    if (!p.success) return setError(p.error.issues[0]?.message ?? 'Enter your email');
    setError(null);
    setBusy(true);
    try {
      await session.client().requestPasswordReset(p.data.email);
      setSent(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p role="status" className="max-w-xl rounded-md border border-line p-4">
        If an account exists for that email, a reset link is on its way. It works once and expires after 30 minutes.
      </p>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="max-w-xl space-y-4" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="text-2xl font-semibold">
        Reset your password
      </h2>
      <div className="space-y-1">
        <label htmlFor={`${id}-e`} className="block font-medium">
          Email
        </label>
        <input id={`${id}-e`} name="email" type="email" autoComplete="email" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className="w-full rounded-md border border-ink bg-surface px-3 py-2 text-ink" />
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="font-medium text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? 'Please wait...' : 'Email me a reset link'}
      </button>
    </form>
  );
}

/** Step 2: choose a new password with the token from the emailed link (read from ?token=). */
export function ResetPasswordForm({ initialToken }: { initialToken?: string }) {
  const id = useId();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get('password') ?? '');
    if (pw !== String(fd.get('confirm') ?? '')) return setError('The two passwords do not match.');
    // read at submit time (not during render) so the static page hydrates identically
    const token = initialToken ?? new URLSearchParams(window.location.search).get('token') ?? '';
    const p = NewPassword.safeParse({ token, password: pw });
    if (!p.success) return setError(p.error.issues[0]?.message ?? 'Check the form');
    setError(null);
    setBusy(true);
    try {
      await session.client().confirmPasswordReset(p.data.token, p.data.password);
      setDone(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="max-w-xl space-y-2 rounded-md border border-line p-4">
        <p>Password changed. Every existing session for this account was signed out.</p>
        <Link href="/merchant" className="font-semibold text-primary underline underline-offset-4">
          Sign in to the console
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="max-w-xl space-y-4" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="text-2xl font-semibold">
        Choose a new password
      </h2>
      <p className="text-sm text-muted">Open this page from the link in your reset email.</p>
      {(['password', 'confirm'] as const).map((n) => (
        <div key={n} className="space-y-1">
          <label htmlFor={`${id}-${n}`} className="block font-medium">
            {n === 'password' ? 'New password' : 'Repeat new password'}
          </label>
          <input id={`${id}-${n}`} name={n} type="password" autoComplete="new-password" className="w-full rounded-md border border-ink bg-surface px-3 py-2 text-ink" />
        </div>
      ))}
      <p className="text-sm text-muted">At least 12 characters.</p>
      {error ? (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? 'Please wait...' : 'Set new password'}
      </button>
    </form>
  );
}
