# Contract functions

Every public function of `RedemptionEscrow`, copied from and checked against `Unbound-stellar/contracts/redemption-escrow/src/lib.rs`. Types are Soroban SDK types (`Address`, `BytesN<32>`, `i128`, `u64`, `bool`).

## `init`

```rust
pub fn init(env: Env, admin: Address)
```

| | |
|---|---|
| **Who may call** | Anyone, but only once ever |
| **Auth required** | `admin.require_auth()` |
| **Effect** | Stores `admin` and sets `paused = false`. One-time initialization. |
| **Errors** | `AlreadyInitialized` if called a second time |

The admin set here can only pause or unpause **new** returns later (`set_paused`). It can never move escrowed funds — there is no admin withdrawal path anywhere in the contract.

## `open_return`

```rust
pub fn open_return(
    env: Env,
    consumer: Address,
    issuer: Address,
    token: Address,
    amount: i128,
    redemption_id: BytesN<32>,
    deadline: u64,
)
```

| | |
|---|---|
| **Who may call** | The consumer (holder) returning credit |
| **Auth required** | `consumer.require_auth()` |
| **Effect** | Transfers `amount` of `token` from the consumer into the contract (via the token's SAC `transfer`); stores an `Open` `EscrowedReturn` record keyed by `redemption_id`; adds `amount` to `locked(token)`; emits `ReturnOpened` |
| **Parameters** | `consumer` — the holder returning credit. `issuer` — must equal the token's SAC admin (its real issuer), checked on-chain. `token` — the asset's Stellar Asset Contract address, not a wrapper. `amount` — must be positive. `redemption_id` — sha256 of core's redemption id; single-use forever. `deadline` — unix seconds; must be `MIN_WINDOW_SECS` (1 hour) to `MAX_WINDOW_SECS` (30 days) from now. |
| **Errors** | `Paused` if the contract has paused new opens · `InvalidAmount` if `amount <= 0` · `SameParty` if `consumer == issuer` · `DeadlineTooSoon` / `DeadlineTooFar` if the deadline is outside the allowed window · `DuplicateRedemption` if `redemption_id` was ever used · `IssuerMismatch` if `token`'s SAC admin is not `issuer` (fail closed: a non-SAC token without an `admin()` also traps here) |

## `confirm`

```rust
pub fn confirm(env: Env, redemption_id: BytesN<32>)
```

| | |
|---|---|
| **Who may call** | The issuer recorded on that return |
| **Auth required** | `r.issuer.require_auth()` |
| **Effect** | Transfers the escrowed amount to the issuer (a SAC transfer to the asset's own issuer burns it); marks the return `Confirmed`; subtracts from `locked(token)`; emits `ReturnConfirmed` |
| **Must be called** | Before `deadline` |
| **Errors** | `NotFound` if the id doesn't exist · `NotOpen` if the return isn't `Open` (already closed) · `DeadlinePassed` if called at or after the deadline |

## `reject`

```rust
pub fn reject(env: Env, redemption_id: BytesN<32>)
```

| | |
|---|---|
| **Who may call** | The issuer recorded on that return |
| **Auth required** | `r.issuer.require_auth()` |
| **Effect** | Transfers the escrowed amount back to the consumer; marks the return `Rejected`; subtracts from `locked(token)`; emits `ReturnRejected` |
| **May be called** | At any time while the return is `Open` — there is no deadline restriction, since a reject only ever benefits the consumer |
| **Errors** | `NotFound` · `NotOpen` |

## `expire_refund`

```rust
pub fn expire_refund(env: Env, redemption_id: BytesN<32>)
```

| | |
|---|---|
| **Who may call** | **Anyone** — no auth check on the caller at all |
| **Auth required** | None (the transfer target is fixed to the original consumer, so there is nothing to authorize) |
| **Effect** | Transfers the escrowed amount back to the consumer; marks the return `Expired`; subtracts from `locked(token)`; emits `ReturnExpired` |
| **Must be called** | At or after `deadline` |
| **Errors** | `NotFound` · `NotOpen` · `DeadlineNotReached` if called before the deadline |

This is the function that makes the "cannot strand the holder" guarantee hold even if the holder's own client never calls back — anyone (a cron job, another user, a block explorer script) can trigger the refund once it's due.

## `set_paused`

```rust
pub fn set_paused(env: Env, paused: bool)
```

| | |
|---|---|
| **Who may call** | The admin set in `init` |
| **Auth required** | `admin.require_auth()` |
| **Effect** | Sets the paused flag; emits `PausedChanged` |
| **What pausing does and does not do** | Blocks only **new** `open_return` calls. `confirm`, `reject` and `expire_refund` keep working while paused — an already-open return is never frozen. |

## Read-only getters

| Function | Signature | Returns |
|---|---|---|
| `get_return` | `fn get_return(env: Env, redemption_id: BytesN<32>) -> Option<EscrowedReturn>` | The full record (consumer, issuer, token, amount, deadline, opened_at, status, closed_at), or `None` |
| `locked` | `fn locked(env: Env, token: Address) -> i128` | Total amount of `token` currently held across all open returns |
| `admin` | `fn admin(env: Env) -> Address` | The admin address; panics `NotInitialized` if `init` was never called |
| `is_paused` | `fn is_paused(env: Env) -> bool` | The current paused flag. Returns `false` by default if `init` was never called, unlike every other function, which panics `NotInitialized`. |

## Storage layout

| Key | Storage type | Holds |
|---|---|---|
| `Admin` | instance | The admin address |
| `Paused` | instance | The pause flag |
| `Return(redemption_id)` | persistent | One `EscrowedReturn` record per redemption id, forever (TTL-bumped) |
| `Locked(token)` | persistent | Running total locked for that token, used for the invariant check |

Instance storage is extended 30 days at a time (bumped when within 1 day of expiry); return and locked-total records are extended 120 days at a time (bumped within 7 days of expiry) — long enough that a single-use redemption id stays observable well past any realistic dispute window.

## The invariant

For every token, **`locked(token) == sum of amount for every `Open` return of that token`**, and the contract's real SAC balance for that token always equals `locked(token)`. This is enforced by construction (every code path that changes a return's status also updates `locked` in the same call) and checked by a seeded randomized test over 24 runs of 60 steps with 2 credits and 3 consumers (`src/test.rs`).
