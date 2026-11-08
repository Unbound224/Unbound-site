# Guide: holder (consumer)

You hold store credit from a merchant and want to either trade it for something else on Stellar, or return it to the merchant for fulfilment. This page walks both in plain language. It describes the real API flow; the consumer wallet app (Unbound-mobile) is built and tested against it but, as of this writing, has not been run on a physical phone — see its status in the [introduction](../README.md).

## Before you start

You need a Stellar Testnet account with a trustline to the merchant's credit asset, authorized by that merchant's issuer account (because Unbound credit uses `AUTH_REQUIRED`). You sign everything yourself, on your own device or keys — Unbound never asks for your secret key, and nothing you do here gives it one.

## Signing in

There's no password for holders. You prove you own a Stellar address by signing a one-time challenge:

1. `POST /v1/wallets/challenge` with your public key. You get back a one-time message and a challenge id.
2. Sign that message with your Stellar secret key, locally.
3. `POST /v1/wallets/verify` with the challenge id and your signature. You get a session token good for one hour.

The same wallet always maps to the same account — signing in twice with the same key gets you the same holder identity, not a new one.

## Checking what you hold

`GET /v1/portfolio` lists every balance across your bound wallets, each classified:

| Status | What it means |
|---|---|
| `REDEEMABLE` | A credit with an active, verified issuer program — this is the only status with usable redemption value |
| `SUPPORTED_ASSET` | A target asset an admin added for exchanges; not redeemable credit |
| `UNVERIFIED` | A Stellar asset you hold that nobody has registered a program for |
| `SUSPENDED` | The issuer was revoked, or the program was suspended |
| `EXPIRED` | The issuer's signed policy has expired |
| `FROZEN` | The issuer has not (or no longer) authorized your trustline |

Native XLM balances are reported too, but only for fee purposes — they carry no credit value.

## Exchanging credit for something else

1. Ask for a quote: `POST /v1/exchange/quote` with the source asset, target asset, amount, and your slippage tolerance in basis points. You get back an expected amount, a minimum amount, and an expiry around 60 seconds out. No viable path means no quote — Unbound never shows a price it cannot deliver.
2. Create an intent from that quote: `POST /v1/exchange/intents` with an `Idempotency-Key`. You get back an unsigned transaction.
3. **Check it yourself before signing.** Decode the transaction and compare it against the quote you were shown; the minimum destination amount should match what the ledger will enforce.
4. Sign it with your own key and submit: `POST /v1/exchange/intents/{id}/submit`. A `200` means the ledger already decided (confirmed or failed); a `202` means it's still in flight — poll `GET /v1/exchange/intents/{id}` or just wait.

See [Exchange intents](../concepts/exchange-intents.md) for the exact state machine and the worked floor calculation.

## Redeeming credit with the merchant

1. `POST /v1/redemptions` with the asset, amount and your holder address (the amount must fall inside whatever min/max the issuer's policy allows). You get back an unsigned return transaction.
2. Sign and submit it: `POST /v1/redemptions/{id}/return`.
3. Now it's the merchant's turn. You'll see the redemption move to `RETURN_CONFIRMED`, then wait.
4. **If escrow mode was used** and the merchant never answers, once the deadline passes you can claim your own refund: `POST /v1/redemptions/{id}/refund` builds the on-chain refund transaction for you to sign and submit — you do not have to wait on the merchant or on Unbound once that deadline is reached.
5. **If native mode was used** and the merchant rejects, the response tells you `refundDue: true`. That refund is not automatic on-chain; if the merchant doesn't follow through, open a dispute.

See [Redemption lifecycle](../concepts/redemption-lifecycle.md) for exactly what NATIVE vs. ESCROW mode means for you, and which one you got is always visible on the redemption record.

## If something feels wrong

`POST /v1/disputes` with `kind: REDEMPTION` or `kind: EXCHANGE` and the subject's id lets you open exactly one live dispute per subject. A merchant has 7 days to respond before it's automatically escalated to a reviewer. A dispute resolution records a ruling — it does not move funds by itself; see [Guide: auditor](auditor.md) for how that side works.

{% hint style="warning" %}
This is a Testnet prototype with synthetic credit. Nothing here moves real money, and no step above has been exercised with a real phone wallet — only with the HTTP API directly and a scripted client.
{% endhint %}
