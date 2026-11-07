'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { ApiClientError, describeError } from '@/lib/api/client';
import { Credentials, LoginCredentials } from '@/lib/api/schemas';
import { useSession } from '@/lib/session';

/** Email + password sign-in / registration against unbound-core. Registration grants no authority until an admin verifies the merchant. */
export function SignInForm({ allowRegister = true, title }: { allowRegister?: boolean; title?: string } = {}) {
  const id = useId();
  const session = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // an admin account with MFA enabled answers the first login with MFA_REQUIRED; then the code field appears
  const [needCode, setNeedCode] = useState(false);


  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFailure(null);
    const fd = new FormData(e.currentTarget);
    const parsed = Credentials.safeParse({ email: fd.get('email'), password: fd.get('password') });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const i of parsed.error.issues) next[i.path[0] as 'email' | 'password'] ??= i.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const client = session.client();
      if (mode === 'register') await client.register(parsed.data);
      const code = String(fd.get('code') ?? '').trim();
      const res = await client.login(LoginCredentials.parse({ ...parsed.data, ...(code ? { code } : {}) }));
      session.setToken(res.token, res.role);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'MFA_REQUIRED') setNeedCode(true);
      setFailure(err instanceof ApiClientError && err.code === 'INVALID_STATE' ? 'An account with this email already exists.' : describeError(err));
    } finally {
      setBusy(false);
    }
  }

  const field = (name: 'email' | 'password', label: string, type: string, hint: string, autoComplete: string) => (
    <div className="space-y-1">
      <label htmlFor={`${id}-${name}`} className="block font-medium">
        {label}
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
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
    <form onSubmit={onSubmit} noValidate aria-labelledby={`${id}-title`} className="max-w-xl space-y-5">
      <h2 id={`${id}-title`} className="text-2xl font-semibold">
        {mode === 'login' ? (title ?? 'Sign in') : 'Create a merchant account'}
      </h2>
      {field('email', 'Email', 'email', 'The email you registered with.', mode === 'login' ? 'username' : 'email')}
      {field('password', 'Password', 'password', 'At least 12 characters.', mode === 'login' ? 'current-password' : 'new-password')}
      {needCode && mode === 'login' ? (
        <div className="space-y-1">
          <label htmlFor={`${id}-code`} className="block font-medium">
            One-time code
          </label>
          <input id={`${id}-code`} name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className="w-full rounded-md border border-ink bg-surface px-3 py-2 text-ink" />
          <p className="text-sm text-muted">The 6 digit code from your authenticator app.</p>
        </div>
      ) : null}
      {failure ? (
        <p role="alert" className="font-medium text-danger">
          {failure}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
          {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account and sign in'}
        </button>
        {allowRegister ? (
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setFailure(null); setErrors({}); }} className="font-semibold text-primary underline underline-offset-4">
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>
        ) : null}
        {mode === 'login' ? (
          <Link href="/merchant/forgot-password" className="text-sm font-semibold text-primary underline underline-offset-4">
            Forgot your password?
          </Link>
        ) : null}
      </div>
      {mode === 'register' ? <p className="text-sm text-muted">A new account has no authority until a reviewer verifies your business.</p> : null}
    </form>
  );
}
