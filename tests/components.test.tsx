import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ApplyForm } from '@/components/ApplyForm';
import { SignInForm } from '@/components/SignInForm';
import { SessionProvider, useSession } from '@/lib/session';
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
  register: vi.fn().mockResolvedValue({ id: 'acc_1', email: 'a@example.invalid' }),
  login: vi.fn().mockResolvedValue({ token: 'tok', role: 'merchant', accountId: 'acc_1' }),
  logout: vi.fn().mockResolvedValue({ ok: true }),
  apply: vi.fn(),
  listAssets: vi.fn().mockResolvedValue([asset]),
  listRedemptions: vi.fn().mockResolvedValue([red()]),
  confirmRedemption: vi.fn().mockResolvedValue(red({ state: 'FULFILLED' })),
  ...over,
});

function withSession(ui: ReactNode, client: Client, signedIn = true) {
  return render(
    <SessionProvider makeClient={() => client} initialToken={signedIn ? 'tok' : null}>
      {ui}
    </SessionProvider>,
  );
}

describe('redemption rules (view logic)', () => {
  it('only a ledger-confirmed return can be confirmed', () => {
    expect(canConfirm('RETURN_CONFIRMED')).toBe(true);
    for (const s of ['AWAITING_RETURN', 'RETURN_SUBMITTED', 'FULFILLED', 'REJECTED', 'FAILED', 'CANCELLED'] as const) expect(canConfirm(s)).toBe(false);
    expect(whyNotConfirmable('RETURN_SUBMITTED')).toMatch(/not confirmed on the ledger/);
    expect(whyNotConfirmable('RETURN_CONFIRMED')).toBeNull();
  });
});

const PW = 'correct horse battery staple';

