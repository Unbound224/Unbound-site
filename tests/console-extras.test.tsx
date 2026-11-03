import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { AdminConsole } from '@/components/AdminConsole';
import { Dashboard } from '@/components/Dashboard';
import { ForgotPasswordForm, ResetPasswordForm } from '@/components/PasswordReset';
import { ApiClientError, createClient, type Client } from '@/lib/api/client';
import type { Dispute, Redemption } from '@/lib/api/schemas';
import { merchantActions, timeLeft } from '@/lib/redemption';
import { SessionProvider, type Role } from '@/lib/session';
import { allClientMocks } from './client-mocks';

expect.extend(matchers);
const AXE = { rules: { 'color-contrast': { enabled: false } } } as const;

const FUTURE = new Date(Date.now() + 3 * 86_400_000).toISOString();
const escrow = (over: Partial<NonNullable<Redemption['escrow']>> = {}): NonNullable<Redemption['escrow']> => ({
  contractId: 'C'.padEnd(56, 'A'), deadline: FUTURE, state: 'HELD', refundAvailable: false, pendingAction: null, pendingXdr: null, pendingTxHash: null, closeTxHash: null, lastFailure: null, ...over,
});
const red = (over: Partial<Redemption> = {}): Redemption => ({
  id: 'red_1', state: 'RETURN_CONFIRMED', asset: { code: 'SHOP', issuer: 'GISSUER' }, amount: '30.0000000', holder: 'GHOLDER', returnTxHash: null,
  refundDue: false, rejectionReason: null, mode: 'ESCROW', escrow: escrow(), createdAt: 'x', updatedAt: 'x', ...over,
});
const XDR = 'AAAAAgAAAAB'.padEnd(80, 'A') + '==';
const dispute = (over: Partial<Dispute> = {}): Dispute => ({
  id: 'dsp_1', kind: 'REDEMPTION', subjectRef: 'red_1', merchantId: 'mer_1', reason: 'The shop never handed over the goods.', state: 'ESCALATED',
  messages: [{ at: '2026-11-01T00:00:00Z', authorId: 'usr_1', authorRole: 'user', text: 'Still waiting for my order.' }], createdAt: 'x', updatedAt: 'x', ...over,
});
const client = (over: Partial<Client> = {}): Client => ({ ...allClientMocks(), listRedemptions: vi.fn().mockResolvedValue([red()]), ...over });
const ui = (node: ReactNode, c: Client, role: Role | null = 'merchant') =>
  render(
    <SessionProvider makeClient={() => c} initialToken={role ? 'tok' : null} initialRole={role}>
      {node}
    </SessionProvider>,
  );

describe('escrow view rules', () => {
  it('pending actions and passed deadlines block merchant actions with a reason', () => {
    expect(merchantActions(red())).toEqual({ confirm: true, reject: true, reason: null });
    expect(merchantActions(red({ escrow: escrow({ pendingAction: 'CONFIRM' }) })).reason).toMatch(/signed confirm fulfilment/);
    expect(merchantActions(red({ escrow: escrow({ deadline: '2020-01-01T00:00:00Z' }) })).reason).toMatch(/deadline passed/);
    expect(merchantActions(red({ state: 'RETURN_SUBMITTED' })).confirm).toBe(false);
    const now = new Date('2026-01-01T00:00:00Z');
    expect(timeLeft('2026-01-04T00:00:00Z', now)).toBe('3 days left');
    expect(timeLeft('2026-01-01T05:00:00Z', now)).toBe('5 h left');
    expect(timeLeft('2026-01-01T00:10:00Z', now)).toBe('10 min left');
    expect(timeLeft('2025-12-31T00:00:00Z', now)).toBe('deadline passed');
  });
});

