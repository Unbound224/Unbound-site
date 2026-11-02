'use client';

import { useId, useState, type FormEvent } from 'react';
import { describeError } from '@/lib/api/client';
import { useSession } from '@/lib/session';
import { SignInForm } from '@/components/SignInForm';
import { MerchantApplication, type Merchant } from '@/lib/api/schemas';

type Errors = Partial<Record<keyof MerchantApplication, string>>;

export function ApplyForm() {
  const id = useId();
  const session = useSession();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState<Merchant | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFailure(null);
    const fd = new FormData(e.currentTarget);
    const parsed = MerchantApplication.safeParse({
      legalName: fd.get('legalName'),
      jurisdiction: fd.get('jurisdiction'),
      contact: fd.get('contact'),
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof MerchantApplication] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      setDone(await session.client().apply(parsed.data));
    } catch (err) {
      setFailure(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-lg border border-line p-5">
        <h2 className="text-xl font-semibold">Application received</h2>
        <p className="mt-2">
          Reference <code>{done.id}</code>. Status: <strong>{done.status}</strong>. This is not an approval. A reviewer must verify your legal identity
          and your signed redemption policy before any credit can be listed.
        </p>
      </div>
    );
  }

  if (!session.signedIn) {
    return (
      <div className="space-y-4">
        <p className="max-w-2xl text-muted">Sign in or create an account first. Your application is attached to your account.</p>
        <SignInForm />
      </div>
    );
  }

  const field = (name: keyof MerchantApplication, label: string, hint: string) => (
    <div className="space-y-1">
      <label htmlFor={`${id}-${name}`} className="block font-medium">
        {label}
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type="text"
        autoComplete="off"
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`${id}-${name}-hint${errors[name] ? ` ${id}-${name}-err` : ''}`}
        className="w-full rounded-md border border-ink bg-surface px-3 py-2 text-ink"
      />
      <p id={`${id}-${name}-hint`} className="text-sm text-muted">
        {hint}
      </p>
      {errors[name] ? (
        <p id={`${id}-${name}-err`} className="text-sm font-medium text-danger">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-5">
      {field('legalName', 'Legal name', 'The registered name of the issuing business.')}
      {field('jurisdiction', 'Jurisdiction', 'Where the business is registered and where redemption terms apply.')}
      {field('contact', 'Redemption contact', 'An email or URL where holders and reviewers can reach you.')}
      {failure ? (
        <p role="alert" className="font-medium text-danger">
          {failure}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? 'Sending...' : 'Submit application'}
      </button>
      <p className="text-sm text-muted">Never enter a secret key, seed phrase or password here. This form does not need one.</p>
    </form>
  );
}
