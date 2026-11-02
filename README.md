<img src="./brand/icon.svg" alt="Unbound logo" width="144" />

# unbound-site

> Unbound — Turn stranded value into something usable.

**Status: landing site and merchant console skeleton implemented; build, lint, typecheck and tests pass. Not connected to a real deployment. See "Status" below.** This repo is one of **exactly four meaningful independent codebases** in the Unbound Stellar-native project. It is not a placeholder created merely to increase Drips Wave submissions.

## Owns
Public consumer landing, official store badges, merchant issuer console, merchant redemption operations, docs and partner onboarding

## Why it is separate
It has a distinct runtime/toolchain, external interface, tests, release cadence and maintainership boundary. Its siblings depend on its delivered interface, but implementation responsibilities must not be duplicated.

## Sibling repositories
- `unbound-mobile` — Consumer asset inventory, issuer discovery, offers, approvals, wallet/secure signing, redemption status, transaction receipts
- `unbound-core` — Merchant onboarding, verified issuer/redemption policies, listings and reservations, user accounts, authorization, canonical operational data, dispute workflow
- `unbound-stellar` — Native Stellar asset issuance integration, account trustlines, issuer flags, order-book/path quoting, transactions, indexing/reconciliation, typed integration SDK

## Architecture and development context
Start with:
- `AGENTS.md` — coding agent rules;
- `docs/PRD.md` — product purpose and MVP;
- `docs/SRD.md` — user/system requirements, APIs and state;
- `docs/ARCHITECTURE.md` — four-repository responsibilities, data and execution paths;
- `docs/TECHNICAL_BUILD.md` — recommended bootstrap, testing, phases;
- `docs/SECURITY.md` — security/trust boundaries;
- `docs/BRAND.md` — approved flat logo and flexible UI direction;
- `docs/ROADMAP.md` — milestone acceptance gates.

## Status (honest)
| Area | State |
|---|---|
| Landing page (honest copy: Testnet, no store availability, explicit non-goals), partner docs | Implemented |
| **Sign-in / registration** against `unbound-core` (`/v1/auth/*`); session token held in React memory only (no storage/cookies); sign-out revokes it server-side | Implemented, tested |
| Merchant application form (requires a session) | Implemented, tested |
| Merchant console: verified credit programs + redemption queue; "Confirm fulfilment" enabled only when the return is ledger-confirmed | Implemented, tested |
| Typed API client (zod-validated responses, timeouts, typed errors); every endpoint it calls is asserted to exist in `fixtures/core-openapi.v1.json` | Implemented |
| **Live-core test**: spawns the real `unbound-core` process (sibling `../Unbound-core`, SQLite, FakeStellarGateway test adapter, synthetic seed) and drives the real components over HTTP: login, queue, confirm, server-side refusal, logout revocation | Implemented; skipped if the sibling is absent. No Stellar involved |
| **Accessibility checks** (axe-core via vitest-axe) on landing, docs, sign-in (pristine/errors/register), forms and console states, plus a sanity test that the harness detects violations | Implemented. **Colour contrast is NOT checked** (jsdom), no keyboard/screen-reader manual audit |
| Issuing credit, signing a redemption policy in the UI | Not built. Policies are signed offline with the issuer key; no helper exists yet |
| Admin console (verify merchants, disputes, pauses), dispute UI, password reset, MFA | Not built |
| Browser E2E (Playwright), Lighthouse | Not done |
| Official store badges | Not included: there are no store listings |

## Quick start
```
npm ci
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL (a running unbound-core)
npm run dev                    # http://localhost:3000
npm run check                  # lint + typecheck + tests + production build
```

## Security notes
The only secret the site handles is the merchant's own account password, sent to core over the API (use TLS outside local dev). No
secret key or seed field exists anywhere. The bearer token is never put in a URL or persisted (no localStorage/cookies). Security headers are set in `next.config.ts`. This site never builds or signs
Stellar transactions; that belongs to `unbound-stellar` / the mobile wallet.

## Sibling versions
Developed against `unbound-core` OpenAPI `1.0.0-draft` (copied to `fixtures/core-openapi.v1.json`) at the `main` branches (untagged).

## Minimal integration contract
Always test the dependency path stated in ARCHITECTURE.md. Every new public endpoint/ABI/package message must be versioned and covered by consumer fixtures. See `docs/SRD.md` and `docs/TECHNICAL_BUILD.md`.

## Drips Wave
Stellar is essential: Native asset issuance: merchant issuance identity and redemption promise live off-chain, asset code+issuer on Stellar. Approval/eligibility for Wave depends on substantive open-source implementation and organizer review, not repo count.


## Official project identity

The project uses the **approved flat SVG logo** in [`brand/icon.svg`](./brand/icon.svg), with an editable transparent vector mark in [`brand/mark.svg`](./brand/mark.svg). The [512 px GitHub organization avatar](./brand/org-avatar.png) is in the same directory. This logo is shared by all four project repositories. UI design remains intentionally flexible.