describe('merchant console with escrowed redemptions', () => {
  it('shows the escrow state and deadline, then asks for the issuer signature after confirm', async () => {
    const pending = red({ escrow: escrow({ pendingAction: 'CONFIRM', pendingXdr: XDR, pendingTxHash: 'a'.repeat(64) }) });
    const c = client({ confirmRedemption: vi.fn().mockResolvedValue(pending), submitEscrowAction: vi.fn().mockResolvedValue(red({ state: 'FULFILLED', escrow: escrow({ state: 'RELEASED' }) })) });
    const { container } = ui(<Dashboard />, c);
    expect(await screen.findByText(/Held in escrow · 3 days left|Held in escrow · 2 days left/)).toBeInTheDocument();
    expect(screen.getByText('Escrow')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /confirm fulfilment/i }));
    expect(await screen.findByText(/sign the release transaction/i)).toBeInTheDocument();
    const panel = screen.getByRole('form', { name: /sign to confirm fulfilment/i });
    expect(within(panel).getByLabelText(/unsigned transaction/i)).toHaveValue(XDR);
    expect(within(panel).getByText(/never paste a secret key/i)).toBeInTheDocument();
    expect((await axe(container, AXE)).violations).toEqual([]);
    // validation before any call
    await userEvent.click(within(panel).getByRole('button', { name: /submit signed/i }));
    expect(within(panel).getByRole('alert')).toHaveTextContent(/paste the signed/i);
    expect(c.submitEscrowAction).not.toHaveBeenCalled();
    await userEvent.type(within(panel).getByLabelText(/^signed transaction/i), XDR);
    await userEvent.click(within(panel).getByRole('button', { name: /submit signed/i }));
    await waitFor(() => expect(c.submitEscrowAction).toHaveBeenCalledWith('red_1', XDR));
    expect(await screen.findByText(/Released to you/)).toBeInTheDocument();
  });

  it('reject asks for a reason, then the issuer-signed refund for escrowed credit', async () => {
    const c = client({ rejectRedemption: vi.fn().mockResolvedValue(red({ escrow: escrow({ pendingAction: 'REJECT', pendingXdr: XDR, pendingTxHash: 'b'.repeat(64) }) })) });
    ui(<Dashboard />, c);
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    await userEvent.click(screen.getByRole('button', { name: /reject redemption/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/give the customer a reason/i);
    await userEvent.type(screen.getByLabelText(/reason shown to the customer/i), 'Out of stock');
    await userEvent.click(screen.getByRole('button', { name: /reject redemption/i }));
    await waitFor(() => expect(c.rejectRedemption).toHaveBeenCalledWith('red_1', 'Out of stock'));
    expect(await screen.findByRole('form', { name: /sign to reject and refund/i })).toBeInTheDocument();
  });

  it('native rejection reports the refund obligation', async () => {
    const c = client({
      listRedemptions: vi.fn().mockResolvedValueOnce([red({ mode: 'NATIVE', escrow: null })]).mockResolvedValue([red({ mode: 'NATIVE', escrow: null, state: 'REJECTED', refundDue: true })]),
      rejectRedemption: vi.fn().mockResolvedValue(red({ mode: 'NATIVE', escrow: null, state: 'REJECTED', refundDue: true })),
    });
    ui(<Dashboard />, c);
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    await userEvent.type(screen.getByLabelText(/reason shown to the customer/i), 'Out of stock');
    await userEvent.click(screen.getByRole('button', { name: /reject redemption/i }));
    expect(await screen.findByText(/a refund is owed to the holder/i)).toBeInTheDocument();
  });

  it('after the deadline the merchant can no longer act', async () => {
    ui(<Dashboard />, client({ listRedemptions: vi.fn().mockResolvedValue([red({ escrow: escrow({ deadline: '2020-01-01T00:00:00Z' }) })]) }));
    const btn = await screen.findByRole('button', { name: /confirm fulfilment/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAccessibleDescription(/customer can now take the refund/i);
  });

  it('lists disputes and lets the merchant reply (10+ characters)', async () => {
    const c = client({ listDisputes: vi.fn().mockResolvedValue([dispute({ state: 'OPEN' })]), addDisputeMessage: vi.fn().mockResolvedValue(dispute({ state: 'MERCHANT_RESPONDED' })) });
    ui(<Dashboard />, c);
    const box = await screen.findByLabelText(/add a message/i);
    expect(screen.queryByText(/record ruling/i)).toBeNull();
    await userEvent.type(box, 'short');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 10/i);
    await userEvent.type(box, ' but now long enough');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() => expect(c.addDisputeMessage).toHaveBeenCalledWith('dsp_1', 'short but now long enough'));
    expect(await screen.findByText('Merchant responded')).toBeInTheDocument();
  });
});

