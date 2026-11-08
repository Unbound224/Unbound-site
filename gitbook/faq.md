# FAQ

**Is this live, with real money?**
No. Unbound is a Stellar Testnet prototype. Every asset involved (SHOP, USDC in the evidence pages) is synthetic test credit created for this project. There has been no security audit, and the code has no production mode — `Unbound-core` refuses to start unless `APP_ENV=development`.

**Does Unbound hold my funds or my keys?**
No. Holders and issuers sign on their own device or key, for everything. Unbound's backend builds unsigned transactions and never sees a secret key. The one place funds are held in a contract at all — the redemption escrow — has no admin withdrawal path; the contract's own admin can only pause *new* escrow opens, never move money already in escrow (see [Contract functions](contract/functions.md)).

**What happens if a merchant just ignores a redemption?**
In escrow mode, the holder (or literally anyone) can trigger the refund once the deadline passes — by default 7 days, contractually bounded between 1 hour and 30 days. In native mode (used when escrow isn't available for that asset), the credit was already burned on return, so an unresponsive merchant becomes a dispute instead of a stuck transaction. See [Redemption lifecycle](concepts/redemption-lifecycle.md).

**What stops a merchant from issuing credit and then just not honoring it?**
Nothing in Stellar itself — a Stellar asset proves nothing about a shop's intent on its own. What Unbound adds is a signed, legally-worded redemption policy and an admin verification gate before credit counts as redeemable at all, plus a dispute workflow if a merchant acts in bad faith. None of that is a legal guarantee; it's a gate on being *listed*, and the project says this plainly rather than overclaiming (see [Trust model](concepts/trust-model.md)).

**Why is there only one smart contract?**
Because almost everything Unbound needs — issuing credit, trustlines, exchanging assets — is already expressible with classic Stellar primitives (issued assets, path payments, issuer authorization flags). Only the redemption-return flow needs genuine conditional custody with three exits (confirm/reject/timeout), which classic Stellar can't express. See [ADR 0002](https://github.com/Unbound224/Unbound-stellar/blob/main/docs/adr/0002-soroban-redemption-escrow.md) and [Contract overview](contract/overview.md).

**Is the escrow contract audited?**
No. It's unaudited, stated directly in its own source doc comment and in every repo's `SECURITY.md`. It has been deployed to Testnet and exercised through several real runs — see [Testnet evidence](testnet-evidence.md) for exactly what was and wasn't proven.

**What's the difference between a quote and an intent?**
A quote is an indicative, expiring price (around 60 seconds) that costs nothing to ask for. An intent is created from a quote and carries an unsigned transaction you actually sign and submit — see [Exchange intents](concepts/exchange-intents.md) for the full state machine.

**Why did my request return 202 instead of 200?**
A `202` means the outcome isn't known yet — the transaction was submitted but hasn't confirmed or failed on the ledger. This is deliberate: the API never reports success speculatively. Poll the resource or wait for a reconciliation event.

**What is `SENSITIVE_ACTIONS_PAUSED` (423)?**
It means the ledger's record of something disagreed with what core's database expected — a discrepancy — and core has paused new redemptions and exchanges until a reviewer looks. It's a safety brake, not a bug report in itself; see [Failure modes](architecture/failure-modes.md).

**Can I run this myself?**
Yes — all three backend/frontend repos run entirely offline against labeled test adapters with `npm run check` and a short quick start. See [Local setup](development/local-setup.md).

**Is there a mobile app?**
Unbound-mobile (Flutter) is built and tested, and a release APK builds in CI, but as of this writing it has never been run on a physical phone — that's stated directly rather than implied otherwise.

**How do I report a security issue?**
Privately, through each repository's GitHub Security tab — never a public issue. See [Security](security.md).

**How can I contribute?**
Through the Stellar Wave Program's scoped, labelled issues. See [Contributing](contributing.md).
