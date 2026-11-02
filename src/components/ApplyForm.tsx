'use client';

import { useId, useState, type FormEvent } from 'react';
import { apiBaseUrl, createClient, describeError } from '@/lib/api/client';
import { MerchantApplication, type Merchant } from '@/lib/api/schemas';

type Errors = Partial<Record<keyof MerchantApplication, string>>;

export function ApplyForm({ client }: { client?: ReturnType<typeof createClient> } = {}) {
  const id = useId();
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
      const token = String(fd.get('token') ?? '').trim();
      setDone(await (client ?? createClient({ baseUrl: apiBaseUrl(), ...(token ? { token } : {}) })).apply(parsed.data));
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
        className="w-full rounded-md border border-ink px-3 py-2"
      />
      <p id={`${id}-${name}-hint`} className="text-sm text-muted">
        {hint}
      </p>
      {errors[name] ? (
        <p id={`${id}-${name}-err`} className="text-sm font-medium text-red-800">
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
      <details className="rounded-md border border-line p-3">
        <summary className="cursor-pointer font-medium">Developer session (Testnet only)</summary>
        <p className="mt-2 text-sm text-muted">
          Merchant sign-in is not built yet, so the API currently needs a session token. Paste a Testnet/dev token here; it is kept only in this form.
        </p>
        <label htmlFor={`${id}-token`} className="mt-2 block font-medium">
          Session token
        </label>
        <input id={`${id}-token`} name="token" type="password" autoComplete="off" className="w-full rounded-md border border-ink px-3 py-2" />
      </details>
      {failure ? (
        <p role="alert" className="font-medium text-red-800">
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
