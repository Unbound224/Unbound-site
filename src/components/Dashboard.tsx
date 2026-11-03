'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { describeError } from '@/lib/api/client';
import { useSession } from '@/lib/session';
import { SignInForm } from '@/components/SignInForm';
import { EscrowSignPanel } from '@/components/EscrowSignPanel';
import { DisputeThread } from '@/components/DisputeThread';
import type { Asset, Dispute, Redemption } from '@/lib/api/schemas';
import { ESCROW_LABEL, STATE_LABEL, merchantActions, timeLeft } from '@/lib/redemption';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; assets: Asset[]; redemptions: Redemption[]; disputes: Dispute[] };

export function Dashboard() {
  const session = useSession();
  // Keyed by sign-in so a new session always starts from a clean console.
  return session.signedIn ? <Console key="console" /> : <SignInForm />;
}

export async function signOut(session: ReturnType<typeof useSession>) {
  try {
    await session.client().logout();
  } catch {
    // the token is dropped locally regardless
  }
  session.setToken(null);
}

function Console() {
  const session = useSession();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  async function fetchAll(): Promise<Load> {
    try {
      const c = session.client();
      const [assets, redemptions, disputes] = await Promise.all([c.listAssets(), c.listRedemptions(), c.listDisputes().catch(() => [] as Dispute[])]);
      return { status: 'ready', assets, redemptions, disputes };
    } catch (e) {
      return { status: 'error', message: describeError(e) };
    }
  }

  useEffect(() => {
    let live = true;
    void fetchAll().then((r) => {
      if (live) setLoad(r);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoad({ status: 'loading' });
    setLoad(await fetchAll());
  }

  function replace(r: Redemption) {
    setLoad((l) => (l.status === 'ready' ? { ...l, redemptions: l.redemptions.map((x) => (x.id === r.id ? r : x)) } : l));
  }

  async function confirm(id: string) {
    setBusy(id);
    setNotice(null);
    try {
      const r = await session.client().confirmRedemption(id);
      if (r.state === 'FULFILLED') {
        setNotice('Redemption confirmed as fulfilled.');
        await refresh();
      } else {
        replace(r);
        setNotice('The credit is held in escrow. Sign the release transaction below with your issuer key to complete the confirmation.');
      }
    } catch (e) {
      setNotice(describeError(e));
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string, reason: string) {
    setBusy(id);
    setNotice(null);
    try {
      const r = await session.client().rejectRedemption(id, reason);
      setRejecting(null);
      if (r.state === 'REJECTED') {
        setNotice(r.refundDue ? 'Rejected. A refund is owed to the holder under your redemption policy.' : 'Rejected and refunded.');
        await refresh();
      } else {
        replace(r);
        setNotice('Sign the refund transaction below with your issuer key. The escrow returns the credit to the customer.');
      }
    } catch (e) {
      setNotice(describeError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">Signed in. Your session lives only in this page&apos;s memory and is never saved.</p>
        <div className="flex gap-3">
          <button type="button" onClick={refresh} className="rounded-md border border-line px-4 py-2 font-semibold">
            Refresh
          </button>
          <button type="button" onClick={() => signOut(session)} className="rounded-md border border-ink px-4 py-2 font-semibold">
            Sign out
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {notice ? <p className="rounded-md border border-line p-3">{notice}</p> : null}
        {load.status === 'loading' ? <p>Loading from the Unbound API...</p> : null}
        {load.status === 'error' ? (
          <p role="alert" className="font-medium text-danger">
            {load.message}
          </p>
        ) : null}
      </div>

      {load.status === 'ready' ? (
        <>
          <section aria-labelledby="programs">
            <h2 id="programs" className="mb-3 text-2xl font-semibold">
              Your credit programs
            </h2>
            {load.assets.length === 0 ? (
              <p className="text-muted">No eligible credit programs yet. Programs appear only after verification and a valid signed redemption policy.</p>
            ) : (
              <ul className="space-y-3">
                {load.assets.map((a) => (
                  <li key={a.id} className="rounded-lg border border-line p-4">
                    <p className="font-semibold">
                      {a.assetCode} <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-white">{a.status}</span>
                    </p>
                    <p className="break-all text-sm text-muted">Issuer {a.issuer}</p>
                    <p className="text-sm">{a.policy.unitOfAccount}</p>
                    <p className="text-sm text-muted">
                      Policy expires {a.policy.expiresAt}; jurisdiction {a.policy.jurisdiction}.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="redemptions">
            <h2 id="redemptions" className="mb-1 text-2xl font-semibold">
              Redemption queue
            </h2>
            <p className="mb-3 text-sm text-muted">
              Escrowed returns stay in the redemption escrow until you confirm (credit released to you) or reject (refunded to the customer). If you do
              not answer by the deadline, the customer can take a refund.
            </p>
            {load.redemptions.length === 0 ? (
              <p className="text-muted">No redemption requests.</p>
            ) : (
              <ul className="space-y-3">
                {load.redemptions.map((r) => {
                  const act = merchantActions(r);
                  return (
                    <li key={r.id} className="rounded-lg border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {r.amount} {r.asset.code}{' '}
                            <span className="ml-1 rounded border border-line px-1.5 py-0.5 text-xs font-medium">{r.mode === 'ESCROW' ? 'Escrow' : 'Direct return'}</span>
                          </p>
                          <p className="text-sm">
                            <code className="text-xs">{r.id}</code> · {STATE_LABEL[r.state]}
                          </p>
                          {r.escrow ? (
                            <p className="text-sm text-muted">
                              {ESCROW_LABEL[r.escrow.state]}
                              {r.escrow.state === 'HELD' ? ` · ${timeLeft(r.escrow.deadline)} (deadline ${new Date(r.escrow.deadline).toUTCString()})` : ''}
                            </p>
                          ) : null}
                          {r.escrow?.lastFailure ? <p className="text-sm text-danger">Last escrow transaction failed on the ledger ({r.escrow.lastFailure}). You can try again.</p> : null}
                          {r.refundDue ? <p className="text-sm font-medium text-danger">Refund owed to holder</p> : null}
                          {r.rejectionReason ? <p className="text-sm text-muted">Reason: {r.rejectionReason}</p> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!act.confirm || busy === r.id}
                            aria-describedby={act.reason ? `why-${r.id}` : undefined}
                            onClick={() => confirm(r.id)}
                            className="rounded-md bg-primary px-3 py-1.5 font-semibold text-white disabled:bg-muted disabled:opacity-70"
                          >
                            Confirm fulfilment
                          </button>
                          <button
                            type="button"
                            disabled={!act.reject || busy === r.id}
                            onClick={() => setRejecting(rejecting === r.id ? null : r.id)}
                            aria-expanded={rejecting === r.id}
                            className="rounded-md border border-ink px-3 py-1.5 font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      {act.reason ? (
                        <p id={`why-${r.id}`} className="mt-1 text-sm text-muted">
                          {act.reason}
                        </p>
                      ) : null}
                      {rejecting === r.id ? <RejectForm onSubmit={(reason) => reject(r.id, reason)} busy={busy === r.id} escrow={r.mode === 'ESCROW'} /> : null}
                      <EscrowSignPanel redemption={r} onDone={(next) => (replace(next), setNotice(next.escrow?.pendingAction ? 'Submitted; waiting for the ledger.' : 'Done: confirmed on the ledger.'))} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="disputes">
            <h2 id="disputes" className="mb-3 text-2xl font-semibold">
              Disputes
            </h2>
            {load.disputes.length === 0 ? (
              <p className="text-muted">No disputes about your redemptions.</p>
            ) : (
              <div className="space-y-3">
                {load.disputes.map((d) => (
                  <DisputeThread key={d.id} dispute={d} onChange={(n) => setLoad((l) => (l.status === 'ready' ? { ...l, disputes: l.disputes.map((x) => (x.id === n.id ? n : x)) } : l))} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function RejectForm({ onSubmit, busy, escrow }: { onSubmit: (reason: string) => void; busy: boolean; escrow: boolean }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get('reason') ?? '').trim();
    if (reason.length < 3 || reason.length > 500) return setError('Give the customer a reason (3-500 characters).');
    setError(null);
    onSubmit(reason);
  }
  return (
    <form onSubmit={submit} noValidate className="mt-3 space-y-2">
      <label htmlFor={`${id}-r`} className="block text-sm font-medium">
        Reason shown to the customer
      </label>
      <input id={`${id}-r`} name="reason" aria-invalid={error ? true : undefined} aria-describedby={`${id}-h`} className="w-full rounded-md border border-ink bg-surface px-3 py-2 text-ink" />
      <p id={`${id}-h`} className="text-sm text-muted">
        {escrow ? 'The escrow refunds the credit to the customer once you sign the refund.' : 'The credit was already returned to you; a refund is then owed under your policy.'}
      </p>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="rounded-md bg-danger px-3 py-1.5 font-semibold text-bg disabled:opacity-60">
        Reject redemption
      </button>
    </form>
  );
}
