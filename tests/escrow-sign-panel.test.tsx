import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EscrowSignPanel } from '@/components/EscrowSignPanel';
import type { Client } from '@/lib/api/client';
import type { Redemption } from '@/lib/api/schemas';
import { SessionProvider } from '@/lib/session';
import { allClientMocks } from './client-mocks';

const ISSUER = 'GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX';
const api = { isConnected: vi.fn(), requestAccess: vi.fn(), getNetworkDetails: vi.fn(), signTransaction: vi.fn() };
vi.mock('@stellar/freighter-api', () => api);

const redemption = (): Redemption =>
  ({
    id: 'red_1', state: 'RETURN_CONFIRMED', asset: { code: 'SHOP', issuer: ISSUER }, amount: '4.0000000', holder: 'GHOLDER', returnTxHash: null, refundDue: false, rejectionReason: null,
    mode: 'ESCROW', createdAt: 'x', updatedAt: 'x',
    escrow: { state: 'HELD', deadline: '2030-01-01T00:00:00.000Z', refundAvailable: false, pendingAction: 'CONFIRM', pendingXdr: 'AAAAUNSIGNED', pendingTxHash: 'a'.repeat(64) },
  }) as unknown as Redemption;

function setup() {
  const done = { ...redemption(), state: 'FULFILLED' } as Redemption;
  const submitEscrowAction = vi.fn().mockResolvedValue(done);
  const client = { ...allClientMocks(), submitEscrowAction } as unknown as Client;
  const onDone = vi.fn();
  render(
    <SessionProvider makeClient={() => client} initialToken="tok">
      <EscrowSignPanel redemption={redemption()} onDone={onDone} />
    </SessionProvider>,
  );
  return { submitEscrowAction, onDone };
}

beforeEach(() => {
  api.isConnected.mockResolvedValue({ isConnected: true });
  api.requestAccess.mockResolvedValue({ address: ISSUER });
  api.getNetworkDetails.mockResolvedValue({ networkPassphrase: 'Test SDF Network ; September 2015' });
  api.signTransaction.mockResolvedValue({ signedTxXdr: 'AAAASIGNEDENVELOPEBASE64ABCD', signerAddress: ISSUER });
});

describe('EscrowSignPanel: Freighter', () => {
  it('signs with the wallet and submits the signed envelope', async () => {
    const { submitEscrowAction, onDone } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Sign with Freighter' }));
    await waitFor(() => expect(submitEscrowAction).toHaveBeenCalledWith('red_1', 'AAAASIGNEDENVELOPEBASE64ABCD'));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows a plain error and submits nothing when the wallet account is not the issuer', async () => {
    api.requestAccess.mockResolvedValue({ address: 'GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX' });
    const { submitEscrowAction } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Sign with Freighter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not the issuer/i);
    expect(submitEscrowAction).not.toHaveBeenCalled();
    expect(api.signTransaction).not.toHaveBeenCalled();
  });

  it('keeps the paste-a-signed-XDR path working', async () => {
    const { submitEscrowAction } = setup();
    await userEvent.type(screen.getByLabelText('Signed transaction (XDR)'), 'AAAAPASTEDENVELOPEBASE64ABCD');
    await userEvent.click(screen.getByRole('button', { name: 'Submit signed transaction' }));
    await waitFor(() => expect(submitEscrowAction).toHaveBeenCalled());
  });
});
