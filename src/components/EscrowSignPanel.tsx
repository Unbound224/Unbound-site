'use client';

import { useId, useState, type FormEvent } from 'react';
import { describeError } from '@/lib/api/client';
import { SignedXdr, type Redemption } from '@/lib/api/schemas';
import { signWithFreighter, WalletError } from '@/lib/freighter';
import { ACTION_LABEL } from '@/lib/redemption';
import { useSession } from '@/lib/session';

/**
 * Shows the unsigned escrow transaction core built for the issuer (confirm or reject) and accepts the signed
 * envelope back. Signing happens in the merchant's own signer; this page never asks for, sees or stores a secret key.
 */
export function EscrowSignPanel({ redemption, onDone }: { redemption: Redemption; onDone: (r: Redemption) => void }) {
  const id = useId();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const e = redemption.escrow;
  if (!e?.pendingAction || !e.pendingXdr || e.pendingAction === 'EXPIRE') return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(e!.pendingXdr!);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function signInWallet() {
    setError(null);
    setBusy(true);
    try {
      const raw = await signWithFreighter(e!.pendingXdr!, redemption.asset.issuer);
      const signed = SignedXdr.parse(raw); // the wallet's answer gets the same shape check as pasted text
      onDone(await session.client().submitEscrowAction(redemption.id, signed));
    } catch (err) {
      setError(err instanceof WalletError ? err.message : describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    const raw = new FormData(ev.currentTarget).get('signed');
    const parsed = SignedXdr.safeParse(typeof raw === 'string' ? raw : '');
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Paste the signed transaction');
      return;
    }
    setBusy(true);
    try {
      onDone(await session.client().submitEscrowAction(redemption.id, parsed.data));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-t`} className="mt-3 space-y-3 rounded-lg border border-line bg-bg p-4">
      <h3 id={`${id}-t`} className="font-semibold">
        Sign to {ACTION_LABEL[e.pendingAction]}
      </h3>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Copy this unsigned Testnet transaction. It calls the redemption escrow and only your issuer key can authorize it.</li>
        <li>Sign it in your own signer (a hardware wallet, Freighter, or the Stellar Laboratory). Never paste a secret key here.</li>
        <li>Paste the signed envelope below. The redemption updates only after the ledger confirms it.</li>
      </ol>
      <label htmlFor={`${id}-u`} className="block text-sm font-medium">
        Unsigned transaction (XDR)
      </label>
      <textarea id={`${id}-u`} readOnly rows={3} value={e.pendingXdr} className="w-full break-all rounded-md border border-line bg-surface p-2 font-mono text-xs" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} className="rounded-md border border-ink px-3 py-1.5 text-sm font-semibold">
          Copy XDR
        </button>
        <span aria-live="polite" className="text-sm text-muted">
          {copied ? 'Copied.' : ''}
        </span>
        <span className="text-xs text-muted">
          Hash <code className="break-all">{e.pendingTxHash}</code>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={signInWallet} disabled={busy} className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60">
          Sign with Freighter
        </button>
        <span className="text-xs text-muted">Testnet only. The signing account must be the credit issuer. Or paste a signed envelope below.</span>
      </div>
      <label htmlFor={`${id}-s`} className="block text-sm font-medium">
        Signed transaction (XDR)
      </label>
      <textarea
        id={`${id}-s`}
        name="signed"
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        className="w-full rounded-md border border-ink bg-surface p-2 font-mono text-xs text-ink"
      />
      {error ? (
        <p id={`${id}-e`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60">
        {busy ? 'Submitting...' : 'Submit signed transaction'}
      </button>
    </form>
  );
}
