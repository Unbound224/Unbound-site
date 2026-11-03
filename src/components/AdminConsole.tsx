'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { describeError } from '@/lib/api/client';
import type { AdminMerchant, Dispute, JobStatus } from '@/lib/api/schemas';
import { useSession } from '@/lib/session';
import { SignInForm } from '@/components/SignInForm';
import { DisputeThread } from '@/components/DisputeThread';
import { signOut } from '@/components/Dashboard';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; merchants: AdminMerchant[]; disputes: Dispute[]; jobs: JobStatus[] };

const ORDER: Record<Dispute['state'], number> = { ESCALATED: 0, OPEN: 1, MERCHANT_RESPONDED: 2, RESOLVED_FOR_HOLDER: 3, RESOLVED_FOR_MERCHANT: 3, WITHDRAWN: 4 };

/** Reviewer console: verify or revoke issuers, rule on disputes, watch the maintenance jobs. Core enforces the admin role on every call. */
export function AdminConsole() {
  const session = useSession();
  if (!session.signedIn) return <SignInForm allowRegister={false} title="Reviewer sign in" />;
  if (session.role !== 'admin') {
    return (
      <div className="space-y-3" role="alert">
        <p className="font-medium text-danger">This account is not a reviewer account. Use the merchant console instead.</p>
        <button type="button" onClick={() => signOut(session)} className="rounded-md border border-ink px-4 py-2 font-semibold">
          Sign out
        </button>
      </div>
    );
  }
  return <Admin key="admin" />;
}

