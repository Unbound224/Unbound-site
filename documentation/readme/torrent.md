# Torrent

Torrent is a savings-circle protocol where every payout right is backed by money already locked in a Soroban contract. A member can trade the **date** they get paid, but cannot create an unfunded claim.

## Backing invariant

For a pool, the contract must never create or transfer a payout right unless the escrowed balance can cover the amount represented by every unclaimed right. This separates a tradable, verifiable claim from a promise that depends on future payments.

## Lifecycle

1. An organizer defines a circle or pool.
2. Contributions move into contract escrow.
3. The contract creates payout rights only when the backing condition holds.
4. Members transfer a right under contract rules.
5. A holder claims a matured right; the contract pays from escrow.
6. The indexer reconstructs events and reconciles its view with contract state.

## Components

| Repository                                                           | Owns                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| [Torrent-contracts](https://github.com/Torrent998/Torrent-contracts) | torrent-escrow Soroban contract and ABI                        |
| [Torrent-indexer](https://github.com/Torrent998/Torrent-indexer)     | Event ingestion, state reconstruction and reconciliation       |
| [Torrent-api](https://github.com/Torrent998/Torrent-api)             | Action validation and wallet-signable transaction construction |
| [Torrent-web](https://github.com/Torrent998/Torrent-web)             | Next.js app, wallet sign-in and project docs source            |

The contract is live on Testnet at [CBWF73FU…UIJG](https://stellar.expert/explorer/testnet/contract/CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG). The hosted app is [torrent-web1.vercel.app](https://torrent-web1.vercel.app). Use the [canonical Torrent documentation](https://github.com/Torrent998/Torrent-web/tree/main/gitbook) for worked examples, contract functions, events, API shapes, reconciliation and known gaps.
