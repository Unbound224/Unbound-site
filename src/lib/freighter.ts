/**
 * Browser-wallet (Freighter) signing for the merchant's escrow confirm/reject transactions.
 *
 * Fail-closed by design: the wallet must be installed, the user must approve access, the wallet must be on Testnet,
 * and the signature must come from the ISSUER account of the credit (the only key the escrow accepts). Anything else
 * is refused with a plain message, and the paste-a-signed-XDR path stays available.
 * The extension is imported lazily so server rendering and non-wallet browsers never load it.
 */
export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export class WalletError extends Error {}

type FreighterError = { message?: string } | string | undefined;
const msg = (e: FreighterError, fallback: string): string => (typeof e === 'string' ? e : e?.message || fallback);

export async function signWithFreighter(unsignedXdr: string, issuerPublicKey: string): Promise<string> {
  let api: typeof import('@stellar/freighter-api');
  try {
    api = await import('@stellar/freighter-api');
  } catch {
    throw new WalletError('The Freighter wallet library could not be loaded in this browser.');
  }
  const connected = await api.isConnected();
  if (connected.error || !connected.isConnected) throw new WalletError('Freighter is not installed or not available in this browser. Install it, or sign the transaction elsewhere and paste it below.');
  const access = await api.requestAccess();
  if (access.error) throw new WalletError(msg(access.error, 'Access to Freighter was not granted.'));
  if (access.address !== issuerPublicKey) {
    throw new WalletError('The selected Freighter account is not the issuer of this credit. Switch to the issuer account (' + issuerPublicKey.slice(0, 6) + '...' + issuerPublicKey.slice(-4) + ') and try again.');
  }
  const net = await api.getNetworkDetails();
  if (net.error) throw new WalletError(msg(net.error, 'Could not read the Freighter network.'));
  if (net.networkPassphrase !== TESTNET_PASSPHRASE) throw new WalletError('Freighter is not on Stellar Testnet. Switch the wallet network to Testnet; Unbound is Testnet-only.');
  const signed = await api.signTransaction(unsignedXdr, { networkPassphrase: TESTNET_PASSPHRASE, address: issuerPublicKey });
  if (signed.error || !signed.signedTxXdr) throw new WalletError(msg(signed.error, 'Signing was cancelled in Freighter.'));
  if (signed.signerAddress && signed.signerAddress !== issuerPublicKey) throw new WalletError('The transaction was signed by a different account than the issuer; it was not submitted.');
  return signed.signedTxXdr;
}
