'use client';

import { useId, useState, type FormEvent } from 'react';
import { describeError } from '@/lib/api/client';
import { DisputeText, type Dispute } from '@/lib/api/schemas';
import { useSession } from '@/lib/session';

export const DISPUTE_LABEL: Record<Dispute['state'], string> = {
  OPEN: 'Open: waiting for the merchant',
  MERCHANT_RESPONDED: 'Merchant responded',
  ESCALATED: 'Escalated: merchant missed the response window',
  RESOLVED_FOR_HOLDER: 'Resolved for the holder',
  RESOLVED_FOR_MERCHANT: 'Resolved for the merchant',
  WITHDRAWN: 'Withdrawn by the holder',
};

const CLOSED = new Set<Dispute['state']>(['RESOLVED_FOR_HOLDER', 'RESOLVED_FOR_MERCHANT', 'WITHDRAWN']);

/** A dispute with its messages, a reply box and (for admins) the ruling form. Rulings never move funds. */
export function DisputeThread({ dispute, canResolve = false, onChange }: { dispute: Dispute; canResolve?: boolean; onChange: (d: Dispute) => void }) {
  const id = useId();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const closed = CLOSED.has(dispute.state);

  async function run(form: HTMLFormElement, fn: (fd: FormData) => Promise<Dispute>) {
    setError(null);
    setBusy(true);
    try {
      onChange(await fn(new FormData(form)));
      form.reset();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  function reply(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const text = String(new FormData(ev.currentTarget).get('text') ?? '');
    const p = DisputeText.safeParse(text);
    if (!p.success) return setError(p.error.issues[0]?.message ?? 'Write at least 10 characters');
    void run(ev.currentTarget, () => session.client().addDisputeMessage(dispute.id, p.data));
  }

  function resolve(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const outcome = fd.get('outcome') === 'FOR_MERCHANT' ? 'FOR_MERCHANT' : 'FOR_HOLDER';
    const p = DisputeText.safeParse(String(fd.get('note') ?? ''));
    if (!p.success) return setError(p.error.issues[0]?.message ?? 'Write at least 10 characters');
    void run(ev.currentTarget, () => session.client().resolveDispute(dispute.id, outcome, p.data));
  }

  return (
    <article aria-labelledby={`${id}-h`} className="space-y-3 rounded-lg border border-line p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`${id}-h`} className="font-semibold">
          {dispute.kind === 'REDEMPTION' ? 'Redemption' : 'Exchange'} dispute <code className="text-sm">{dispute.subjectRef}</code>
        </h3>
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${dispute.state === 'ESCALATED' ? 'bg-danger text-bg' : 'bg-primary text-white'}`}>{DISPUTE_LABEL[dispute.state]}</span>
      </header>
      <p className="text-sm">
        <span className="font-medium">Holder&apos;s reason:</span> {dispute.reason}
      </p>
      {dispute.respondBy && dispute.state === 'OPEN' ? <p className="text-sm text-muted">Merchant response due by {new Date(dispute.respondBy).toUTCString()}.</p> : null}
      {dispute.messages.length ? (
        <ol className="space-y-2" aria-label="Messages">
          {dispute.messages.map((m, i) => (
            <li key={i} className="rounded-md bg-bg p-2 text-sm">
              <span className="font-semibold capitalize">{m.authorRole}</span> <span className="text-muted">{new Date(m.at).toUTCString()}</span>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {dispute.resolution ? (
        <p className="rounded-md border border-line p-2 text-sm">
          <span className="font-semibold">Ruling ({dispute.resolution.outcome === 'FOR_HOLDER' ? 'for the holder' : 'for the merchant'}):</span> {dispute.resolution.note}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {!closed ? (
        <form onSubmit={reply} noValidate className="space-y-2">
          <label htmlFor={`${id}-m`} className="block text-sm font-medium">
            Add a message
          </label>
          <textarea id={`${id}-m`} name="text" rows={2} className="w-full rounded-md border border-ink bg-surface p-2 text-ink" />
          <button type="submit" disabled={busy} className="rounded-md border border-ink px-3 py-1.5 text-sm font-semibold disabled:opacity-60">
            Send message
          </button>
        </form>
      ) : null}
      {!closed && canResolve ? (
        <form onSubmit={resolve} noValidate className="space-y-2 border-t border-line pt-3">
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Ruling</legend>
            <label className="mr-4 text-sm">
              <input type="radio" name="outcome" value="FOR_HOLDER" defaultChecked /> For the holder
            </label>
            <label className="text-sm">
              <input type="radio" name="outcome" value="FOR_MERCHANT" /> For the merchant
            </label>
          </fieldset>
          <label htmlFor={`${id}-n`} className="block text-sm font-medium">
            Ruling note (shown to both parties)
          </label>
          <textarea id={`${id}-n`} name="note" rows={2} className="w-full rounded-md border border-ink bg-surface p-2 text-ink" />
          <p className="text-xs text-muted">A ruling records the decision. It never moves funds; a refund owed is the issuer&apos;s obligation under its policy.</p>
          <button type="submit" disabled={busy} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
            Record ruling
          </button>
        </form>
      ) : null}
    </article>
  );
}
