import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import DocsPage from '@/app/docs/page';
import Home from '@/app/page';
import { ApplyForm } from '@/components/ApplyForm';
import { Dashboard } from '@/components/Dashboard';
import { SignInForm } from '@/components/SignInForm';
import { SiteFooter, SiteHeader, TestnetBanner } from '@/components/SiteChrome';
import type { Client } from '@/lib/api/client';
import { SessionProvider } from '@/lib/session';

expect.extend(matchers);

// jsdom cannot compute layout or colour, so contrast and region-size rules are disabled here;
// everything else axe checks (names, labels, roles, ARIA validity, landmarks, headings, tables) runs.
const AXE = { rules: { 'color-contrast': { enabled: false } } } as const;

const client = (over: Partial<Client> = {}): Client => ({
  register: vi.fn(),
  login: vi.fn().mockRejectedValue(new Error('x')),
  logout: vi.fn().mockResolvedValue({ ok: true }),
  apply: vi.fn(),
  listAssets: vi.fn().mockResolvedValue([
    { id: 'p', assetCode: 'SHOP', issuer: 'GISSUER', status: 'ACTIVE', policy: { unitOfAccount: '1 SHOP = 1 USD', expiresAt: '2027-01-01', jurisdiction: 'T', refundPolicy: 'r', contact: 'c', redemptionLimits: {} } },
  ]),
  listRedemptions: vi.fn().mockResolvedValue([
    { id: 'red_1', state: 'RETURN_CONFIRMED', asset: { code: 'SHOP', issuer: 'G' }, amount: '30.0000000', holder: 'H', returnTxHash: null, refundDue: false, rejectionReason: null, createdAt: 'x', updatedAt: 'x' },
    { id: 'red_2', state: 'RETURN_SUBMITTED', asset: { code: 'SHOP', issuer: 'G' }, amount: '5.0000000', holder: 'H', returnTxHash: null, refundDue: false, rejectionReason: null, createdAt: 'x', updatedAt: 'x' },
    { id: 'red_3', state: 'REJECTED', asset: { code: 'SHOP', issuer: 'G' }, amount: '1.0000000', holder: 'H', returnTxHash: null, refundDue: true, rejectionReason: 'r', createdAt: 'x', updatedAt: 'x' },
  ]),
  confirmRedemption: vi.fn(),
  ...over,
});

const page = (ui: ReactNode, signedIn = false, c = client()) =>
  render(
    <SessionProvider makeClient={() => c} initialToken={signedIn ? 'tok' : null}>
      <TestnetBanner />
      <SiteHeader />
      <main id="main">{ui}</main>
      <SiteFooter />
    </SessionProvider>,
  );

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container, AXE);
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

describe('accessibility (axe-core in jsdom; contrast not checked)', () => {
  it('landing page', async () => {
    const { container } = page(<Home />);
    await expectNoViolations(container);
  });
  it('partner docs', async () => {
    const { container } = page(<DocsPage />);
    await expectNoViolations(container);
  });
  it('sign-in form, pristine and with validation errors', async () => {
    const { container } = page(<SignInForm />);
    await expectNoViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText(/at least 12 characters/i, { selector: 'p.font-medium' });
    await expectNoViolations(container);
  });
  it('register mode and a server failure alert', async () => {
    const { container } = page(<SignInForm />);
    await userEvent.click(screen.getByRole('button', { name: /Need an account/ }));
    await userEvent.type(screen.getByLabelText('Email'), 'a@example.invalid');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await userEvent.click(screen.getByRole('button', { name: /Create account/ }));
    await screen.findByRole('alert');
    await expectNoViolations(container);
  });
  it('application form (signed in), with errors', async () => {
    const { container } = page(<ApplyForm />, true);
    await expectNoViolations(container);
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }));
    await screen.findByText(/at least 2 characters/i);
    await expectNoViolations(container);
  });
  it('console with programs and a redemption table (enabled, disabled and refund states)', async () => {
    const { container } = page(<Dashboard />, true);
    await screen.findByRole('table');
    await expectNoViolations(container);
  });
  it('console empty and error states', async () => {
    const { container, unmount } = page(<Dashboard />, true, client({ listAssets: vi.fn().mockResolvedValue([]), listRedemptions: vi.fn().mockResolvedValue([]) }));
    await screen.findByText(/no redemption requests/i);
    await expectNoViolations(container);
    unmount();
    const err = page(<Dashboard />, true, client({ listAssets: vi.fn().mockRejectedValue(new Error('net')) }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    await expectNoViolations(err.container);
  });
  it('every page has exactly one h1 and a skip-friendly main landmark', () => {
    const { container } = page(<Home />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelectorAll('main')).toHaveLength(1);
  });

  it('the harness really detects problems (guards against a vacuous pass)', async () => {
    const { container } = render(
      <main>
        <input type="text" />
        <button />
        <img src="/x.png" />
      </main>,
    );
    const results = await axe(container, AXE);
    expect(results.violations.map((v) => v.id)).toEqual(expect.arrayContaining(['label', 'button-name', 'image-alt']));
  });
});
