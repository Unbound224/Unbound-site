# Contributing

Unbound takes part in the [Stellar Wave Program](https://www.drips.network/wave/stellar) on Drips: monthly one-week contribution sprints where contributors earn points for merged PRs on maintainer-listed issues, and points split a reward pool. This page explains how that actually works across the four repositories; each repository's own `CONTRIBUTING.md` has the repo-specific setup commands.

## Ground rules, every repository

- **Financial truth first.** Never show money as settled before the ledger confirms it. Never claim liquidity, partners, store listings or Mainnet availability that don't exist.
- **Testnet and synthetic data only.** No real funds, real customer data or secret keys in code, tests, fixtures, screenshots or issues.
- **Show real work.** Screenshots come from the real software; test adapters (`FakeStellarGateway`, `SimulatedLedger`, and similar) are always labelled as test adapters, never presented as the real thing.
- **Test the failure paths**, not only the happy path — this project's own Testnet runs found real bugs precisely because failure paths were exercised; see [Failure modes](architecture/failure-modes.md).

## Finding and claiming work

Issues live in each repository's issue tracker, labelled `Stellar Wave` plus an area label (`frontend`, `backend`, `contracts`, `documentation`, `security`, and similar) and exactly one complexity label:

| Label | Meaning | Wave points |
|---|---|---|
| `trivial` | Small, clearly bounded change with obvious acceptance criteria | 100 |
| `medium` | Standard feature or logic touching several parts of the codebase | 150 |
| `high` | Complex engineering — an integration or an architectural change | 200 |

Points are Drips' own scale; this project tags honestly and never promises a payout — that follows Drips' own review and rules.

To claim an issue:

1. Read the whole issue: summary, context, scope, implementation notes, and acceptance criteria.
2. Comment that you want it, with a sentence on your approach. A maintainer assigns it to you.
3. Open a draft PR early if the scope is unclear; ask questions in the issue itself, not privately.
4. One issue per PR — don't bundle unrelated changes.

Issues inactive for seven days after assignment go back to the pool.

## Pull requests

1. Branch from `main`, keep the change small and focused.
2. Use [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, `test:`, `ci:`).
3. Add tests for new behavior **and its failure paths**.
4. If a change crosses a repo boundary (for example, the site's typed API client against core's OpenAPI contract), check it against the real contract and describe the cross-repo impact in the PR.
5. Fill in the pull request template, link the issue (`Closes #123`), and show evidence: the `npm run check` (or `cargo test`) output, and for anything ledger-related, a real Testnet transaction hash where relevant.

**What reviewers look for:** every acceptance criterion in the issue is met, one by one; the repo's full check command is green; failure paths are tested; no secrets or real data appear anywhere in the diff; and the diff doesn't touch unrelated files.

## Setting up each repository

Each repo's own `CONTRIBUTING.md` and README have the exact quick-start commands; they're also reproduced in [Local setup](development/local-setup.md) in this documentation.

| Repository | Setup |
|---|---|
| [Unbound-core](https://github.com/Unbound224/Unbound-core) | `npm ci && npm run check` |
| [Unbound-stellar](https://github.com/Unbound224/Unbound-stellar) | `npm ci && npm run check`, plus `cargo fmt/clippy/test` for the contract |
| [Unbound-site](https://github.com/Unbound224/Unbound-site) | `npm ci && npm run check` |

## Conduct and security

Everyone participating agrees to each repository's Code of Conduct (Contributor Covenant 2.1). Report vulnerabilities privately as described in [Security](security.md) — never in a public issue. General questions go in each repository's GitHub Discussions.
