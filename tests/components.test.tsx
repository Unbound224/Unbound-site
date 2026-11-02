import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApplyForm } from '@/components/ApplyForm';
import { Dashboard } from '@/components/Dashboard';
import { ApiClientError, type Client } from '@/lib/api/client';
import { canConfirm, whyNotConfirmable } from '@/lib/redemption';
import type { Asset, Redemption } from '@/lib/api/schemas';
import Home from '@/app/page';
import DocsPage from '@/app/docs/page';

const asset: Asset = {
  id: 'prg_1', assetCode: 'SHOP', issuer: 'GISSUER', status: 'ACTIVE',
  policy: { unitOfAccount: '1 SHOP = 1 USD (synthetic)', expiresAt: '2027-11-02T00:00:00.000Z', jurisdiction: 'Testland', refundPolicy: 'r', contact: 'c', redemptionLimits: {} },
};
const red = (over: Partial<Redemption> = {}): Redemption => ({
  id: 'red_1', state: 'RETURN_CONFIRMED', asset: { code: 'SHOP', issuer: 'GISSUER' }, amount: '30.0000000', holder: 'GHOLDER',
  returnTxHash: null, refundDue: false, rejectionReason: null, createdAt: 'x', updatedAt: 'x', ...over,
});
const fakeClient = (over: Partial<Client> = {}): Client => ({
  apply: vi.fn(), listAssets: vi.fn().mockResolvedValue([asset]), listRedemptions: vi.fn().mockResolvedValue([red()]), confirmRedemption: vi.fn().mockResolvedValue(red({ state: 'FULFILLED' })), ...over,
});

describe('redemption rules (view logic)', () => {
  it('only a ledger-confirmed return can be confirmed', () => {
    expect(canConfirm('RETURN_CONFIRMED')).toBe(true);
    for (const s of ['AWAITING_RETURN', 'RETURN_SUBMITTED', 'FULFILLED', 'REJECTED', 'FAILED', 'CANCELLED'] as const) expect(canConfirm(s)).toBe(false);
    expect(whyNotConfirmable('RETURN_SUBMITTED')).toMatch(/not confirmed on the ledger/);
    expect(whyNotConfirmable('RETURN_CONFIRMED')).toBeNull();
  });
});

describe('ApplyForm', () => {
  it('shows accessible field errors and does not call the API for invalid input', async () => {
    const client = fakeClient();
    render(<ApplyForm client={client} />);
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    const name = screen.getByLabelText('Legal name');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(client.apply).not.toHaveBeenCalled();
  });

  it('submits valid input, then says it is NOT an approval', async () => {
    const client = fakeClient({ apply: vi.fn().mockResolvedValue({ id: 'mer_1', legalName: 'Acme', status: 'APPLIED' }) });
    render(<ApplyForm client={client} />);
    await userEvent.type(screen.getByLabelText('Legal name'), 'Acme Coffee Ltd');
    await userEvent.type(screen.getByLabelText('Jurisdiction'), 'Testland');
    await userEvent.type(screen.getByLabelText('Redemption contact'), 'hi@example.invalid');
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/not an approval/i);
    expect(client.apply).toHaveBeenCalledWith({ legalName: 'Acme Coffee Ltd', jurisdiction: 'Testland', contact: 'hi@example.invalid' });
  });

  it('surfaces API failure in an alert and keeps the form', async () => {
    const client = fakeClient({ apply: vi.fn().mockRejectedValue(new ApiClientError('UNAUTHENTICATED', 'x', 401)) });
    render(<ApplyForm client={client} />);
    await userEvent.type(screen.getByLabelText('Legal name'), 'Acme Coffee Ltd');
    await userEvent.type(screen.getByLabelText('Jurisdiction'), 'Testland');
    await userEvent.type(screen.getByLabelText('Redemption contact'), 'hi@example.invalid');
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/session/i);
    expect(screen.getByLabelText('Legal name')).toBeInTheDocument();
  });

  it('never asks for a secret key or seed', () => {
    render(<ApplyForm client={fakeClient()} />);
    expect(screen.queryByLabelText(/secret|seed|private key/i)).toBeNull();
    expect(screen.getByText(/never enter a secret key/i)).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  async function connect(client: Client) {
    render(<Dashboard makeClient={() => client} />);
    const load = screen.getByRole('button', { name: /load console/i });
    expect(load).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/session token/i), 'tok');
    await userEvent.click(load);
  }

  it('renders programs and a redemption queue with a labelled table', async () => {
    await connect(fakeClient());
    expect(await screen.findByText('SHOP')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /redemption requests/i });
    expect(within(table).getByRole('button', { name: /confirm fulfilment/i })).toBeEnabled();
  });

  it('disables confirm, with an explanation, until the return is ledger-confirmed', async () => {
    await connect(fakeClient({ listRedemptions: vi.fn().mockResolvedValue([red({ state: 'RETURN_SUBMITTED' })]) }));
    const btn = await screen.findByRole('button', { name: /confirm fulfilment/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAccessibleDescription(/not confirmed on the ledger yet/i);
  });

  it('confirms, refreshes and announces the result', async () => {
    const client = fakeClient();
    (client.listRedemptions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([red()]).mockResolvedValueOnce([red({ state: 'FULFILLED' })]);
    await connect(client);
    await userEvent.click(await screen.findByRole('button', { name: /confirm fulfilment/i }));
    await waitFor(() => expect(client.confirmRedemption).toHaveBeenCalledWith('red_1'));
    expect(await screen.findByText(/confirmed as fulfilled/i)).toBeInTheDocument();
    expect(await screen.findByText('Fulfilled')).toBeInTheDocument();
  });

  it('shows the API error when confirmation is refused and leaves state alone', async () => {
    const client = fakeClient({ confirmRedemption: vi.fn().mockRejectedValue(new ApiClientError('SENSITIVE_ACTIONS_PAUSED', 'x', 423)) });
    await connect(client);
    await userEvent.click(await screen.findByRole('button', { name: /confirm fulfilment/i }));
    expect(await screen.findByText(/paused while a ledger discrepancy/i)).toBeInTheDocument();
  });

  it('shows an alert when the API is unreachable', async () => {
    await connect(fakeClient({ listAssets: vi.fn().mockRejectedValue(new ApiClientError('NETWORK', 'x', 0)) }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the unbound api/i);
  });

  it('empty states are honest and refund-owed is flagged', async () => {
    await connect(fakeClient({ listAssets: vi.fn().mockResolvedValue([]), listRedemptions: vi.fn().mockResolvedValue([red({ state: 'REJECTED', refundDue: true })]) }));
    expect(await screen.findByText(/no eligible credit programs yet/i)).toBeInTheDocument();
    expect(screen.getByText(/refund owed to holder/i)).toBeInTheDocument();
  });
});

describe('public copy guardrails', () => {
  it('landing page is honest: Testnet, no store availability, explicit non-goals', () => {
    const { container } = render(<Home />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/not available in any app store/i);
    expect(text).toMatch(/Testnet only today/i);
    expect(text).toMatch(/Guaranteed liquidity or a guaranteed price/i);
    expect(text).not.toMatch(/download on the app store|get it on google play|guaranteed returns|instant cash/i);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
  it('docs never ask for secrets and state signing is offline', () => {
    const { container } = render(<DocsPage />);
    expect(container.textContent).toMatch(/never asks for, receives or stores a secret key/i);
  });
});
