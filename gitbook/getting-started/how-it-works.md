# How it works

Unbound has three user-facing flows and one background loop. This page walks each one end to end. The state names are the real ones used by the API.

## The actors

| Actor | What they do | What they sign with |
|---|---|---|
| **Merchant** (issuer) | Issues store credit as a Stellar asset, publishes a signed redemption policy, answers redemptions | The Stellar issuer key, outside Unbound |
| **Holder** (consumer) | Holds credit, exchanges it, redeems it | Their own wallet key, on their device |
| **Reviewer** (admin) | Verifies merchants, handles disputes, watches jobs | A password, plus optional TOTP MFA |
| **Unbound** | Runs the API and the gateway. Builds unsigned transactions. Records state | Nothing. It holds no user or issuer keys |

## Flow 1: a merchant becomes usable

1. The merchant registers an account and applies with a legal name, jurisdiction and contact.
2. An admin reviews the application and verifies it with an **evidence reference** (a ticket or document id, never the document itself). The system never certifies a merchant by itself.
3. The merchant registers a **credit program**: an asset code, its issuer public key, and a **redemption policy** signed by that issuer key. The policy states face value, redemption limits, expiry, jurisdiction, refund policy and KYC requirements. It must say `tokenizationAuthorized: true` and `transferAllowed: true`.
4. Core checks the signature, the key match and the expiry. A program whose merchant is not `VERIFIED`, whose policy has expired, or whose program is suspended is **not eligible**.
5. Core pushes the list of eligible issuers to the gateway every 30 seconds (and at startup). The gateway refuses any asset that is not on that list.

## Flow 2: a holder exchanges credit

1. The holder proves ownership of a Stellar address by signing a one-time challenge. That opens a session that lasts one hour.
2. The portfolio endpoint lists their ledger balances, classified. Only credit from an eligible program counts as redeemable value.
3. The holder asks for a **quote**: source asset, target asset, amount, slippage in basis points, destination account. The gateway asks Horizon for strict-send paths and returns an expected amount, a minimum amount, a fee estimate and an expiry (60 seconds in the tests and the labeled fake gateway). No route means no quote.
4. The holder creates an **exchange intent** from the quote, with an `Idempotency-Key`. The intent comes back with an unsigned transaction.
5. The wallet decodes the transaction locally, checks it against the quote, asks for biometric approval and signs.
6. The signed transaction goes to `submit`. The gateway submits it and reports `CONFIRMED`, `FAILED` or `RECONCILING`. Only a ledger verdict moves the intent.

## Flow 3: a holder redeems credit

1. The holder asks to redeem an amount of a verified credit. Core tries the Soroban escrow first. If the escrow is unavailable, it builds a plain return payment instead and records `mode: NATIVE`.
2. In escrow mode the holder signs an `open_return` invocation. The credit moves into the escrow contract, keyed by a single-use redemption id, with a deadline (7 days by default, 1 hour to 30 days allowed).
3. Core shows the merchant a redemption queue. The merchant has three outcomes:
   - **Confirm** before the deadline. The credit goes to the issuer and is burned. The redemption is `FULFILLED`.
   - **Reject**, at any time while the return is open. The credit goes back to the holder. The redemption is `REJECTED` with `refundDue: false`.
   - **Do nothing.** After the deadline the holder (or anyone) triggers `expire_refund`. The credit goes back to the holder. The redemption is `EXPIRED`.
4. Confirm and reject are issuer-signed transactions. Core builds them unsigned, the merchant signs with the issuer key (in the browser with Freighter, or by pasting a signed envelope), and core submits. The state changes only when the ledger confirms.

## The background loop

Maintenance jobs run inside core:

| Job | Interval | What it does |
|---|---|---|
| `recover-stuck-intents` | 60 s | An intent `SUBMITTED` for more than 5 minutes becomes `RECONCILING` |
| `escalate-overdue-disputes` | 5 min | Escalates disputes the merchant has not answered in 7 days |
| `reconcile-escrows` | 2 min | Reads the contract for every held return and applies closes made outside core |
| `sync-trusted-assets` | 30 s | Pushes the eligible issuer list to the gateway |

A separate **chain worker** in the gateway repo watches pending transaction hashes against Horizon and posts reconciliation events to core.

## What can go wrong, in one table

| Situation | What Unbound does |
|---|---|
| Response lost after submit | The hash is already queued. The worker reports the verdict. Nothing is submitted twice |
| Quote expires before signing | The intent is refused with `QUOTE_EXPIRED` (HTTP 410) |
| Merchant never answers a redemption | Escrow deadline passes, then `expire_refund` returns the credit |
| Ledger and database disagree | Core pauses sensitive actions until a reviewer looks (`SENSITIVE_ACTIONS_PAUSED`, HTTP 423) |

See the [core security and operational notes](https://github.com/Unbound224/Unbound-core/blob/main/docs/SECURITY.md) for the full list.
