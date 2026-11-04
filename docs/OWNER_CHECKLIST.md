# Unbound: owner checklist

Written 2026-11-04 after a local continuation run on the owner's Windows machine. Everything below is **Stellar Testnet and
synthetic data only**. Nothing here is audited, deployed publicly, listed in a store or approved by Drips Wave. Items marked
**OWNER** can only be done by you (they need your accounts, a phone, a browser extension or a payment).

## Status

| Phase | State | Evidence |
|---|---|---|
| 0. Baseline checks, all four repos | Done | `npm run check` (core 173 tests, stellar 128, site 95), `cargo fmt/clippy/test` (24), Flutter format/analyze/test (146). Windows-only test failures fixed and pushed. CI green on `main` at the last check (see section 1) |
| 1. Escrow deployed to Testnet | Done | Contract `CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C`; smoke: confirm, reject, replay refusal, early-expiry refusal, expiry refund, escrow balance 0 |
| 2. Backend with the escrow on | Done | Core -> gateway -> Soroban: confirm, reject, expiry refund; DEX exchange SHOP -> USDC confirmed; worker resolved a hash against Horizon; merchant and reviewer consoles clicked through |
| 3. Mobile on a phone | **Not done (OWNER)** | `flutter build apk --release`: see section 2. Nobody has run the app on a device |
| 4. Remaining engineering | Partly done | Freighter signing, email adapter, job lease lock, admin MFA, Android screenshot blocking built and unit tested. PostgreSQL option not built (section 1) |
| 5. This checklist | Done | |

## 1. What is proven and what is not

**Proven by running it (Testnet).** Explorer links open on https://stellar.expert/explorer/testnet.

- Escrow contract `CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C`, wasm hash
  `37726f8c76df9302c8c6923104fb7fd884a6ceb2ead6b1933b3bf5f30f7c415a`, admin `GC4OYFENIRHVPAZIAFRPVUJRC37UGWNZOWGYW3CDGBYYIGLI5S5E467O`,
  deployed 2026-11-04. Full log with every transaction hash: `Unbound-stellar/docs/DEPLOYMENT.md`; raw files in
  `Unbound-stellar/contracts/deployments/` (`testnet.json`, `testnet-smoke.json`, `testnet-e2e.json`, `testnet-exchange.json`).
- Test credit `SHOP` issued by `GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX` (AUTH_REQUIRED, AUTH_REVOCABLE); escrow authorized through the
  asset's Stellar Asset Contract `CBGICNAOTEYV4ZMZFHEWM5MD6VTV6NXLVEXLJP6R7OI7HDMESPXEYCK7`.
- Core-driven redemptions with the real signer flow: confirm (`0c9b01b583…` / `92eab2cd49…`), reject (`3beacc887d…` / `88a492dd86…`),
  holder timeout refund after the deadline (`4c44a2c7dc…` / `57eef54681…`). Hashes checked successful on Horizon.
