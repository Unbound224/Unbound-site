# Verified Testnet evidence

Everything on this page happened on **Stellar Testnet** with throwaway accounts and synthetic credit, on 2026-11-04, and is copied from the dated run log in `Unbound-stellar/docs/DEPLOYMENT.md` (which also holds the raw JSON evidence files this page summarizes). No external audit has been done. Nothing here involves real funds.

{% hint style="info" %}
Every transaction hash below was independently checked as `successful` on Horizon before being recorded, and links to its Stellar Expert page so anyone can verify it directly.
{% endhint %}

## Contract deployment

Deployed with `scripts/deploy-testnet.sh` (stellar-cli 27.1.0).

| Item | Value |
|---|---|
| Contract id | [`CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C`](https://stellar.expert/explorer/testnet/contract/CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C) |
| Wasm hash | `37726f8c76df9302c8c6923104fb7fd884a6ceb2ead6b1933b3bf5f30f7c415a` |
| Admin (public) | `GC4OYFENIRHVPAZIAFRPVUJRC37UGWNZOWGYW3CDGBYYIGLI5S5E467O` |
| Deployed at | 2026-11-04T10:20:28Z |
| Upload tx | [`f4c594da02…`](https://stellar.expert/explorer/testnet/tx/f4c594da02264172e2cc7e325622329e8d2820f8abc5680c07057a82a0d7be12) |
| Deploy tx | [`1c827ee3ed…`](https://stellar.expert/explorer/testnet/tx/1c827ee3ed78890545716540160f2e87b1f81b0b8cb5e3d2461e2ca246aac36f) |
| `init` tx | [`23e600cd69…`](https://stellar.expert/explorer/testnet/tx/23e600cd69599455b7be3b016925b925198d8960f1c9d06df620bb73e0c081be) |

**What this proves:** the contract compiles, deploys and initializes on real Testnet, and the deploy script's own read-back check (`admin()` must match) passed — it ran on the first attempt with no script changes. **What it does not prove:** correctness under adversarial load, or anything about a real audit (there hasn't been one).

## Test credit asset (SHOP)

| Item | Value |
|---|---|
| Issuer | `GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX`, confirmed on Horizon with `auth_required: true, auth_revocable: true` |
| Distributor | `GAOEO57YBDDCJGTNUTD7CFFA6OIZUW44RQ7GN6MEJ4VDXXFFLEVZ5FPC`, held 1000 SHOP, authorized |
| Consumer | `GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX`, funded with 100 SHOP |
| Stellar Asset Contract | `CBGICNAOTEYV4ZMZFHEWM5MD6VTV6NXLVEXLJP6R7OI7HDMESPXEYCK7` |
| Escrow authorized on the SAC | [SAC deploy `63f4ba754f…`](https://stellar.expert/explorer/testnet/tx/63f4ba754ffac62aec50af2e2fe50a6a0c545fb2b1b15e148b675bdb53b4598d), [`set_authorized` `309d4fabbe…`](https://stellar.expert/explorer/testnet/tx/309d4fabbe47c6eb5dd42bf4c3efa7f3f08736ec5e215578f157b5430a652e20) |

**What this proves:** a real issuer with `AUTH_REQUIRED`/`AUTH_REVOCABLE` set, and the one-time authorization step every issuer needs before escrow mode can hold its credit. The set-options, trustline and payment transactions behind this table were checked by their effect on Horizon, but their individual hashes were not captured — a real, disclosed gap in the record rather than an invented one.

## Escrow smoke run (`scripts/testnet-smoke.ts`)

Raw evidence: `Unbound-stellar/contracts/deployments/testnet-smoke.json`.

| Step | Result | Tx |
|---|---|---|
| `open_return` (to be confirmed) | ok | [`ed82231098…`](https://stellar.expert/explorer/testnet/tx/ed82231098cf13676478d8e05e5acdd08da3d20098fab30b2831d90569be0d93) |
| `confirm` by the issuer | ok | [`8af95ad4e2…`](https://stellar.expert/explorer/testnet/tx/8af95ad4e234b4e14721f39198d464a958900b578c8870c570eef6a8a0a51c05) |
| Replay of a used redemption id | refused on-chain, `Error(Contract, #6)` | n/a |
| `open_return` (to be rejected) | ok | [`3e7340d46a…`](https://stellar.expert/explorer/testnet/tx/3e7340d46afba56df18895cee8aec421a3bf00bda6adc2c8bfe7ae91a5f83dcb) |
| `reject` by the issuer | ok | [`3a05c7b222…`](https://stellar.expert/explorer/testnet/tx/3a05c7b222cb02752cf2fc968d2ec263c20e438a8a6069e960ad81bea4320b07) |
| `open_return` (wrong-signer target) | ok | [`5ca68b9841…`](https://stellar.expert/explorer/testnet/tx/5ca68b98413a2bdb090be80fd6cdc3d50bbb6ff25bd4ce2cbb182fa58f1ca84b) |
| `confirm` signed by the consumer, not the issuer | refused **client-side** by `stellar-cli` ("Missing signing key") | n/a |
| `open_return` naming a victim account, signed by the issuer | refused **client-side** by `stellar-cli` | n/a |
| `reject` (cleanup) | ok | [`0134ea6a4b…`](https://stellar.expert/explorer/testnet/tx/0134ea6a4b90f556a4e4a23c96a29e85135055956e2a45db701cbc27e6811ea2) |
| `open_return` (to be refunded by expiry) | ok, deadline 2026-11-04T12:03:06Z | [`573ee85ba2…`](https://stellar.expert/explorer/testnet/tx/573ee85ba2eb2e00cd0c37c9d097ee1ee256ea534ede42429eb937f5ef6202be) |
| `expire_refund` before the deadline | refused on-chain, `Error(Contract, #9)` | n/a |
| `expire_refund` after the deadline (follow-up, same day) | ok | [`191ab9acee…`](https://stellar.expert/explorer/testnet/tx/191ab9aceee9d05c6426024064a0d2c641bc456a6bcb3bf38b52c671d0c401a4) (ledger 5557247) |

**What this proves:** every one of the contract's three closing paths (confirm, reject, expire) actually works on real Testnet, and two real on-chain refusals (`#6` duplicate id, `#9` early expiry) match the error codes in the source exactly.

**What this does not prove:** on-chain rejection of a genuinely wrong signer. Both wrong-signer rows were refused by `stellar-cli` *before* reaching the chain, because `stellar-cli` signs with any key in its local keystore and the "victim" account's key had been created in a throwaway config directory and deleted — there was no key available to even attempt a bad signature with. This is disclosed explicitly rather than presented as an on-chain result; on-chain auth enforcement for a wrong signer is covered instead by the contract's own Rust tests, not by this live run.

## Live backend run: core → gateway → Testnet escrow

Run with `Unbound-core/scripts/testnet-e2e.ts` against a local gateway (`ESCROW_CONTRACT_ID` = the contract above) and core (`STELLAR_ESCROW_ENABLED=true`, `ESCROW_WINDOW_HOURS=2`). Merchant, policy and wallet sessions came from core's real HTTP API with synthetic data; the issuer and holder signed with Testnet keys in the local `stellar-cli` keystore. Raw evidence: `contracts/deployments/testnet-e2e.json`.

| Step | Core state | Tx |
|---|---|---|
| Holder returns 4 SHOP into escrow | `RETURN_CONFIRMED`/`HELD` | [`0c9b01b583…`](https://stellar.expert/explorer/testnet/tx/0c9b01b583a68df7a6123c1439ec29fa92375eedba41ae78cc899a9727d8f0d2) |
| Merchant confirms (issuer-signed) | `FULFILLED`/`RELEASED` | [`92eab2cd49…`](https://stellar.expert/explorer/testnet/tx/92eab2cd492451d1e34669d8c0d97a853d806cf6f99399630ae03af29bf258fa) |
| Holder returns 3 SHOP into escrow | `RETURN_CONFIRMED`/`HELD` | [`3beacc887d…`](https://stellar.expert/explorer/testnet/tx/3beacc887d25fcf03e41ee1ff8afd1b452c99de5bdf4207ce7ad32a008301176) |
| Merchant rejects — refunded on-chain | `REJECTED`/`REFUNDED` | [`88a492dd86…`](https://stellar.expert/explorer/testnet/tx/88a492dd8613d69bfda76dbc80bf40864c93eb7571db805cecf424640a4e9187) |
| Holder returns 2 SHOP into escrow, left to expire | `RETURN_CONFIRMED`/`HELD` | [`4c44a2c7dc…`](https://stellar.expert/explorer/testnet/tx/4c44a2c7dcf42390a3da5fd9901a48e7a0691fb9eba20e04eece74ae636cabf3) |
| Holder's timeout refund (follow-up, same day) | `EXPIRED`/`EXPIRED_REFUNDED` | [`57eef54681…`](https://stellar.expert/explorer/testnet/tx/57eef54681b43d3164e3feb9449f9f8d0154475aabbba03a59a0118101a8c4d8) (ledger 5557218) |

**Bugs this run found and fixed**, in `Unbound-core`: `DATABASE_FILE=./data/dev.db` failing because the directory didn't exist; `syncTrustedAssets` never actually being called, leaving the gateway's registry empty. Both are detailed in [Failure modes](architecture/failure-modes.md). **What this proves:** the full redemption escrow path (open → hold → confirm/reject/expire) works end to end through the real HTTP API and gateway, not just against the contract directly.

## Live exchange run: SHOP to USDC through the DEX

New issuer `unbound-usdc-issuer` (`GCHGR7UN3XYKUEZJAZ74QSXAJOB7DIOGFVDS5KD3LDMNQVBO3HHOU5QF`) issued USDC; distributor `GAOEO57YBDDCJGTNUTD7CFFA6OIZUW44RQ7GN6MEJ4VDXXFFLEVZ5FPC` posted a DEX offer (#941249) selling 5000 USDC for SHOP at 1:1. Core registered USDC as a swap target via `POST /v1/admin/targets`.

| Run | Tx | Ledger |
|---|---|---|
| 1 | [`5dcd472352…`](https://stellar.expert/explorer/testnet/tx/5dcd472352b8d9e704ca0c933de35c8bea50b6a82d7a25136504470cc7b9de2c) | 5557441 (SHOP -5, USDC +5, two trades) |
| 2 | [`5879422d5f…`](https://stellar.expert/explorer/testnet/tx/5879422d5f67f3388f26f525a7cadaa9640eaa1c521fed272de3fc3dfbe775e1) | 5557552 |

**Known, disclosed gap:** `amountOutActual` stays `null` for an intent confirmed synchronously at submit — only the asynchronous worker/reconciliation path fills it in.

## Gateway worker and clock bugs found by this run

The gateway worker, started with an admin session token for core (obtained by logging in, never stored), resolved a queued already-confirmed hash against live Horizon with no dead letters and no errors. Two real bugs were found and fixed in the process:

1. A host clock **95 seconds behind Testnet** made every settlement fail `tx_too_late` (quote expiry and transaction `maxTime` derive from the host clock). Fixed by anchoring the gateway's clock to Horizon's own `Date` response header (`LedgerClock`, now warns past 5 seconds of skew) — the underlying host clock still needed fixing separately with NTP.
2. `HorizonClient.getTransaction` was returning the stellar-sdk **link function** instead of the ledger number in its `ledger` field, surfacing as `ledger: expected number, received function`. Fixed to read `ledger_attr` instead.

## Summary: what this evidence does and doesn't establish

| Claim | Status |
|---|---|
| The redemption-escrow contract is deployed and callable on Testnet | **Proven**, with transaction hashes |
| All three contract exits (confirm, reject, expire) work on real Testnet | **Proven** |
| The contract refuses a replayed id and an early expiry on-chain | **Proven**, with the exact error codes |
| The contract refuses a genuinely wrong signer on-chain | **Not demonstrated by this run** — covered by Rust unit tests only |
| Core's redemption flow drives the real contract end to end through the HTTP API | **Proven** |
| A real exchange settles through core, the gateway, and the Testnet DEX | **Proven** |
| The contract has been externally audited | **False.** No audit has occurred |
| Any of this has been tried on Mainnet or with real funds | **False**, and the code refuses to |
