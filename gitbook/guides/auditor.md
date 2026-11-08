# Guide: auditor / reviewer

You're an admin reviewing merchants, handling disputes, and watching the system stay consistent. This guide covers the reviewer console (`/admin`) and the admin API it calls. "Auditor" here means the operational reviewer role Unbound actually has today (`admin`) — there is no separate read-only compliance role in the code.

## Signing in

Admin accounts use email and password like merchants, with an optional second factor:

- `POST /v1/auth/login` — if your account has TOTP enabled, the response requires a `code` field too (`MFA_REQUIRED` if you omit it on a protected account).
- Enrolling MFA: `POST /v1/auth/mfa/enroll` returns a secret and an `otpauth://` URI once; scan it with any TOTP app, then `POST /v1/auth/mfa/activate` with a 6-digit code to turn it on. Disabling requires a currently valid code too (`POST /v1/auth/mfa/disable`) — a stolen session token alone cannot remove your second factor.

{% hint style="info" %}
As of this writing there is no enrollment **screen** in the console yet — MFA enrollment is API-only. The login flow itself is built and tested.
{% endhint %}

## Reviewing merchants

`GET /v1/admin/merchants` lists every merchant and its status. For each application:

- **Verify**: `POST /v1/admin/merchants/{id}/verify` with an **evidence reference** — a ticket or document id. You never upload or store the underlying document in Unbound; you record a pointer to where you (or your organization) keeps the real evidence. The system itself does not and cannot independently confirm a business's legal identity.
- **Revoke**: `POST /v1/admin/merchants/{id}/revoke` with a reason. This immediately suspends **every** credit program that merchant has registered — there is no partial revocation.

A revoked merchant must re-apply from scratch; verification does not carry over.

## Managing swap targets

Not every asset holders exchange into is credit. `POST /v1/admin/targets` adds a Stellar asset (code + issuer) as something holders may receive in an exchange, without it being redeemable store credit. The current list is public at `GET /v1/targets`.

## Disputes

`GET /v1/disputes` lists everything visible to you (as admin, that's all of them). When a dispute needs a ruling:

`POST /v1/admin/disputes/{id}/resolve` with `outcome: FOR_HOLDER` or `FOR_MERCHANT` and a note. This **records a decision; it does not move funds.** If you rule for the holder on a native-mode redemption, the merchant still has to actually issue the refund off-chain — your ruling is the record of what should happen, not an instruction the ledger executes. Disputes that aren't responded to within 7 days are auto-escalated by the `escalate-overdue-disputes` job so you see them without the holder having to chase.

## Watching the system

`GET /v1/admin/jobs` shows the status of every scheduled maintenance job:

| Job | Interval | What it watches |
|---|---|---|
| `recover-stuck-intents` | 60 s | Exchange intents stuck `SUBMITTED` too long become `RECONCILING` |
| `escalate-overdue-disputes` | 5 min | Disputes past their merchant response window |
| `reconcile-escrows` | 2 min | Escrow redemptions, against the contract's own state |
| `sync-trusted-assets` | 30 s | Pushes the current eligible-issuer list to the Stellar gateway |

`POST /v1/admin/jobs/{name}/run` runs any of them immediately (it never overlaps a run already in progress — there's a single-flight lock). If you see `paused: true` on `GET /healthz`, a reconciliation discrepancy has paused new redemptions and exchanges; that's your cue to go looking for what disagreed, not something that clears itself.

## What you're not able to do

You cannot move escrowed funds, touch a holder's wallet key, or override a ledger-confirmed outcome by editing a database record — there is no such endpoint, by design. Your authority is over who gets to participate (merchant verification) and how disagreements get recorded (disputes), never over the ledger's own truth.

{% hint style="warning" %}
This review workflow has not been audited and runs on Testnet with synthetic merchants and disputes. Treat every evidence reference and ruling on a live Testnet instance as test data, because that's what it is.
{% endhint %}
