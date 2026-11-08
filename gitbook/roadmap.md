# Roadmap and known gaps

This is an honest list, pulled from the "not done" rows of each repository's own status table, not aspirational marketing. Nothing here is promised on a timeline.

## Known gaps today

| Area | Gap |
|---|---|
| Database | SQLite behind a `Storage` port is explicitly an interim store, "not for scale" (Unbound-core README) |
| Escrow events | The indexer doesn't decode Soroban `getEvents` for the escrow yet; reconciliation works by transaction hash instead ([ADR 0002](https://github.com/Unbound224/Unbound-stellar/blob/main/docs/adr/0002-soroban-redemption-escrow.md)) |
| Wrong-signer on-chain proof | Not demonstrated by a live run (see [Testnet evidence](testnet-evidence.md)); covered by contract unit tests only |
| MFA enrollment UI | API-only today; no enrollment screen in the merchant/reviewer console |
| Freighter wallet signing | Built and tested against a mocked wallet in the console; not yet tried with a real Freighter install |
| Email delivery | Password resets print to the server console unless `MAIL_PROVIDER=resend` is configured |
| Rate limiting | Only the login lockout exists; no general API rate limiting |
| Mobile app | Built and tested; a release APK builds, but has never been run on a physical phone |
| Account-stream indexing, liquidity pools, reserves/liabilities | Not built in Unbound-stellar |
| Official app store listings | Not built — there are no store listings, so store badges don't render |
| Browser end-to-end tests, Lighthouse budgets | Not built in Unbound-site's CI |
| External security audit | Not done, for the contract or anything else |
| Production/Mainnet mode | Does not exist; core refuses to start outside `APP_ENV=development` |

## Near-term direction

These follow directly from the gaps above, in roughly the order they'd need to happen:

1. **Decode escrow events from Soroban RPC** so the indexer doesn't rely solely on hash-based reconciliation for escrow state.
2. **Add an on-chain wrong-signer rejection test** against the real deployed contract (not just the Rust unit tests), to close the one proof gap in [Testnet evidence](testnet-evidence.md).
3. **MFA enrollment screen** in the reviewer console, so admins don't need to call the API directly to turn on a second factor.
4. **Try escrow signing with a real Freighter install**, not just the mocked wallet the console tests use today.
5. **A managed Postgres option**, since SQLite is explicitly called out as not for scale.
6. **Run the mobile app on a physical device** at least once, and record what that run does and doesn't prove, the same way the Testnet evidence page does for the backend.

## What production would require, and isn't being pursued yet

Per `docs/SECURITY.md` in both backend repos: a security audit, real issuer and provider agreements, jurisdictional legal and compliance review, an incident-response and insurance assessment, and consumer UX disclosures. None of this is in scope for the current Testnet prototype, and no page in this documentation claims otherwise.

## How to help

Work is organized through the [Stellar Wave Program](https://www.drips.network/wave/stellar) as scoped GitHub issues labelled `Stellar Wave`. See [Contributing](contributing.md) for how to pick one up.
