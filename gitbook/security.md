# Security

Unbound is **pre-release software that runs on Stellar Testnet with synthetic assets only.** There is no production deployment, no Mainnet deployment, and no real funds anywhere in this project. This page is the threat model and audit status; see each repo's own `SECURITY.md` for how to report a vulnerability.

## Core assets Unbound tries to protect

- End-user wallet authorization and secrets (which Unbound never holds)
- Canonical ledger truth, quotes and settlement state
- Merchant/issuer authority and the integrity of a verified merchant's representation
- Holder privacy and a safe account-recovery path

## Threats and what actually mitigates them

| Threat | Mitigation, and where it lives |
|---|---|
| Fake asset, issuer or merchant | Eligibility requires a `VERIFIED` merchant, an `ACTIVE` program, and an unexpired, issuer-signed policy — checked in `IssuerService.eligibility` on every quote, redemption and portfolio read |
| Stale quote shown as current | Quotes carry an explicit `expiresAt`; submitting against an expired one returns `QUOTE_EXPIRED` (410) |
| Transaction submitted, response lost | Idempotent reconciliation by transaction hash via the chain worker, never a blind resubmit — see [Failure modes](architecture/failure-modes.md) |
| Replay of a wallet challenge or a redemption id | Challenges are single-use and expire in 5 minutes (`CHALLENGE_INVALID` on reuse); the escrow's `redemption_id` is single-use forever on-chain (`DuplicateRedemption`) |
| Key compromise | Unbound never holds a user or issuer secret key, so there is no Unbound-side key to compromise; a password-reset revokes all of that account's sessions |
| Ledger/database disagreement (discrepancy) | `OperationsGuard` pauses new redemptions and exchanges (`SENSITIVE_ACTIONS_PAUSED`, 423) until a reviewer looks — see [Guide: auditor](guides/auditor.md) |
| Privacy leakage | No PII, contact data or commercial secrets go into on-chain metadata; verification stores an evidence *reference*, never the evidence document itself |
| Supply-chain | `npm audit --omit=dev --audit-level=high` runs in CI on every push; Dependabot is configured in `.github/dependabot.yml` in every repo |
| Client manipulation | The server validates every state transition and signed input; a client's claim about state is never trusted on its own |
| Wrong signer on an escrow action | Enforced on-chain by `require_auth()` in the contract itself (see [Contract functions](contract/functions.md)) — not just at the API layer |

## What is enforced where

| Layer | Enforces |
|---|---|
| Soroban contract | Who may call `confirm`/`reject` (the recorded issuer only), who may call `open_return` (the consumer), amount positivity, deadline bounds, single-use redemption ids, the locked-balance invariant |
| Unbound-core | Role checks (`user`/`merchant`/`admin`), ownership of a resource, idempotency-key conflicts, policy signature/schema validation, redemption-limit enforcement, the discrepancy pause |
| Unbound-stellar gateway | Trusted-asset allowlist (pushed from core every 30s), Testnet-only network passphrase, transaction building and submission, clock-skew detection against Horizon |
| Browser clients | Re-deriving the quote floor before signing, decoding and showing the unsigned transaction before the user signs it |

## What is explicitly not enforced, or not done

- **No external security audit.** Every `SECURITY.md` and status table in every repo says this plainly; the escrow contract specifically is called out as unaudited in its own doc comment (`lib.rs` line 19).
- **No rate limiting beyond login lockout.** The 5-attempts/15-minute lockout on `/v1/auth/login` is the only rate limit in the system today.
- **No PostgreSQL or managed database.** SQLite behind a `Storage` port is an interim store, explicitly "not for scale" per `Unbound-core`'s own README status table.
- **No MFA enrollment screen** in the merchant/reviewer console yet — MFA enroll/activate/disable is API-only.
- **No automated alerting** on a discrepancy or a paused state; a reviewer has to check `/healthz` or `GET /v1/admin/jobs`.
- **Freighter wallet signing for escrow actions** in the console is tested against a mocked wallet only, not a real Freighter install, as of this writing.
- **On-chain rejection of a wrong signer** was not demonstrated on the real Testnet smoke run — the wrong-signer attempts were refused client-side by `stellar-cli` before reaching the chain (no local key for the victim account existed to sign with). The contract's own auth enforcement is covered by its Rust tests instead; see [Testnet evidence](testnet-evidence.md) for exactly what that run did and didn't prove.

## Reporting a vulnerability

Each repository accepts private vulnerability reports through its GitHub **Security** tab (private vulnerability reporting), not public issues:

- [Unbound-core](https://github.com/Unbound224/Unbound-core/security)
- [Unbound-stellar](https://github.com/Unbound224/Unbound-stellar/security)
- [Unbound-site](https://github.com/Unbound224/Unbound-site/security)

There is no bug bounty program and no guaranteed SLA — this is a small, volunteer-maintained project that aims to acknowledge reports within 7 days. In scope: authorization bypass, signing something other than what the user approved, secret-key exposure, replay or double-spend paths, accepting a non-Testnet network or an unverified issuer, injection, and personal-data leaks. Out of scope: anything requiring a compromised device or maintainer account, denial of service against third-party infrastructure, and findings that only affect the clearly labelled test adapters (`FakeStellarGateway`, `FakeEscrow`, `SimulatedLedger`).

{% hint style="danger" %}
Never use real funds, real customer data, or Mainnet accounts while researching. This applies to vulnerability research the same as it does to normal use.
{% endhint %}
