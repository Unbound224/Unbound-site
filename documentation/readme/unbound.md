# Unbound

Unbound is an exchange and redemption layer for merchant store credit on Stellar. A holder can obtain a real order-book quote for another asset or return credit through an escrowed redemption path.

## The failures it addresses

**A merchant can refuse.** Sending credit back to its issuer in a normal payment can burn the asset before a merchant honors a refund. Unbound uses a Soroban escrow so the issuer confirms, rejects and refunds, or misses a deadline and an on-chain refund path remains available.

**A quote can lie.** A UI price is not a guarantee. Unbound derives quotes from Stellar strict-send path payment liquidity, carries an expiry and a minimum-output floor, and shows no quote when the order book cannot fill it.

## Rules

| Rule                              | Enforcement                                               |
| --------------------------------- | --------------------------------------------------------- |
| Credit is merchant-backed         | Merchant policy is signed, verified and issuer-authorized |
| A quote is executable or absent   | Strict-send path payment, expiry and minimum output       |
| Redemption cannot strand a holder | Escrow confirmation, rejection/refund or deadline refund  |
| Ledger evidence decides state     | Outcomes are reconciled by transaction hash               |
| Unbound does not custody keys     | Holders and issuers sign with their own keys              |

| Repository                                                       | Owns                                          |
| ---------------------------------------------------------------- | --------------------------------------------- |
| [Unbound-core](https://github.com/Unbound224/Unbound-core)       | Business API and policy layer                 |
| [Unbound-stellar](https://github.com/Unbound224/Unbound-stellar) | Stellar gateway and Soroban redemption escrow |
| [Unbound-site](https://github.com/Unbound224/Unbound-site)       | Landing page and user/admin consoles          |
| [Unbound-mobile](https://github.com/Unbound224/Unbound-mobile)   | Consumer wallet prototype                     |

The web app is live at [unbound-web1.vercel.app](https://unbound-web1.vercel.app). Testnet addresses and transaction hashes are maintained in the [deployment record](https://github.com/Unbound224/Unbound-stellar/blob/main/docs/DEPLOYMENT.md). Read the [canonical Unbound documentation](../../gitbook) for user journeys and concepts.