function Admin() {
  const session = useSession();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);

  async function fetchAll(): Promise<Load> {
    try {
      const c = session.client();
      const [merchants, disputes, jobs] = await Promise.all([c.listMerchants(), c.listDisputes(), c.listJobs()]);
      return { status: 'ready', merchants, disputes: [...disputes].sort((a, b) => ORDER[a.state] - ORDER[b.state]), jobs };
    } catch (e) {
      return { status: 'error', message: describeError(e) };
    }
  }

  useEffect(() => {
    let live = true;
    void fetchAll().then((r) => live && setLoad(r));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (msg?: string) => {
    setLoad(await fetchAll());
    if (msg) setNotice(msg);
  };

  async function act(fn: () => Promise<unknown>, msg: string) {
    setNotice(null);
    try {
      await fn();
      await refresh(msg);
    } catch (e) {
      setNotice(describeError(e));
    }
  }

  const pending = load.status === 'ready' ? load.merchants.filter((m) => m.status === 'APPLIED').length : 0;
  const escalated = load.status === 'ready' ? load.disputes.filter((d) => d.state === 'ESCALATED').length : 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">Signed in as a reviewer. Every action is recorded in the audit trail with your account.</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => refresh()} className="rounded-md border border-line px-4 py-2 font-semibold">
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
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              ['Applications waiting', pending],
              ['Escalated disputes', escalated],
              ['Jobs failing', load.jobs.filter((j) => j.consecutiveFailures > 0).length],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line p-4">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-2xl font-bold">{v}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="queue">
            <h2 id="queue" className="mb-1 text-2xl font-semibold">
              Issuer review queue
            </h2>
            <p className="mb-3 text-sm text-muted">Verify only with an evidence reference from your own review (ticket or document id). Revoking suspends every program at once.</p>
            {load.merchants.length === 0 ? (
              <p className="text-muted">No merchant applications.</p>
            ) : (
              <ul className="space-y-3">
                {load.merchants.map((m) => (
                  <MerchantRow
                    key={m.id}
                    m={m}
                    onVerify={(ref) => act(() => session.client().verifyMerchant(m.id, ref), `${m.legalName} verified.`)}
                    onRevoke={(reason) => act(() => session.client().revokeMerchant(m.id, reason), `${m.legalName} revoked; its programs are suspended.`)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="disputes">
            <h2 id="disputes" className="mb-3 text-2xl font-semibold">
              Disputes
            </h2>
            {load.disputes.length === 0 ? (
              <p className="text-muted">No disputes.</p>
            ) : (
              <div className="space-y-3">
                {load.disputes.map((d) => (
                  <DisputeThread key={d.id} dispute={d} canResolve onChange={() => void refresh('Dispute updated.')} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="jobs">
            <h2 id="jobs" className="mb-3 text-2xl font-semibold">
              Maintenance jobs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <caption className="sr-only">Scheduled maintenance jobs in unbound-core</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-3">Job</th>
                    <th scope="col" className="py-2 pr-3">Every</th>
                    <th scope="col" className="py-2 pr-3">Last run</th>
                    <th scope="col" className="py-2 pr-3">Health</th>
                    <th scope="col" className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {load.jobs.map((j) => (
                    <tr key={j.name} className="border-b border-line align-top">
                      <td className="py-2 pr-3 font-mono text-xs">{j.name}</td>
                      <td className="py-2 pr-3">{Math.round(j.intervalMs / 60_000)} min</td>
                      <td className="py-2 pr-3">{j.lastFinishedAt ? `${new Date(j.lastFinishedAt).toUTCString()} (${j.lastItems ?? 0} changed)` : 'not run yet'}</td>
                      <td className="py-2 pr-3">{j.consecutiveFailures ? <span className="text-danger">Failing ({j.consecutiveFailures}x): {j.lastError}</span> : 'OK'}</td>
                      <td className="py-2">
                        <button type="button" disabled={j.running} onClick={() => act(() => session.client().runJob(j.name), `${j.name} ran.`)} className="rounded-md border border-ink px-3 py-1 font-semibold disabled:opacity-50">
                          Run now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

const STATUS_LABEL: Record<AdminMerchant['status'], string> = { APPLIED: 'Waiting for review', VERIFIED: 'Verified', REJECTED: 'Rejected', REVOKED: 'Revoked' };

function MerchantRow({ m, onVerify, onRevoke }: { m: AdminMerchant; onVerify: (ref: string) => void; onRevoke: (reason: string) => void }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  function submit(kind: 'verify' | 'revoke') {
    return (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const v = String(new FormData(e.currentTarget).get('v') ?? '').trim();
      if (v.length < 3) return setError(kind === 'verify' ? 'An evidence reference (3+ characters) is required.' : 'A reason (3+ characters) is required.');
      setError(null);
      if (kind === 'verify') onVerify(v);
      else onRevoke(v);
    };
  }
  return (
    <li className="space-y-3 rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{m.legalName}</p>
        <span className="rounded border border-line px-2 py-0.5 text-xs font-semibold">{STATUS_LABEL[m.status]}</span>
      </div>
      <p className="text-sm text-muted">
        {m.jurisdiction} · {m.contact} · applied {new Date(m.createdAt).toUTCString()}
      </p>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {m.status === 'APPLIED' ? (
        <form onSubmit={submit('verify')} noValidate className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`${id}-v`} className="block text-sm font-medium">
              Evidence reference
            </label>
            <input id={`${id}-v`} name="v" className="rounded-md border border-ink bg-surface px-3 py-1.5 text-ink" />
          </div>
          <button type="submit" className="rounded-md bg-primary px-3 py-1.5 font-semibold text-white">
            Verify issuer
          </button>
        </form>
      ) : null}
      {m.status === 'VERIFIED' ? (
        <form onSubmit={submit('revoke')} noValidate className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`${id}-r`} className="block text-sm font-medium">
              Revocation reason
            </label>
            <input id={`${id}-r`} name="v" className="rounded-md border border-ink bg-surface px-3 py-1.5 text-ink" />
          </div>
          <button type="submit" className="rounded-md bg-danger px-3 py-1.5 font-semibold text-bg">
            Revoke
          </button>
        </form>
      ) : null}
    </li>
  );
}
