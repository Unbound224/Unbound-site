'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api/client';
import { useSession } from '@/lib/session';
import { SignInForm } from '@/components/SignInForm';
import type { Asset, Redemption } from '@/lib/api/schemas';
import { canConfirm, STATE_LABEL, whyNotConfirmable } from '@/lib/redemption';

type Load = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; assets: Asset[]; redemptions: Redemption[] };

export function Dashboard() {
  const session = useSession();
  // Keyed by sign-in so a new session always starts from a clean console.
  return session.signedIn ? <Console key="console" /> : <SignInForm />;
}

function Console() {
  const session = useSession();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function fetchAll(): Promise<Load> {
    try {
      const c = session.client();
      const [assets, redemptions] = await Promise.all([c.listAssets(), c.listRedemptions()]);
      return { status: 'ready', assets, redemptions };
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

  async function confirm(id: string) {
    setConfirming(id);
    setNotice(null);
    try {
      await session.client().confirmRedemption(id);
      setNotice('Redemption confirmed as fulfilled.');
      await refresh();
    } catch (e) {
      setNotice(describeError(e));
    } finally {
      setConfirming(null);
    }
  }

  async function signOut() {
    try {
      await session.client().logout();
    } catch {
      // the token is dropped locally regardless
    }
    session.setToken(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Signed in. Your session lives only in this page&apos;s memory and is never saved.</p>
        <button type="button" onClick={signOut} className="rounded-md border border-ink px-4 py-2 font-semibold">
          Sign out
        </button>
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
                      {a.assetCode} <span className="ml-2 rounded bg-deep px-2 py-0.5 text-xs text-ondark">{a.status}</span>
                    </p>
                    <p className="text-sm text-muted">Issuer {a.issuer}</p>
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
            <h2 id="redemptions" className="mb-3 text-2xl font-semibold">
              Redemption queue
            </h2>
            {load.redemptions.length === 0 ? (
              <p className="text-muted">No redemption requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left">
                  <caption className="sr-only">Redemption requests for your credit programs</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 pr-3">Request</th>
                      <th scope="col" className="py-2 pr-3">Amount</th>
                      <th scope="col" className="py-2 pr-3">Status</th>
                      <th scope="col" className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {load.redemptions.map((r) => {
                      const why = whyNotConfirmable(r.state);
                      return (
                        <tr key={r.id} className="border-b border-line align-top">
                          <td className="py-2 pr-3">
                            <code className="text-sm">{r.id}</code>
                            {r.refundDue ? <p className="text-sm font-medium text-danger">Refund owed to holder</p> : null}
                          </td>
                          <td className="py-2 pr-3">
                            {r.amount} {r.asset.code}
                          </td>
                          <td className="py-2 pr-3">{STATE_LABEL[r.state]}</td>
                          <td className="py-2">
                            <button
                              type="button"
                              disabled={!canConfirm(r.state) || confirming === r.id}
                              aria-describedby={why ? `why-${r.id}` : undefined}
                              onClick={() => confirm(r.id)}
                              className="rounded-md bg-primary px-3 py-1.5 font-semibold text-white disabled:bg-muted disabled:opacity-70"
                            >
                              Confirm fulfilment
                            </button>
                            {why ? (
                              <p id={`why-${r.id}`} className="mt-1 text-sm text-muted">
                                {why}
                              </p>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
