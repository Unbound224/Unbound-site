import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signWithFreighter, TESTNET_PASSPHRASE, WalletError } from '@/lib/freighter';

const ISSUER = 'GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX';
const OTHER = 'GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX';

const api = {
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getNetworkDetails: vi.fn(),
  signTransaction: vi.fn(),
};
vi.mock('@stellar/freighter-api', () => api);

beforeEach(() => {
  api.isConnected.mockResolvedValue({ isConnected: true });
  api.requestAccess.mockResolvedValue({ address: ISSUER });
  api.getNetworkDetails.mockResolvedValue({ networkPassphrase: TESTNET_PASSPHRASE });
  api.signTransaction.mockResolvedValue({ signedTxXdr: 'SIGNED', signerAddress: ISSUER });
});

describe('signWithFreighter (fail closed)', () => {
  it('returns the signed envelope and asks the wallet to sign for the issuer on Testnet', async () => {
    await expect(signWithFreighter('UNSIGNED', ISSUER)).resolves.toBe('SIGNED');
    expect(api.signTransaction).toHaveBeenCalledWith('UNSIGNED', { networkPassphrase: TESTNET_PASSPHRASE, address: ISSUER });
  });

  it('refuses when Freighter is not installed', async () => {
    api.isConnected.mockResolvedValue({ isConnected: false });
    await expect(signWithFreighter('X', ISSUER)).rejects.toThrow(/not installed/);
    expect(api.signTransaction).not.toHaveBeenCalled();
  });

  it('refuses when the user denies access', async () => {
    api.requestAccess.mockResolvedValue({ address: '', error: { message: 'User declined access' } });
    await expect(signWithFreighter('X', ISSUER)).rejects.toThrow(/declined/);
    expect(api.signTransaction).not.toHaveBeenCalled();
  });

  it('refuses when the selected account is not the credit issuer', async () => {
    api.requestAccess.mockResolvedValue({ address: OTHER });
    await expect(signWithFreighter('X', ISSUER)).rejects.toThrow(/not the issuer/);
    expect(api.signTransaction).not.toHaveBeenCalled();
  });

  it('refuses when the wallet is not on Testnet', async () => {
    api.getNetworkDetails.mockResolvedValue({ networkPassphrase: 'Public Global Stellar Network ; September 2015' });
    await expect(signWithFreighter('X', ISSUER)).rejects.toThrow(/Testnet/);
    expect(api.signTransaction).not.toHaveBeenCalled();
  });

  it('surfaces a cancelled signature and rejects a signature from a different account', async () => {
    api.signTransaction.mockResolvedValue({ signedTxXdr: '', signerAddress: '', error: { message: 'User rejected the request' } });
    await expect(signWithFreighter('X', ISSUER)).rejects.toThrow(/rejected/);
    api.signTransaction.mockResolvedValue({ signedTxXdr: 'SIGNED', signerAddress: OTHER });
    await expect(signWithFreighter('X', ISSUER)).rejects.toBeInstanceOf(WalletError);
  });
});
