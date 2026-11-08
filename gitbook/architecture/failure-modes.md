# Failure modes and recovery

Unbound's rule is simple to state and was actually followed under real Testnet runs: **nothing is settled until the ledger says so, and an unknown outcome is never guessed at.** This page lists the failure modes the code explicitly handles, plus the real bugs a live run found and how they were fixed — because a documentation page that only lists designed-for failures, and not ones actually hit, would be overclaiming.

## Designed-for failure modes

| Situation | What happens |
|---|---|
| HTTP response lost after a transaction was submitted | The transaction hash is already recorded. The chain worker independently watches it against Horizon and reports the verdict; nothing is ever resubmitted blindly. |
| A quote expires before the holder signs | The intent create/submit is refused with `QUOTE_EXPIRED` (HTTP 410); the holder must request a fresh quote. |
| A merchant never answers a redemption | In escrow mode, the deadline passes and the holder (or anyone) triggers `expire_refund`. In native mode, the credit was already burned on return, so a stuck case becomes a dispute instead. |
| The ledger and core's database disagree about an outcome (a **discrepancy**) | Core calls `OperationsGuard.assertNotPaused()` style checks before every sensitive action; once a discrepancy is recorded, new redemptions and exchanges refuse with `SENSITIVE_ACTIONS_PAUSED` (HTTP 423) until a reviewer looks. The `/healthz` endpoint reports `paused: true` while this is active. |
| A client retries a create/submit call | Every state-changing create/submit requires an `Idempotency-Key`; the same key with the same body returns the same record, a different body returns `IDEMPOTENCY_CONFLICT` (409). |
| The escrow contract is unavailable, unauthorized for an asset, or paused | Core catches the specific `ESCROW_*` gateway refusal and falls back to the native return payment automatically ([ADR 0002](https://github.com/Unbound224/Unbound-stellar/blob/main/docs/adr/0002-soroban-redemption-escrow.md)). The redemption's `mode` records which path was actually used. |
| An intent stays `SUBMITTED` too long (default 5 minutes) | The `recover-stuck-intents` job moves it to `RECONCILING` so it is visibly "unknown," not silently stuck. |
| A dispute's merchant response window lapses (7 days) | The `escalate-overdue-disputes` job flags it `ESCALATED` so a reviewer sees it without the holder having to chase. |
| An escrow redemption's on-chain state drifts from core's record (for example someone called `expire_refund` outside core) | The `reconcile-escrows` job (every 2 minutes) reads the contract directly and either applies the real close or records a `DISCREPANCY`. |

## What actually went wrong on a real Testnet run, and the fix

These are from the dated run log in `Unbound-stellar/docs/DEPLOYMENT.md` (2026-11-04), not hypothetical:

1. **`DATABASE_FILE=./data/dev.db` failed on first start** because the `data/` directory didn't exist yet. Fixed by creating the directory ahead of time; a real operational gap in the quick-start instructions, now called out in [Local setup](../development/local-setup.md).
2. **`syncTrustedAssets` was never actually called**, so the gateway's trusted-asset registry stayed empty and refused every asset with `asset SHOP is not from a verified issuer` — even though the asset had a perfectly valid verified program in core. Fixed by adding the `sync-trusted-assets` job (runs at startup and every 30 seconds) in core.
3. **A host clock 95 seconds behind Testnet** made every settlement fail with `tx_too_late`, because quote expiry and transaction time bounds are derived from the host clock. Fixed in the gateway by anchoring its clock to Horizon's own `Date` response header (`LedgerClock`), which now warns whenever skew exceeds 5 seconds — but the underlying host clock still needs fixing with NTP; the gateway's workaround does not fix the host.
4. **`HorizonClient.getTransaction` returned the stellar-sdk link *function* instead of the ledger number** (`ledger: expected number, received function`), which made the worker fail every tick until fixed to read `ledger_attr` instead.
5. **`stellar-cli` loads a `.env` from its current working directory**, which collided with the repo's own `.env` during the smoke script. Fixed by running the CLI from outside the repo.
6. **A smoke-script run aborted on a transient network error mid-flow**, leaving two test returns open on-chain; they were cleaned up by rejecting them afterward as a separate step. Those extra transactions exist on Testnet but are explicitly called out as not part of the recorded evidence log, rather than silently omitted.
7. **`amountOutActual` stays `null`** for an exchange intent that reaches `CONFIRMED` synchronously at submit time — only the asynchronous worker/reconciliation path currently fills it in. This is a known, disclosed gap, not a hidden one.

## Recovery procedures that exist today

- **Rebuild an indexer or worker view from a ledger cursor** and compare the projection against chain truth — this is how reconciliation already works, not a hypothetical.
- **Restore a database backup** only after re-running reconciliation against the chain for anything in flight, never by trusting the backup's state as final.
- **Never resubmit a transaction just because a client request timed out.** Every submit path keys off the transaction hash, not off "did my last HTTP call succeed."

## What is explicitly not handled yet

- There is no automated alerting on a `DISCREPANCY` or a paused state today; a reviewer has to check `GET /v1/admin/jobs` or notice `paused: true` on `/healthz`.
- Signing-key rotation, dependency outages, and load-based failure (rate limiting) are named as things to test in `docs/DEPLOYMENT.md`'s recovery checklist, but are not demonstrated by a real run the way the items above are. Treat them as untested, not as proven safe.
