# Unbound

Unbound is an exchange and redemption layer for store credit on Stellar. A merchant issues credit as a Stellar asset. A holder can swap that credit for another Stellar asset at a real order-book quote, or redeem it with the merchant through an on-chain escrow that cannot be skipped.

{% hint style="warning" %}
**Testnet prototype.** Everything here runs on Stellar Testnet with synthetic data. There has been no external audit. The Soroban contract, the services and the apps are not for real money.
{% endhint %}

## The problem

Store credit is a closed loop. A gift card or a balance belongs to one retailer, and the holder has two options: spend it there, or let it expire. Unbound turns credit that a retailer has actually issued and agreed to honor into something a holder can move.

Two failures make this hard, and Unbound is built around them:

- **A shop can refuse.** If a holder returns credit to a merchant and the merchant says no, or never answers, a plain payment leaves the holder with nothing. In a classic Stellar payment, credit sent to its own issuer is burned on arrival, so the only remedy is an off-chain promise to refund.
- **A quote can lie.** An app that shows a price it cannot deliver erodes trust. Unbound only shows a quote that the Stellar order books can actually fill, and it expires.

## What Unbound does about it

| Rule | How it is enforced |
|---|---|
| Only credit that a verified merchant stands behind is usable | The merchant signs a redemption policy with its Stellar issuer key. An admin verifies the merchant. The issuer authorizes every holder's trustline. |
| A quote is real or absent | Quotes come from Stellar strict-send path payments, carry an expiry and a minimum-output floor, and no route means no quote. |
| Redemption cannot strand the holder | Returned credit goes into a Soroban escrow. The issuer confirms it, rejects it (refund), or the deadline passes and anyone can trigger the refund. |
| Nothing is "settled" until the ledger says so | State changes only on a ledger-confirmed transaction hash. Unknown outcomes are reconciled by hash, never retried blindly. |
| Unbound never holds keys or funds | Holders and issuers sign on their own device or key. The escrow contract holds returned credit, not Unbound. |

## What exists today

| Part | Repository | State |
|---|---|---|
| Business API | [Unbound-core](https://github.com/Unbound224/Unbound-core) | Built, tested, running on Render (free plan, development entrypoint) |
| Stellar gateway and escrow contract | [Unbound-stellar](https://github.com/Unbound224/Unbound-stellar) | Built, tested. Escrow deployed on Testnet and exercised end to end |
| Landing page and consoles | [Unbound-site](https://github.com/Unbound224/Unbound-site) | Live at [unbound-web1.vercel.app](https://unbound-web1.vercel.app) |
| Consumer wallet | [Unbound-mobile](https://github.com/Unbound224/Unbound-mobile) | Built, tested. A release APK builds. Never run on a phone |

The [Unbound-stellar deployment record](https://github.com/Unbound224/Unbound-stellar/blob/main/docs/DEPLOYMENT.md) lists the Testnet contract id and transaction hashes with explorer links. The status tables in each repository README state what is not done.

## Where to go next

- New to the idea: read [How it works](getting-started/how-it-works.md), then [Core concepts](concepts/credit-and-issuers.md).
- Integrating: start with the [core API README](https://github.com/Unbound224/Unbound-core#quick-start).
- Reviewing the contract: use the [stellar-layer README](https://github.com/Unbound224/Unbound-stellar#quick-start) and its linked contract evidence.
- Contributing: read [Contributing](https://github.com/Unbound224/Unbound-site/blob/main/CONTRIBUTING.md) and the open issues labeled `Stellar Wave`.
