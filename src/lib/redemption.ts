import type { EscrowView, Redemption, RedemptionState } from './api/schemas';

/** Merchant may confirm fulfilment only after the returned credit is confirmed on the ledger. */
export function canConfirm(state: RedemptionState): boolean {
  return state === 'RETURN_CONFIRMED';
}

export const STATE_LABEL: Record<RedemptionState, string> = {
  AWAITING_RETURN: 'Waiting for customer to return credit',
  RETURN_SUBMITTED: 'Return sent; waiting for ledger confirmation',
  RETURN_CONFIRMED: 'Credit returned and confirmed; ready to fulfil',
  FULFILLED: 'Fulfilled',
  REJECTED: 'Rejected',
  EXPIRED: 'Refunded after the deadline',
  FAILED: 'Return failed',
  CANCELLED: 'Cancelled',
};

export const ESCROW_LABEL: Record<EscrowView['state'], string> = {
  AWAITING_OPEN: 'Waiting for the customer to move credit into escrow',
  HELD: 'Held in escrow',
  RELEASED: 'Released to you (burned)',
  REFUNDED: 'Refunded to the customer',
  EXPIRED_REFUNDED: 'Refunded to the customer after the deadline',
};

export const ACTION_LABEL: Record<NonNullable<EscrowView['pendingAction']>, string> = {
  CONFIRM: 'confirm fulfilment',
  REJECT: 'reject and refund',
  EXPIRE: 'timeout refund',
};

export function whyNotConfirmable(state: RedemptionState): string | null {
  if (canConfirm(state)) return null;
  if (state === 'FULFILLED') return 'Already fulfilled.';
  if (state === 'AWAITING_RETURN' || state === 'RETURN_SUBMITTED') return 'The returned credit is not confirmed on the ledger yet.';
  return 'This redemption is closed.';
}

/** True once the escrow deadline has passed: only the customer's refund is possible then. */
export function escrowDeadlinePassed(e: EscrowView, now: Date = new Date()): boolean {
  return now.getTime() >= Date.parse(e.deadline);
}

/** What the merchant can do with a redemption right now, and why not otherwise. */
export function merchantActions(r: Redemption, now: Date = new Date()): { confirm: boolean; reject: boolean; reason: string | null } {
  if (!canConfirm(r.state)) return { confirm: false, reject: false, reason: whyNotConfirmable(r.state) };
  if (r.mode === 'ESCROW' && r.escrow) {
    if (r.escrow.pendingAction) return { confirm: false, reject: false, reason: `Waiting for your signed ${ACTION_LABEL[r.escrow.pendingAction]} transaction.` };
    if (escrowDeadlinePassed(r.escrow, now)) return { confirm: false, reject: false, reason: 'The escrow deadline passed; the customer can now take the refund.' };
  }
  return { confirm: true, reject: true, reason: null };
}

/** Human "time left" for an escrow deadline, coarse on purpose (it is a ledger timestamp, not a promise). */
export function timeLeft(deadline: string, now: Date = new Date()): string {
  const ms = Date.parse(deadline) - now.getTime();
  if (ms <= 0) return 'deadline passed';
  const h = Math.floor(ms / 3_600_000);
  if (h >= 48) return `${Math.floor(h / 24)} days left`;
  if (h >= 1) return `${h} h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min left`;
}
