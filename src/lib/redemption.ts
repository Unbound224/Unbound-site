import type { RedemptionState } from './api/schemas';

/** Merchant may confirm fulfilment only after the returned credit is confirmed on the ledger. */
export function canConfirm(state: RedemptionState): boolean {
  return state === 'RETURN_CONFIRMED';
}

export const STATE_LABEL: Record<RedemptionState, string> = {
  AWAITING_RETURN: 'Waiting for customer to return credit',
  RETURN_SUBMITTED: 'Return sent; waiting for ledger confirmation',
  RETURN_CONFIRMED: 'Credit returned and confirmed; ready to fulfil',
  FULFILLED: 'Fulfilled',
  REJECTED: 'Rejected (refund owed)',
  FAILED: 'Return failed',
  CANCELLED: 'Cancelled',
};

export function whyNotConfirmable(state: RedemptionState): string | null {
  if (canConfirm(state)) return null;
  if (state === 'FULFILLED') return 'Already fulfilled.';
  if (state === 'AWAITING_RETURN' || state === 'RETURN_SUBMITTED') return 'The returned credit is not confirmed on the ledger yet.';
  return 'This redemption is closed.';
}