describe('reviewer console', () => {
  const merchants = [
    { id: 'mer_1', legalName: 'Acme Coffee Ltd', jurisdiction: 'Testland', contact: 'a@example.invalid', status: 'APPLIED' as const, createdAt: '2026-11-01T00:00:00Z', updatedAt: 'x' },
    { id: 'mer_2', legalName: 'Beta Books', jurisdiction: 'Testland', contact: 'b@example.invalid', status: 'VERIFIED' as const, createdAt: '2026-10-01T00:00:00Z', updatedAt: 'x' },
  ];
  const jobs = [{ name: 'reconcile-escrows', intervalMs: 120_000, running: false, runs: 3, failures: 1, consecutiveFailures: 1, lastStartedAt: null, lastFinishedAt: '2026-11-01T00:00:00Z', lastError: 'gateway down', lastItems: 0, nextEligibleAt: null }];
  const admin = (over: Partial<Client> = {}) => client({ listMerchants: vi.fn().mockResolvedValue(merchants), listDisputes: vi.fn().mockResolvedValue([dispute({ state: 'OPEN' }), dispute({ id: 'dsp_2', subjectRef: 'red_9' })]), listJobs: vi.fn().mockResolvedValue(jobs), ...over });

  it('asks for sign-in without a registration option, and refuses non-reviewer accounts', async () => {
    const { unmount } = ui(<AdminConsole />, admin(), null);
    expect(screen.getByRole('heading', { name: 'Reviewer sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /need an account/i })).toBeNull();
    unmount();
    ui(<AdminConsole />, admin(), 'merchant');
    expect(screen.getByRole('alert')).toHaveTextContent(/not a reviewer account/i);
  });

  it('shows counts, escalated disputes first, failing jobs, and is accessible', async () => {
    const { container } = ui(<AdminConsole />, admin(), 'admin');
    expect(await screen.findByText('Acme Coffee Ltd')).toBeInTheDocument();
    const threads = screen.getAllByRole('article');
    expect(within(threads[0]!).getByText(/Escalated/)).toBeInTheDocument();
    expect(screen.getByText(/Failing \(1x\): gateway down/)).toBeInTheDocument();
    expect((await axe(container, AXE)).violations).toEqual([]);
  });

  it('verify needs an evidence reference; revoke needs a reason', async () => {
    const c = admin({ verifyMerchant: vi.fn().mockResolvedValue({ status: 'VERIFIED' }), revokeMerchant: vi.fn().mockResolvedValue({ ok: true }) });
    ui(<AdminConsole />, c, 'admin');
    await userEvent.click(await screen.findByRole('button', { name: /verify issuer/i }));
    expect(screen.getByText(/evidence reference \(3\+ characters\) is required/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/evidence reference/i), 'KYB-2026-0042');
    await userEvent.click(screen.getByRole('button', { name: /verify issuer/i }));
    await waitFor(() => expect(c.verifyMerchant).toHaveBeenCalledWith('mer_1', 'KYB-2026-0042'));
    expect(await screen.findByText(/Acme Coffee Ltd verified/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/revocation reason/i), 'licence withdrawn');
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(c.revokeMerchant).toHaveBeenCalledWith('mer_2', 'licence withdrawn'));
  });

  it('records a ruling and runs a job on demand', async () => {
    const c = admin({ resolveDispute: vi.fn().mockResolvedValue(dispute({ state: 'RESOLVED_FOR_HOLDER' })), runJob: vi.fn().mockResolvedValue(jobs[0]) });
    ui(<AdminConsole />, c, 'admin');
    const first = (await screen.findAllByRole('article'))[0]!;
    await userEvent.click(within(first).getByLabelText(/for the merchant/i));
    await userEvent.type(within(first).getByLabelText(/ruling note/i), 'Receipt shows the goods were collected.');
    await userEvent.click(within(first).getByRole('button', { name: /record ruling/i }));
    await waitFor(() => expect(c.resolveDispute).toHaveBeenCalledWith('dsp_2', 'FOR_MERCHANT', 'Receipt shows the goods were collected.'));
    await userEvent.click(screen.getByRole('button', { name: /run now/i }));
    await waitFor(() => expect(c.runJob).toHaveBeenCalledWith('reconcile-escrows'));
  });

  it('shows the API error when the reviewer endpoints are refused', async () => {
    ui(<AdminConsole />, admin({ listMerchants: vi.fn().mockRejectedValue(new ApiClientError('FORBIDDEN', 'x', 403)) }), 'admin');
    expect(await screen.findByRole('alert')).toHaveTextContent(/not allowed/i);
  });
});

describe('password reset', () => {
  it('requests a link and always gives the same answer', async () => {
    const c = client();
    const { container } = ui(<ForgotPasswordForm />, c, null);
    expect((await axe(container, AXE)).violations).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: /email me a reset link/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your email/i);
    await userEvent.type(screen.getByLabelText('Email'), 'owner@shop.example');
    await userEvent.click(screen.getByRole('button', { name: /email me a reset link/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/if an account exists/i);
    expect(c.requestPasswordReset).toHaveBeenCalledWith('owner@shop.example');
  });

  it('sets a new password with the token, checking the repeat and length first', async () => {
    const c = client();
    const { container } = ui(<ResetPasswordForm initialToken={'t'.repeat(43)} />, c, null);
    expect((await axe(container, AXE)).violations).toEqual([]);
    await userEvent.type(screen.getByLabelText('New password'), 'brand-new-password-1');
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'different-password-1');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
    await userEvent.clear(screen.getByLabelText('Repeat new password'));
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'brand-new-password-1');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/signed out/i);
    expect(c.confirmPasswordReset).toHaveBeenCalledWith('t'.repeat(43), 'brand-new-password-1');
  });

  it('an expired link shows the server message', async () => {
    const c = client({ confirmPasswordReset: vi.fn().mockRejectedValue(new ApiClientError('UNAUTHENTICATED', 'this reset link is invalid or has expired', 401)) });
    ui(<ResetPasswordForm initialToken={'t'.repeat(43)} />, c, null);
    for (const l of ['New password', 'Repeat new password']) await userEvent.type(screen.getByLabelText(l), 'brand-new-password-1');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('api client: new endpoints', () => {
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  it('escrow submit strips whitespace and validates base64; older cores without escrow fields still parse', async () => {
    const legacy = { id: 'red_1', state: 'RETURN_CONFIRMED', asset: { code: 'S', issuer: 'G' }, amount: '1.0000000', holder: 'H', returnTxHash: null, refundDue: false, rejectionReason: null, createdAt: 'x', updatedAt: 'x' };
    const f = vi.fn().mockResolvedValue(json(legacy));
    const c = createClient({ baseUrl: 'http://x', token: 't', fetchImpl: f });
    const r = await c.submitEscrowAction('red_1', `${XDR.slice(0, 40)}\n${XDR.slice(40)}`);
    expect(r).toMatchObject({ mode: 'NATIVE', escrow: null });
    expect(JSON.parse(f.mock.calls[0]![1].body)).toEqual({ signedXdr: XDR });
    expect(f.mock.calls[0]![0]).toBe('http://x/v1/merchants/me/redemptions/red_1/escrow/submit');
    expect(() => c.submitEscrowAction('red_1', 'not xdr!!')).toThrow();
  });
  it('job names and ids are url-encoded', async () => {
    const f = vi.fn().mockResolvedValue(json({ name: 'a', intervalMs: 1, running: false, runs: 1, failures: 0, consecutiveFailures: 0, lastStartedAt: null, lastFinishedAt: null, lastError: null, lastItems: null, nextEligibleAt: null }));
    await createClient({ baseUrl: 'http://x', fetchImpl: f }).runJob('a/b');
    expect(f.mock.calls[0]![0]).toBe('http://x/v1/admin/jobs/a%2Fb/run');
  });
});
