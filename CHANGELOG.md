# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are tagged by the maintainer. No public
deployment exists.

## [Unreleased]

### Added
- Merchant escrow panel: "Sign with Freighter" (`src/lib/freighter.ts`, fail closed: wallet installed and approved, signing account
  is the credit issuer, wallet on Testnet); admin sign-in asks for a one-time code when core answers `MFA_REQUIRED`;
  `docs/OWNER_CHECKLIST.md`.
- Fixed: the job table showed a 30 s job as "1 min".
- Landing: animated five-step diagram (issuer -> wallet -> DEX, redemption escrow, confirm / reject / timeout),
  interactive quote explainer (slippage cap, minimum received), "Who it is for" illustrated cards, animated
  "Under the hood" data path. Reduced-motion safe, light/dark, 360 px.
- "Download for Android" links straight to `releases/latest/download/unbound-android.apk`, with All releases, checksum
  and How to install an APK. iOS stays Coming soon; official store badges remain config-driven.
- Merchant console: escrow state and deadline, reject with reason, sign-and-submit panel for issuer escrow
  transactions, dispute replies.
- Reviewer console (`/admin`): issuer review queue, dispute rulings, maintenance jobs.
- Password reset pages (`/merchant/forgot-password`, `/merchant/reset-password`).
- New production screenshots in `docs/screenshots/`.

### Changed
- Redemption queue is a list of cards instead of a table.

## [0.1.0] - pre-release scaffold
- Landing, sign-in, merchant application and console skeleton, typed API client.