describe('SignInForm', () => {
  it('validates before calling the API, with accessible errors', async () => {
    const client = fakeClient();
    withSession(<SignInForm />, client, false);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/at least 12 characters/i, { selector: 'p.font-medium' })).toBeInTheDocument();
    expect(client.login).not.toHaveBeenCalled();
  });

  it('signs in and stores the token only in memory', async () => {
    const client = fakeClient();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    withSession(
      <>
        <SignInForm />
        <Probe />
      </>,
      client,
      false,
    );
    await userEvent.type(screen.getByLabelText('Email'), 'a@example.invalid');
    await userEvent.type(screen.getByLabelText('Password'), PW);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('signed-in')).toBeInTheDocument();
    expect(client.login).toHaveBeenCalledWith({ email: 'a@example.invalid', password: PW });
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('shows one generic failure message for bad credentials (no account enumeration)', async () => {
    const client = fakeClient({ login: vi.fn().mockRejectedValue(new ApiClientError('UNAUTHENTICATED', 'invalid credentials', 401)) });
    withSession(<SignInForm />, client, false);
    await userEvent.type(screen.getByLabelText('Email'), 'a@example.invalid');
    await userEvent.type(screen.getByLabelText('Password'), PW);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Check your email and password/);
  });

  it('register mode creates the account, then signs in, and warns it grants no authority', async () => {
    const client = fakeClient();
    withSession(<SignInForm />, client, false);
    await userEvent.click(screen.getByRole('button', { name: /Need an account/ }));
    expect(screen.getByText(/no authority until a reviewer verifies/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.invalid');
    await userEvent.type(screen.getByLabelText('Password'), PW);
    await userEvent.click(screen.getByRole('button', { name: /Create account and sign in/ }));
    await waitFor(() => expect(client.login).toHaveBeenCalled());
    expect(client.register).toHaveBeenCalledBefore(client.login as never);
  });

  it('a duplicate email is reported plainly', async () => {
    const client = fakeClient({ register: vi.fn().mockRejectedValue(new ApiClientError('INVALID_STATE', 'exists', 409)) });
    withSession(<SignInForm />, client, false);
    await userEvent.click(screen.getByRole('button', { name: /Need an account/ }));
    await userEvent.type(screen.getByLabelText('Email'), 'dup@example.invalid');
    await userEvent.type(screen.getByLabelText('Password'), PW);
    await userEvent.click(screen.getByRole('button', { name: /Create account and sign in/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/);
  });
});

function Probe() {
  const s = useSession();
  return <p>{s.signedIn ? 'signed-in' : 'signed-out'}</p>;
}

describe('ApplyForm', () => {
  it('asks for sign-in first when there is no session', () => {
    withSession(<ApplyForm />, fakeClient(), false);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Legal name')).toBeNull();
  });

  it('shows accessible field errors and does not call the API for invalid input', async () => {
    const client = fakeClient();
    withSession(<ApplyForm />, client);
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    expect(screen.getByLabelText('Legal name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(client.apply).not.toHaveBeenCalled();
  });

  it('submits valid input, then says it is NOT an approval', async () => {
    const client = fakeClient({ apply: vi.fn().mockResolvedValue({ id: 'mer_1', legalName: 'Acme', status: 'APPLIED' }) });
    withSession(<ApplyForm />, client);
    await userEvent.type(screen.getByLabelText('Legal name'), 'Acme Coffee Ltd');
    await userEvent.type(screen.getByLabelText('Jurisdiction'), 'Testland');
    await userEvent.type(screen.getByLabelText('Redemption contact'), 'hi@example.invalid');
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/not an approval/i);
    expect(client.apply).toHaveBeenCalledWith({ legalName: 'Acme Coffee Ltd', jurisdiction: 'Testland', contact: 'hi@example.invalid' });
  });

  it('surfaces API failure in an alert and keeps the form', async () => {
    const client = fakeClient({ apply: vi.fn().mockRejectedValue(new ApiClientError('UNAUTHENTICATED', 'x', 401)) });
    withSession(<ApplyForm />, client);
    await userEvent.type(screen.getByLabelText('Legal name'), 'Acme Coffee Ltd');
    await userEvent.type(screen.getByLabelText('Jurisdiction'), 'Testland');
    await userEvent.type(screen.getByLabelText('Redemption contact'), 'hi@example.invalid');
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/session expired|Sign-in failed/i);
    expect(screen.getByLabelText('Legal name')).toBeInTheDocument();
  });

  it('never asks for a secret key or seed', () => {
    withSession(<ApplyForm />, fakeClient());
    expect(screen.queryByLabelText(/secret|seed|private key/i)).toBeNull();
    expect(screen.getByText(/never enter a secret key/i)).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  it('requires sign-in and loads nothing before it', () => {
    const client = fakeClient();
    withSession(<Dashboard />, client, false);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(client.listRedemptions).not.toHaveBeenCalled();
  });

  it('renders programs and a redemption queue with a labelled table', async () => {
    withSession(<Dashboard />, fakeClient());
    expect(await screen.findByText('SHOP')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /redemption requests/i });
    expect(within(table).getByRole('button', { name: /confirm fulfilment/i })).toBeEnabled();
  });

  it('disables confirm, with an explanation, until the return is ledger-confirmed', async () => {
    withSession(<Dashboard />, fakeClient({ listRedemptions: vi.fn().mockResolvedValue([red({ state: 'RETURN_SUBMITTED' })]) }));
    const btn = await screen.findByRole('button', { name: /confirm fulfilment/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAccessibleDescription(/not confirmed on the ledger yet/i);
  });

  it('confirms, refreshes and announces the result', async () => {
    const client = fakeClient();
    (client.listRedemptions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([red()]).mockResolvedValueOnce([red({ state: 'FULFILLED' })]);
    withSession(<Dashboard />, client);
    await userEvent.click(await screen.findByRole('button', { name: /confirm fulfilment/i }));
    await waitFor(() => expect(client.confirmRedemption).toHaveBeenCalledWith('red_1'));
    expect(await screen.findByText(/confirmed as fulfilled/i)).toBeInTheDocument();
    expect(await screen.findByText('Fulfilled')).toBeInTheDocument();
  });

  it('shows the API error when confirmation is refused', async () => {
    withSession(<Dashboard />, fakeClient({ confirmRedemption: vi.fn().mockRejectedValue(new ApiClientError('SENSITIVE_ACTIONS_PAUSED', 'x', 423)) }));
    await userEvent.click(await screen.findByRole('button', { name: /confirm fulfilment/i }));
    expect(await screen.findByText(/paused while a ledger discrepancy/i)).toBeInTheDocument();
  });

  it('shows an alert when the API is unreachable', async () => {
    withSession(<Dashboard />, fakeClient({ listAssets: vi.fn().mockRejectedValue(new ApiClientError('NETWORK', 'x', 0)) }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the unbound api/i);
  });

  it('empty states are honest and refund-owed is flagged', async () => {
    withSession(<Dashboard />, fakeClient({ listAssets: vi.fn().mockResolvedValue([]), listRedemptions: vi.fn().mockResolvedValue([red({ state: 'REJECTED', refundDue: true })]) }));
    expect(await screen.findByText(/no eligible credit programs yet/i)).toBeInTheDocument();
    expect(screen.getByText(/refund owed to holder/i)).toBeInTheDocument();
  });

  it('sign-out calls logout, drops the session and returns to the sign-in form', async () => {
    const client = fakeClient();
    withSession(<Dashboard />, client);
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(client.logout).toHaveBeenCalled();
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
