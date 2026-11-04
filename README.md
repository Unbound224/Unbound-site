<div align="center">

<img src="./brand/icon.svg" alt="Unbound logo" width="96" height="96" />

# Unbound-site

**The public face of Unbound: the landing page, partner docs, the merchant console where issuers answer redemptions, and the reviewer console.**

[![CI](https://github.com/Unbound224/Unbound-site/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Unbound224/Unbound-site/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-7537F5.svg)](./LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/network-Stellar%20Testnet-10092E.svg)](https://developers.stellar.org/docs/networks)
[![Status: pre-release](https://img.shields.io/badge/status-pre--release-AD8AFF.svg)](#project-status)

Part of **[Unbound](https://github.com/Unbound224)** - turn stranded value into something usable.

</div>

<p align="center">
  <img src="./docs/screenshots/desktop-light.png" alt="Unbound landing page, light theme" width="49%" />
  <img src="./docs/screenshots/desktop-dark.png" alt="Unbound landing page, dark theme" width="49%" />
</p>

## What is Unbound?

Store credit is usually stuck inside one retailer. Unbound lets a person exchange store credit that a retailer has
**genuinely issued and agreed to honor** for other Stellar assets, at a real order-book quote that they sign on their
own device, or redeem it with the issuer.

- **Issuer-authorized only.** A verified merchant signs a redemption policy with its Stellar issuer key and must
  authorize every holder's trustline. No issuer, no usable credit; arbitrary gift cards are out of scope.
- **No fake liquidity.** Quotes come from real Stellar path payments, expire and carry a minimum-output floor. No route
  means no quote. Unbound never promises a price, liquidity or fiat cash-out.
- **Ledger-truthful.** Nothing is shown as settled until the ledger confirms it; unknown outcomes reconcile by hash.
- **Testnet only today.** Mainnet needs an external security review and legal/compliance work that has not happened.

## This repository

A Next.js app with three parts:

- **Landing** - value proposition; an animated, step-by-step diagram of issuer -> credit -> exchange -> redemption
  escrow (with confirm / reject / timeout); an interactive quote explainer (slippage cap and minimum received, exact
  base-unit maths, illustrative rate); who it is for (shoppers, merchants, developers); an animated "under the hood"
  data path; trust and safety; the Android download (straight to the latest APK) with install help; FAQ. Light and
  dark themes, responsive down to 360 px, animations off under `prefers-reduced-motion`.
- **Merchant console** (`/merchant`) - sign in against `Unbound-core`, see verified credit programs, the redemption
  queue (escrowed and direct returns, deadline, confirm or reject with a reason; escrow actions hand you the unsigned
  transaction to sign with your issuer key and take the signed envelope back), and disputes with replies. Password
  reset at `/merchant/forgot-password`.
- **Reviewer console** (`/admin`) - issuer review queue (verify with an evidence reference, revoke with a reason),
  disputes with the ruling form (escalated first), and the core maintenance jobs with run now.

It never builds or signs Stellar transactions, never asks for a secret key, and keeps the session token in memory only.

### Screenshots

Real captures of the production build (Playwright, Chromium). Consoles show synthetic API data; nothing here is a
real merchant or user. Full-page landing: [light](./docs/screenshots/desktop-full-light.png) · [dark](./docs/screenshots/desktop-full-dark.png).

| How it works (animated, step 5) | Quote explainer |
|---|---|
| <img src="./docs/screenshots/flow-light.png" alt="Animated diagram: credit in the redemption escrow, confirm or refund" width="420" /> | <img src="./docs/screenshots/quote-explainer-dark.png" alt="Interactive slippage and minimum received explainer" width="420" /> |
| **Who it is for** | **Under the hood** |
| <img src="./docs/screenshots/audiences-light.png" alt="Shoppers, merchants and developers cards" width="420" /> | <img src="./docs/screenshots/under-the-hood-dark.png" alt="Phone to core to stellar gateway to Testnet data path" width="420" /> |

| Mobile (390 px), light | Android download at 360 px | Merchant console (escrow queue) | Reviewer console |
|---|---|---|---|
| <img src="./docs/screenshots/mobile-light.png" alt="Landing on mobile, light" width="180" /> | <img src="./docs/screenshots/android-download-360-dark.png" alt="Download for Android with install help" width="180" /> | <img src="./docs/screenshots/console-light.png" alt="Merchant console with synthetic escrowed redemptions" width="260" /> | <img src="./docs/screenshots/admin-light.png" alt="Reviewer console with synthetic review queue" width="260" /> |

## Architecture

Unbound is four independently tested repositories with one owner per boundary. This one is highlighted.

```mermaid
flowchart LR
  M["Unbound-mobile<br/>Flutter wallet"]
  S["Unbound-site<br/>landing + merchant console"]
  C["Unbound-core<br/>HTTP API v1, policy, intents, audit"]
  G["Unbound-stellar<br/>SDK, gateway service, chain worker"]
  N[("Stellar Testnet<br/>assets, trustlines, DEX,<br/>Soroban redemption escrow")]
  M -- "quotes, intents, signed XDR" --> C
  S -- "merchant + reviewer consoles" --> C
  C -- "quote / build / submit" --> G
  G -- "Horizon" --> N
  G -- "reconciliation events" --> C
  style S fill:#7537F5,stroke:#10092E,color:#ffffff
```

Clients never build Stellar transactions, and core never reimplements ledger logic. Details:
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [`docs/STELLAR_PROTOCOL.md`](./docs/STELLAR_PROTOCOL.md).

## Quickstart

Requires Node 22+.

```bash
npm ci
cp .env.example .env.local         # NEXT_PUBLIC_API_URL=/core, CORE_PROXY_TARGET=http://127.0.0.1:3001
npm run dev                        # http://localhost:3000
npm run check                      # lint + typecheck + tests + production build
```

The landing page works on its own. For the merchant console, run a seeded
[Unbound-core](https://github.com/Unbound224/Unbound-core#quickstart) on port 3001 and sign in with the seeded merchant.
Core sends no CORS headers, so the browser talks to this site's `/core/*` route, which Next proxies to
`CORE_PROXY_TARGET`.

### Store badges (config-driven)

The mobile app is **not** in the App Store or Google Play. Official badges render only when
`NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` are set at build time to https URLs on `apps.apple.com` /
`play.google.com`; the badge artwork is then loaded from Apple and Google, never redrawn. Without them the page shows
**Download for Android (beta APK)** linking to
[Unbound-mobile releases](https://github.com/Unbound224/Unbound-mobile/releases) and an inert **iOS - coming soon**.
A test asserts that no store links or badge images render without the env vars.

## Project status

Legend: **Built** = implemented and covered by automated tests in this repo. **Not yet** = not started or not verified.

| Area | Status |
|---|---|
| Landing page: all sections, light/dark, responsive to 360 px, reduced motion, config-driven store badges | Built |
| Animated flow diagram (incl. Soroban escrow), interactive quote explainer, audiences, under-the-hood data path | Built; interaction, maths and axe tested |
| Android download: button goes to `releases/latest/download/unbound-android.apk`, All releases, checksum, install help | Built (the link works once a `v*` tag has been released) |
| Sign-in / registration against core; token in memory only; sign-out revokes server-side; password reset pages | Built |
| Merchant console: programs, redemption queue with escrow state and deadline, confirm / reject with reason, escrow sign-and-submit panel, dispute replies | Built |
| Reviewer console: issuer review queue (verify / revoke), dispute rulings, maintenance jobs | Built |
| Typed API client (zod-validated, timeouts); every endpoint checked against core's OpenAPI fixture | Built |
| Live-core test: spawns the real `Unbound-core` (SQLite, fake gateway, synthetic seed) and drives the components | Built (skipped without the sibling checkout) |
| Accessibility: axe-core checks in jsdom on every page and state | Built; colour contrast and manual screen-reader audit not done |
| Escrow confirm / reject signed with the Freighter browser wallet (fail closed: must be the credit issuer's account, on Testnet); paste-a-signed-XDR path kept | Built and tested with a mocked wallet; **not tried with a real Freighter install** (needs the owner's browser) |
| Admin sign-in with a one-time code when the account has MFA enabled (core issues `MFA_REQUIRED`) | Built and tested; MFA enrolment has no UI yet (core endpoints only) |
| Live click-through against a running core on Testnet data: merchant console (3 real escrow redemptions in their final states, buttons disabled when closed), reviewer console (review queue, jobs incl. `sync-trusted-assets`), password reset pages | Done 2026-11-04 in the built-in browser; found one display bug (30 s job shown as "1 min"), fixed |
| Issuing credit from the UI, policy-signing helper | Not yet |
| Browser E2E in CI, Lighthouse, public deployment | Not yet |
| Official store badges | Not shown: there are no store listings |

## The four repositories

| Repository | Owns | Stack | CI |
|---|---|---|---|
| [Unbound-core](https://github.com/Unbound224/Unbound-core) | Backend API: issuers, policies, intents, redemptions, audit | TypeScript, Node 22, SQLite | [![CI](https://github.com/Unbound224/Unbound-core/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Unbound224/Unbound-core/actions/workflows/ci.yml) |
| [Unbound-stellar](https://github.com/Unbound224/Unbound-stellar) | Stellar SDK, gateway service, chain worker, Soroban redemption escrow | TypeScript, @stellar/stellar-sdk, Rust/Soroban | [![CI](https://github.com/Unbound224/Unbound-stellar/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Unbound224/Unbound-stellar/actions/workflows/ci.yml) |
| [Unbound-site](https://github.com/Unbound224/Unbound-site) (this repo) | Landing page, partner docs and merchant console | Next.js 16, React 19, Tailwind 4 | [![CI](https://github.com/Unbound224/Unbound-site/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Unbound224/Unbound-site/actions/workflows/ci.yml) |
| [Unbound-mobile](https://github.com/Unbound224/Unbound-mobile) | Flutter consumer wallet | Flutter, Dart, Riverpod | [![CI](https://github.com/Unbound224/Unbound-mobile/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Unbound224/Unbound-mobile/actions/workflows/ci.yml) |

## Contributing and Drips Wave

Contributions are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md), then pick from the scoped, testable ideas in
[`docs/CONTRIBUTOR_ISSUES.md`](./docs/CONTRIBUTOR_ISSUES.md). Unbound intends to take part in
[Drips Wave](https://docs.drips.network/wave/maintainers/participating-in-a-wave/); that is subject to Drips' review and
limits, and no rewards are promised. Wave issues are opened only once their dependencies and acceptance tests are ready.
Everyone agrees to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately (Security tab, **Report a vulnerability**) as described in
[`SECURITY.md`](./SECURITY.md). The threat model is in [`docs/SECURITY.md`](./docs/SECURITY.md). Testnet only: never use
real funds, real customer data or Mainnet keys with this code.

## Documentation

[`docs/PRD.md`](./docs/PRD.md) (product) · [`docs/SRD.md`](./docs/SRD.md) (requirements, API, states) ·
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · [`docs/TECHNICAL_BUILD.md`](./docs/TECHNICAL_BUILD.md) ·
[`docs/ROADMAP.md`](./docs/ROADMAP.md) · [`docs/BRAND.md`](./docs/BRAND.md) · [`AGENTS.md`](./AGENTS.md) (rules for coding agents).
The canonical copy of the shared docs lives in [Unbound-core](https://github.com/Unbound224/Unbound-core/tree/main/docs).

## License

[MIT](./LICENSE). The Unbound logo in [`brand/`](./brand) is the project's approved identity and is shared by all four
repositories; it has not been trademark-cleared.
