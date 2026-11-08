# Glossary

| Term | Meaning |
|---|---|
| **Credit** | A classic Stellar issued asset `(code, issuer)` that a verified merchant has registered a program for. Not every Stellar asset is credit; see [Credit, issuers and policies](credit-and-issuers.md). |
| **Holder** | The consumer who holds credit, in the API a `user`. Authenticates with a Stellar wallet challenge, never a password. |
| **Merchant / issuer** | The business that issued the credit asset and signs its redemption policy with the issuer's Stellar key. In the API, a `merchant` account (email + password, optional nothing extra). |
| **Admin / reviewer** | Verifies merchants, resolves disputes, watches maintenance jobs. An `admin` account, optionally with TOTP MFA. |
| **Redemption policy** | The signed JSON document an issuer publishes stating face value, limits, expiry, jurisdiction and refund terms for a credit program. |
| **Credit program** | A merchant's registration of one `(code, issuer)` pair plus its policy. States: `ACTIVE`, `SUSPENDED`. |
| **Eligible / redeemable** | An asset is eligible only when its merchant is `VERIFIED`, its program is `ACTIVE`, and its policy is unexpired and valid. |
| **Supported target** | A Stellar asset a holder can receive in an exchange. Not credit, not redeemable, added by an admin. |
| **Quote** | An indicative, expiring price for an exchange, built from a real Horizon strict-send path. Never a guarantee. |
| **Exchange intent** | The server-side record of one swap from credit to a target asset, moving through `DRAFT` → ... → `CONFIRMED`/`FAILED`/`CANCELLED`. See [Exchange intents](exchange-intents.md). |
| **Redemption** | A holder returning credit to the issuer for fulfilment. Moves through `AWAITING_RETURN` → ... → `FULFILLED`/`REJECTED`/`EXPIRED`/`FAILED`. See [Redemption lifecycle](redemption-lifecycle.md). |
| **NATIVE mode** | A redemption return made as a plain Stellar payment to the issuer (burned on arrival). A rejection after the fact leaves an off-chain `refundDue` obligation. |
| **ESCROW mode** | A redemption return held in the Soroban redemption-escrow contract instead of paid directly to the issuer, so a rejection or timeout refunds on-chain. |
| **Redemption escrow** | The one Soroban contract Unbound uses (`contracts/redemption-escrow` in Unbound-stellar). See [Contract overview](../contract/overview.md). |
| **Reconciliation** | Matching a submitted transaction's ledger outcome (by hash) back to the record that is waiting on it. The only way `SUBMITTED`/`RECONCILING` states resolve. |
| **Discrepancy** | When the ledger's verdict disagrees with what core already recorded. Core pauses sensitive actions until a reviewer looks (`SENSITIVE_ACTIONS_PAUSED`, HTTP 423). |
| **Idempotency key** | A client-supplied key (8-128 characters) that makes a create/submit request safe to retry: the same key and body returns the same record; a different body returns `IDEMPOTENCY_CONFLICT`. |
| **Gateway** | The Unbound-stellar HTTP service that core talks to for quotes, transaction building, submission and the escrow. Bearer-token protected, not public. |
| **Chain worker** | A background process in Unbound-stellar that watches pending transaction hashes against Horizon and reports reconciliation events to core. |
| **Horizon** | Stellar's classic REST API for accounts, trades, paths and transaction history. |
| **Soroban RPC** | Stellar's smart-contract RPC, used only for the redemption escrow. |
| **Stroop** | The base unit of a Stellar amount: 1 unit = 10,000,000 stroops. All API amounts are decimal strings with exactly 7 places. |
| **SAC** | Stellar Asset Contract — the Soroban-side token interface every classic Stellar asset has. The escrow moves credit through an asset's SAC rather than wrapping it in a new token. |
| **AUTH_REQUIRED / AUTH_REVOCABLE** | Stellar issuer account flags. `AUTH_REQUIRED` means the issuer must authorize each holder's trustline; `AUTH_REVOCABLE` lets the issuer withdraw that authorization later. Unbound credit is issued with both set. |
| **Testnet** | The only network Unbound runs on. Any request naming another network passphrase is refused. |

{% hint style="info" %}
State names, error codes and field names on this page are copied from the TypeScript source in `Unbound-core` (`src/modules/*/service.ts`, `src/common/errors.ts`) and the Rust contract in `Unbound-stellar` (`contracts/redemption-escrow/src/lib.rs`), not invented for the docs.
{% endhint %}
