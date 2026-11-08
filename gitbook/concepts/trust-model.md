# Trust model, with worked numbers

Unbound does not custody funds and does not vouch for a merchant's honesty. What it enforces is **who can make a claim about credit, and what the ledger has to say before Unbound treats a claim as true.**

## What each party can and cannot do

| Party | Can | Cannot |
|---|---|---|
| **Issuer (merchant)** | Issue credit, sign a redemption policy, authorize/revoke holder trustlines, confirm or reject a redemption, pause nothing else | Move a holder's funds without the holder's signature; change a policy's `assetCode` or `issuerPublicKey` after the fact (any edit must re-match the program) |
| **Holder (consumer)** | Hold eligible credit, request a quote, sign and submit their own exchange or return transaction, claim a timeout refund | Fabricate eligibility for an asset with no verified program; force a merchant to confirm; skip the ledger's minimum-output check |
| **Admin (reviewer)** | Verify/revoke a merchant with an evidence reference, resolve a dispute, pause the redemption escrow's **new** opens, run maintenance jobs | Move escrowed funds (`set_paused` only blocks new `open_return`; confirm/reject/expire keep working while paused), touch a holder's wallet key |
| **Unbound (core + gateway)** | Build unsigned transactions, validate policies and amounts, reconcile by transaction hash | Hold a user or issuer secret key, settle anything without a ledger-confirmed hash |

This is why the trust model reduces to two guarantees: **a quote the ledger will actually honor**, and **a redemption return that cannot be stranded**.

## Guarantee 1: the quote floor, computed

A quote's `minDestinationAmount` is computed in integer stroops, never floating point:

```text
minDestinationAmount = expectedDestinationAmount * (10000 - slippageBps) / 10000
```

Worked example from a real quote captured against core's HTTP server (labeled fake gateway, DEX rate 9/10, 100 bps slippage):

```text
expected = 80.0000000 * 9 / 10        = 72.0000000
minimum  = 72.0000000 * 9900 / 10000  = 71.2800000
```

The transaction submitted is a Stellar **strict-send path payment** with that minimum as its destination floor. The ledger itself aborts the payment if it cannot deliver at least the minimum — Unbound's arithmetic never has to be trusted after the fact, because a wallet re-derives the same floor from the quote before signing and the Stellar protocol enforces it atomically. There is no partial-fill state where a holder receives less than the floor.

## Guarantee 2: a redemption cannot strand the holder

The numbers that make this concrete are the escrow contract's own constants (`Unbound-stellar/contracts/redemption-escrow/src/lib.rs`):

| Constant | Value | What it bounds |
|---|---|---|
| `MIN_WINDOW_SECS` | 3,600 (1 hour) | The shortest answer window a merchant can be given. Prevents a merchant from being set an impossibly short deadline that functions like an automatic reject. |
| `MAX_WINDOW_SECS` | 2,592,000 (30 days) | The longest a holder's credit can sit in escrow with no answer, before anyone can trigger a refund. |
| Default window (core) | 604,800 seconds (7 days), via `DEFAULT_ESCROW_WINDOW_SECS` / `ESCROW_WINDOW_HOURS` | What core actually requests unless configured otherwise. |

So for any escrowed redemption, the holder is guaranteed one of three outcomes inside a bounded window: the issuer confirms (fulfilled), the issuer rejects (refunded immediately), or nobody answers and the refund becomes claimable after at most 30 days (and by default after 7). There is no fourth outcome where the credit is simply gone.

## Where trust still has to exist off-chain

The ledger cannot verify a legal promise. Two things are still trust, not cryptography:

1. **That a verified merchant will actually honor its stated policy.** Admin verification uses an evidence reference (never the document itself) and is a human judgment call, not a proof.
2. **The policy's content** — face value, jurisdiction, refund terms — is a signed JSON document, so a holder can prove what was promised, but enforcing it outside a dispute still requires the issuer to cooperate or a court to get involved. Unbound's dispute workflow records a ruling; it does not and cannot move funds on a human's say.

{% hint style="info" %}
This is why `docs/SECURITY.md` in both backend repos states plainly: a Stellar asset on its own is not evidence a shop will redeem it, and no repo claims otherwise. The escrow contract removes the worst failure mode (silent, un-refundable loss on a redemption return); it does not make a merchant's underlying promise legally enforceable.
{% endhint %}
