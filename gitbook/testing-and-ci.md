# Testing and CI

## What runs on every push and pull request

All three repositories (Unbound-core, Unbound-stellar, Unbound-site) run the same `ci.yml` shape on GitHub Actions:

```yaml
- actions/checkout@v7
- actions/setup-node@v7 (node-version: 22, cache: npm)
- npm ci
- npm run lint
- npm run typecheck
- npm test
- npm run build
- npm audit --omit=dev --audit-level=high
```

This is exactly `npm run check` (lint + typecheck + test + build) plus a dependency audit gate — the same command a contributor runs locally before opening a PR, so CI never surprises anyone with a check they couldn't have run themselves.

## Contracts CI (Unbound-stellar only)

A second workflow, `contracts.yml`, covers the Rust side:

```yaml
soroban:
  - cargo fmt --all --check
  - cargo clippy --locked --all-targets -- -D warnings
  - cargo test --locked
  - cargo build --locked --release --target wasm32v1-none   # SOROBAN_SDK_BUILD_SYSTEM_SUPPORTS_SPEC_SHAKING_V2=1
  - upload-artifact: unbound-redemption-escrow-wasm
deploy-script:
  - bash -n scripts/deploy-testnet.sh
  - DRY_RUN=1 scripts/deploy-testnet.sh
  - '! STELLAR_NETWORK=mainnet scripts/deploy-testnet.sh'   # must fail
```

The last line is a real safety test: CI asserts that pointing the deploy script at `mainnet` **fails**, not just that the happy path works.

## Test counts, as of the last recorded run

| Repository | Suite | Count |
|---|---|---|
| Unbound-core | Vitest | 173 tests, 21 files |
| Unbound-stellar (TypeScript) | Vitest | 128 tests, 12 files |
| Unbound-stellar (contract) | `cargo test` | 24 tests |

See [Testing strategy and running against Testnet](development/testing-and-testnet.md) for what these suites actually cover and which test doubles are used where.

## Other repo-level checks

- **Dependabot** (`.github/dependabot.yml`) is configured in every repo for dependency update PRs.
- **A `pr-security.yml` workflow** runs on pull requests in every repo as a malware/secret-pattern gate.
- **A `docs.yml` workflow** exists in Unbound-core, Unbound-stellar and Unbound-site, coordinating with GitBook's own Git Sync for this documentation site.
- **CODEOWNERS** is set in each repo so pull requests get routed to the right reviewer.

## What CI does not do

- It does not deploy anything. Every real Testnet deployment and run recorded in [Testnet evidence](testnet-evidence.md) was triggered by a human (or an agent acting on the owner's behalf) running a script directly — `scripts/deploy-testnet.sh`, `scripts/testnet-smoke.ts`, `scripts/testnet-e2e.ts`, `scripts/testnet-exchange.ts` — not by a GitHub Actions job.
- It does not run browser end-to-end tests. Unbound-site's own status table lists "browser end-to-end tests in CI" as not built.
- It does not test against Mainnet, and the one place that could (the deploy script) is specifically tested to refuse it.
