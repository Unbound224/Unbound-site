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
| Landing page (honest copy: Testnet, no store availability, explicit non-goals) | Implemented |
| Partner onboarding docs page | Implemented (static copy) |
| Merchant application form (accessible validation) | Implemented; posts to `unbound-core` `POST /v1/merchants/apply` |
| Merchant console skeleton: credit programs + redemption queue; "confirm fulfilment" enabled only when the return is ledger-confirmed | Implemented against the core API contract |
| Typed API client (zod-validated responses, timeouts, typed errors) | Implemented, unit-tested; every endpoint used is asserted to exist in `fixtures/core-openapi.v1.json` (snapshot of core's OpenAPI) |
| **Merchant sign-in** | **Not built.** The console takes a pasted dev/Testnet session token held only in memory. Core also has no real merchant auth yet |
| **Run against a live core** | **Not done.** Tested with injected fetch/fake clients only; no browser E2E |
| Issuing credit / policy signing UI | Not built. Signing must happen offline with the issuer key; no helper exists yet |
| Official store badges | Not included: there are no store listings |
| Playwright/e2e, Lighthouse, a11y audit tooling | Not done (component tests assert labels/roles/alerts only) |

## Quick start
```
npm ci
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm run dev                    # http://localhost:3000
npm run check                  # lint + typecheck + tests + production build
```

## Security notes
No secret key, seed or password field exists anywhere. The bearer token is never put in a URL or persisted
(no localStorage/cookies). Security headers are set in `next.config.ts`. This site never builds or signs
Stellar transactions; that belongs to `unbound-stellar` / the mobile wallet.

## Sibling versions
Developed against `unbound-core` OpenAPI `1.0.0-draft` (copied to `fixtures/core-openapi.v1.json`) at the `claude/drips-wave-maintainer-projects-iwucl5` branches (untagged).

## Minimal integration contract
Always test the dependency path stated in ARCHITECTURE.md. Every new public endpoint/ABI/package message must be versioned and covered by consumer fixtures. See `docs/SRD.md` and `docs/TECHNICAL_BUILD.md`.

## Drips Wave
Stellar is essential: Native asset issuance: merchant issuance identity and redemption promise live off-chain, asset code+issuer on Stellar. Approval/eligibility for Wave depends on substantive open-source implementation and organizer review, not repo count.


## Official project identity

The project uses the **approved flat SVG logo** in [`brand/icon.svg`](./brand/icon.svg), with an editable transparent vector mark in [`brand/mark.svg`](./brand/mark.svg). The [512 px GitHub organization avatar](./brand/org-avatar.png) is in the same directory. This logo is shared by all four project repositories. UI design remains intentionally flexible.
