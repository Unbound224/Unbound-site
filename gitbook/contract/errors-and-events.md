# Errors and events

## Errors

`EscrowError` is a `#[contracterror]` enum (`repr(u32)`), so every refusal is a numbered on-chain error a caller (or a block explorer) can see directly, for example `Error(Contract, #6)`.

| Code | Name | Raised when |
|---|---|---|
| 1 | `AlreadyInitialized` | `init` called a second time |
| 2 | `NotInitialized` | Any state-changing or `admin`/getter call before `init` has run (except `is_paused`, which defaults to `false`) |
| 3 | `InvalidAmount` | `open_return` with `amount <= 0`, or an internal locked-total overflow |
| 4 | `DeadlineTooSoon` | `open_return` with a deadline less than `MIN_WINDOW_SECS` (1 hour) away |
| 5 | `DeadlineTooFar` | `open_return` with a deadline more than `MAX_WINDOW_SECS` (30 days) away |
| 6 | `DuplicateRedemption` | `open_return` reusing a `redemption_id` that was ever used before |
| 7 | `NotFound` | `confirm` / `reject` / `expire_refund` on an unknown `redemption_id` |
| 8 | `NotOpen` | `confirm` / `reject` / `expire_refund` on a return that already closed |
| 9 | `DeadlineNotReached` | `expire_refund` called before the deadline |
| 10 | `DeadlinePassed` | `confirm` called at or after the deadline |
| 11 | `IssuerMismatch` | `open_return` where `token`'s SAC admin is not the given `issuer` |
| 12 | `SameParty` | `open_return` where `consumer == issuer` |
| 13 | `Paused` | `open_return` while the contract is paused |

{% hint style="info" %}
These are exactly the numbers in `Unbound-stellar/contracts/redemption-escrow/src/lib.rs`. The real Testnet smoke run hit two of them directly: replaying a used redemption id refused with `Error(Contract, #6)` (`DuplicateRedemption`), and calling `expire_refund` before the deadline refused with `Error(Contract, #9)` (`DeadlineNotReached`). See [Testnet evidence](../testnet-evidence.md).
{% endhint %}

## Events

Every state-changing call emits a `#[contractevent]`. `redemption_id` is the `#[topic]` field on the four lifecycle events, so a watcher can filter by it.

| Event | Fields | Emitted by |
|---|---|---|
| `ReturnOpened` | `redemption_id` (topic), `consumer`, `issuer`, `token`, `amount`, `deadline` | `open_return` |
| `ReturnConfirmed` | `redemption_id` (topic), `issuer`, `amount` | `confirm` |
| `ReturnRejected` | `redemption_id` (topic), `consumer`, `amount` | `reject` |
| `ReturnExpired` | `redemption_id` (topic), `consumer`, `amount` | `expire_refund` |
| `PausedChanged` | `paused` | `set_paused` |

## How events are observed today

The contract emits real Soroban events, but `Unbound-stellar`'s indexer does not currently decode escrow events from Soroban RPC's `getEvents` (this is listed as not-yet-built in [ADR 0002](https://github.com/Unbound224/Unbound-stellar/blob/main/docs/adr/0002-soroban-redemption-escrow.md)'s consequences). Instead, every escrow call is an ordinary Stellar transaction with an ordinary hash, so the **existing** pending-hash watcher and reconciliation pipeline (the same one used for exchange settlements) confirms escrow actions by transaction hash, not by subscribing to the event stream. The events exist on-chain for anyone who wants to read them directly (for example with `stellar events` or Stellar Expert); Unbound itself just doesn't consume them yet.

## Auth summary

| Function | `require_auth()` on |
|---|---|
| `init` | the new admin |
| `open_return` | the consumer |
| `confirm` | the return's recorded issuer |
| `reject` | the return's recorded issuer |
| `expire_refund` | nobody — intentionally callable by anyone |
| `set_paused` | the admin |

Two design points worth calling out explicitly:

- **`expire_refund` has no caller restriction by design.** The transfer destination is fixed to the original consumer regardless of who calls it, so there is nothing a malicious caller could redirect. This is what lets a holder, a cron job, or a third party unblock a stuck refund.
- **`issuer.require_auth()` on `confirm`/`reject` is checked against the return's *stored* issuer**, not re-derived from the token. A caller cannot substitute a different issuer after the fact; the only way to change who confirms is to not have opened the return with that issuer in the first place, which `IssuerMismatch` already prevents at open time.
