# Testing strategy and running against Testnet

## What the test suites actually cover

| Repository | Suite | Scope |
|---|---|---|
| Unbound-core | Vitest, 173 tests in 21 files (`npm run check` exits 0) | Auth and lockout, MFA, password reset, CORS, every module's service logic, job locking, storage durability (restart tests), cross-repo tests that run against a real `Unbound-stellar` gateway **when the sibling checkout exists** |
| Unbound-stellar | Vitest, 128 TypeScript tests in 12 files | Amount parsing, quotes, gateway service and escrow client, Horizon mapping, indexer, issuer/trustline checks, ledger clock skew, settlement, the worker, XDR fixtures |
| Unbound-stellar contract | `cargo test`, 24 tests | Every function's happy path and refusal, auth checks, and a seeded randomized invariant test (24 runs × 60 steps, 2 credits, 3 consumers) proving `locked(token)` always equals the real escrow balance |

The **cross-repo tests** in Unbound-core are worth calling out: they're written to run against a real Unbound-stellar gateway process when that sibling repository is checked out next to it, not only against the fake gateway. That's a real integration test, not just a mock-based unit test, though it only runs when both repos are present on the same machine.

## Test doubles, named honestly

- `FakeStellarGateway` (core) — an in-memory stand-in for the real gateway, used by default so `npm run check` needs no network. It's the adapter behind the `StellarGateway` port, same interface as the real one.
- `FakeEscrow` — the in-memory escrow used with the fake gateway when `STELLAR_ESCROW_ENABLED=true` but no real contract is configured.
- `SimulatedLedger` (Unbound-stellar) — an in-memory ledger that still verifies real XDR signatures, sequence numbers and time bounds; used by `scripts/m1-demo.ts`. Its transaction hashes are **not** Testnet hashes.

None of these are described anywhere as production-equivalent; every README and status table that mentions them calls them out explicitly as test adapters, per the project's own ground rules.

## Golden fixtures

The contract's Rust tests produce golden XDR fixtures (`fixtures/soroban/redemption-escrow.v1.json`) that the TypeScript side decodes in its own tests — this is what keeps the Rust contract's encoding and the TypeScript gateway's decoding from silently drifting apart. The reconciliation event schema has its own fixture and JSON Schema (`fixtures/reconciliation-event.confirmed.v1.json`, `schemas/reconciliation-event.v1.json`) checked by `tests/xdr-fixtures.test.ts` and similar.

## Running against real Testnet

Three scripts in `Unbound-stellar` and `Unbound-core` actually touch live Stellar Testnet (not a fake):

| Script | Repo | What it does |
|---|---|---|
| `scripts/deploy-testnet.sh` | Unbound-stellar | Deploys the redemption-escrow contract (see [Build, test, deploy](../contract/build-test-deploy.md)) |
| `scripts/testnet-smoke.ts` | Unbound-stellar | Exercises the deployed contract directly: open/confirm, open/reject, a replayed id, a wrong-signer attempt, open/expire |
| `scripts/testnet-e2e.ts` | Unbound-core | Runs the full redemption flow through core's real HTTP API and a locally running gateway against Testnet |
| `scripts/testnet-exchange.ts` | Unbound-core | Runs a real exchange quote → intent → submit through core and the gateway against Testnet |

All of them sign with `stellar keys` aliases held in a local keystore, never a raw secret key pasted into a script or committed anywhere. Every result they produced is recorded with transaction hashes in [Testnet evidence](../testnet-evidence.md) — nothing on that page is a claim without a hash backing it.

## CI

See [Testing and CI](../testing-and-ci.md) for exactly what runs on every push and pull request.

{% hint style="warning" %}
No repository currently runs an automated test against **mainnet** or with real funds, and none should — Testnet-only is enforced in code (an unexpected network passphrase is refused), not just by convention.
{% endhint %}