- Escrow smoke (`scripts/testnet-smoke.ts`): open/confirm, open/reject, single-use id refused (error #6), early refund refused (#9),
  refund after the deadline (`191ab9acee…`), escrow balance back to 0.
- Exchange SHOP -> USDC through core and the gateway against Testnet DEX liquidity: tx `5dcd472352…` (ledger 5557441) and `5879422d5f…`
  (ledger 5557552), state `CONFIRMED`.
- Gateway worker against live Horizon: resolved a queued hash and delivered the event to core; no dead letters.
- Site: merchant console showed the three real redemptions in their final states; reviewer console listed the jobs; password reset
  pages worked end to end with the dev mailer.
- CI: Actions tabs `https://github.com/Unbound224/<repo>/actions` for Unbound-core, Unbound-stellar, Unbound-site, Unbound-mobile were green
  on `main` at the start of this run; check them again after the latest push (`gh run list --repo Unbound224/<repo>`).

**Bugs the live run found and fixed.** Host clock 95 s behind Testnet made every settlement `tx_too_late` (gateway now anchors to Horizon's
`Date`); SDK `ledger` link function broke the worker; core never pushed trusted assets to the gateway; no route to register swap
targets; `./data` not created on first start; smoke-script timing and error-name bugs; Android `compileSdk` for plugin modules (section 2).

**Not proven / not done, stated plainly.**

- **No security audit** of the contract or any service. **Testnet only.** Do not call it production ready.
- **Wrong-signer evidence is client-side.** `stellar-cli` refused to sign for an account whose key it does not hold. The contract's auth is
  covered by its Rust tests, not by an on-chain rejection.
- **Real Freighter wallet: not tried** (a browser extension; needs you). The signing code is tested against a mocked wallet only.
- **Real phone / Android device: not tried.** **iOS: not built** (needs a Mac).
- **Real email provider: not used.** `ResendMailer` is tested with a mocked `fetch` only; no account was created. Dev mode prints reset emails.
- **MFA:** admin TOTP is built and unit tested (RFC 6238 vectors, replay, lockout, sealed secrets); there is **no enrolment screen** (core
  endpoints `/v1/auth/mfa/*` only) and it was not exercised in a browser session.
- **PostgreSQL option: not built.** No Postgres server was available to test against, so an untested adapter was not written. Core still uses SQLite.
- **`amountOutActual` is null** for an exchange confirmed synchronously at submit (only the worker path fills it).
- **Screenshot blocking on the backup screen** is built for Android only (`FLAG_SECURE` through a platform channel, tested with a mocked channel) but **not verified on a device**; iOS has no equivalent switch.
- Dependency audit: `npm audit` in Unbound-site reports advisories after adding `@stellar/freighter-api`; not triaged.
- The machine clock is about 95 s slow: fix it (Windows: Settings -> Time -> Sync now) before more Testnet work.

## 2. Mobile (OWNER for the phone)

**APK build on this machine (2026-11-04).** `flutter build apk --release` **succeeded** from the pushed `main` (including the screenshot-blocking
Kotlin change): `app-release.apk`, 52.5 MB (55,025,628 bytes), debug-signed, SHA-256 `3a02d1ff23bf4f63261c6dfdf2d7d5c332021fb7deb65e9f1e72248542215ccd`. The release workflow rebuilds from `main` with its own key. It was **never installed on any phone or emulator**. Two real problems were found and handled:

- Release builds failed `checkReleaseAarMetadata` because the `stellar_flutter_sdk` plugin compiled against android-34 while its AndroidX
  dependencies need 35+. Fixed in `android/build.gradle.kts` (plugin modules compile against SDK 36), pushed. The GitHub Linux release workflow
  would have failed the same way, so this fix matters for your first release.
- On this Windows machine Gradle/Kotlin failed with "Could not close incremental caches ... user-mapped section" (file locks). It built only after
  using a dedicated `GRADLE_USER_HOME` with `kotlin.incremental=false`, `kotlin.compiler.execution.strategy=in-process`, serial workers.
  That setting lives outside the repo (`D:/gradle-unbound/gradle.properties`); Linux CI is unaffected.

`flutter doctor` also reports "Some Android licenses not accepted"; accepting them is a legal step for you: `flutter doctor --android-licenses`.

**Phone click-through (after you install an APK from a release, section 3):**

1. On the PC run the services: gateway (`Unbound-stellar`: `node --env-file=.env --import tsx src/bin/gateway.ts`) and core (`Unbound-core`:
   `node --env-file=.env --import tsx src/main.ts`). Use the PC's LAN address in the app's API URL (emulator: `http://10.0.2.2:3001`).
2. Install the APK (Settings -> allow installs from this source). Open it. Create a wallet.
3. Back up the recovery key (write it on paper; never photograph or paste it). Restore the wallet from it to prove the backup works.
4. Fund the new account on Testnet (friendbot), add a trustline to `SHOP:GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX`, and have the
   issuer authorize it (use the scripts in `Unbound-stellar/scripts/`).
5. Exchange SHOP -> USDC: review the quote (floor, expiry), sign on the device, watch Submitted -> Confirmed.
6. Redeem with escrow: create the redemption, sign the return, then in the merchant console confirm or reject it. Tap "Check status".
7. For the timeout path: create another redemption and do nothing; after the escrow window use "Take my credit back".
8. Send me any error text (never keys or the recovery phrase).

## 3. Releases (OWNER, GitHub UI)

For `Unbound224/Unbound-mobile`: Releases -> Draft a new release -> Choose a tag -> type a **lowercase** `vX.Y.Z` (for example `v0.1.0`) and
"Create new tag on publish" -> target `main` -> tick "Set as the latest release" -> Publish -> wait for the `Release (Android beta APK)`
workflow (about 10 to 15 minutes) -> on a phone open
`https://github.com/Unbound224/Unbound-mobile/releases/latest/download/unbound-android.apk` and confirm it downloads. The workflow runs
`flutter analyze` and `flutter test` first, then builds the APK. Unbound-site has no release workflow.

## 4. Android signing (optional)

`keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`; `base64 -w0 release.jks`; add repository
secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to `Unbound-mobile`. Keep the keystore
backed up; never commit it. Without them the workflow debug-signs (sideloadable, not store-ready; users must uninstall to update).

## 5. Vercel (landing page and consoles)

vercel.com -> sign in with GitHub, allow the `Unbound224` org -> Add New -> Project -> import `Unbound224/Unbound-site` -> leave **Root Directory
blank** (Edit button next to it) -> framework Next.js -> Production environment variables:
`NEXT_PUBLIC_API_URL=/core` and `CORE_PROXY_TARGET=<public https URL of the hosted core from section 6>` -> Deploy -> open the live URL and click every
link and the Android download button. Put the URL in the repo's Website field and the org profile. Leave `NEXT_PUBLIC_APP_STORE_URL` and
`NEXT_PUBLIC_PLAY_STORE_URL` unset until listings exist (iOS correctly says "Coming soon"). Docs: https://vercel.com/docs/monorepos

## 6. Backends (OWNER)

Core and the Stellar gateway are long-running Node services that keep SQLite files and secrets. Create a Render, Railway or Fly service for each
with a persistent disk; paste environment variables yourself (never from the repo):

- Gateway: `GATEWAY_TOKEN` (fresh random, 16+ chars), `ESCROW_CONTRACT_ID=CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C`,
  `SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`, `HORIZON_URL=https://horizon-testnet.stellar.org`, `STATE_DIR` on the disk.
- Core: `STELLAR_GATEWAY_URL`, `STELLAR_GATEWAY_TOKEN` (same value as `GATEWAY_TOKEN`), `STELLAR_ESCROW_ENABLED=true`, `ESCROW_WINDOW_HOURS`,
  `CORS_ALLOWED_ORIGINS=<the Vercel URL>`, `DATABASE_FILE` on the disk, `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` (strong, yours),
  `JOBS_ENABLED=true`, `MFA_ENCRYPTION_KEY` (64 hex chars you generate) before anyone enrols MFA, and for real reset emails
  `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MAIL_FROM` (needs your own Resend account and verified domain; choose another provider if you prefer, it needs a small adapter).
- Core currently refuses to start unless `APP_ENV=development` (it is a dev entrypoint: no hardened production mode exists yet). Say so honestly in
  anything you publish.
- Check the health route of each service, set CORS and the proxy target to the Vercel URL, redeploy the landing page with the final backend URL.
- Run `node --env-file=.env --import tsx scripts/testnet-e2e.ts` style checks from `Unbound-core` against the hosted URL before announcing anything.

## 7. GitHub org and repo settings (OWNER)

Per org (`Unbound224`): upload the avatar (`brand/org-avatar.png`); create a public `.github` repo with `profile/README.md` copied from
`brand/ORG_PROFILE.md`. Per repo: Settings -> Code security -> enable private vulnerability reporting, Dependabot alerts and secret scanning;
add topics (`stellar`, `soroban`, `drips-wave` plus the domain); add the website URL; pin the main repos.

## 8. Drips Wave application (OWNER)

Read the current maintainer steps at https://www.drips.network/wave , then apply with the project's main repos; create real GitHub issues
from `docs/CONTRIBUTOR_ISSUES.md` (clear scope, acceptance test, labels as Wave requires; the smoke-run issue can be closed, its evidence is in
section 1); complete any identity/KYC Drips asks for; describe the project truthfully using section 1.

## 9. Store listings (optional, later)

Google Play developer account (one-time fee) and a signed app bundle; Apple Developer Program and a Mac for iOS. Only after a listing is live set
`NEXT_PUBLIC_PLAY_STORE_URL` / `NEXT_PUBLIC_APP_STORE_URL` on Vercel (https URLs on `play.google.com` / `apps.apple.com`).

## 10. Before Mainnet (not part of this application)

Independent security audit of the contract and services, a bug bounty, legal and compliance review, a key-management plan, a hardened core
entrypoint (managed Postgres, secrets manager, real rate limiting). Do not describe the project as production ready before this.

## 11. Hand-back

If anything fails, send the error text (never keys, seed phrases or `.env` contents) to a coding agent in the relevant repo and tell it to read
`AGENTS.md`.
