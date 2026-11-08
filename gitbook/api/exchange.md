# API reference: exchange

See [Exchange intents](../concepts/exchange-intents.md) for the full state machine, the quote-floor formula and live Testnet evidence. This page covers the three calls directly.

## `POST /v1/exchange/quote`

Request body (`QuoteRequest` schema, reproduced exactly — `additionalProperties: false`):

```json
{
  "schemaVersion": "1.0",
  "requestId": "q-req-0001",
  "sourceAsset": { "code": "SHOP", "issuer": "GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX" },
  "targetAsset": { "code": "USDC", "issuer": "GCHGR7UN3XYKUEZJAZ74QSXAJOB7DIOGFVDS5KD3LDMNQVBO3HHOU5QF" },
  "sourceAmount": "80.0000000",
  "slippageBps": 100,
  "destinationAccount": "GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX",
  "network": "TESTNET"
}
```

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | const `"1.0"` | |
| `requestId` | string, 1-100 | Caller-supplied correlation id |
| `sourceAsset` / `targetAsset` | `{ code, issuer }` | `code` matches `^[A-Za-z0-9]{1,12}$`, `issuer` is exactly 56 characters |
| `sourceAmount` | string | Decimal, 7 places |
| `minimumDestinationAmount` | string, optional | Caller's own floor, if tighter than the computed one |
| `slippageBps` | integer 0-1000 | Basis points |
| `destinationAccount` | string, 56 chars | Where the output lands |
| `network` | const `"TESTNET"` | Anything else is refused |

Response (`201`): expected and minimum destination amount, fee estimate, expiry — see the worked example in [Exchange intents](../concepts/exchange-intents.md#the-floor-with-numbers). No viable path means no quote at all, not a bad quote.

## `POST /v1/exchange/intents`

Requires an `Idempotency-Key` header (8-128 chars). Body references the quote id from the previous step. Response: the intent in `AWAITING_SIGNATURE` plus an unsigned transaction XDR.

The real captured behavior: creating an intent twice with the same `Idempotency-Key` (`idem-key-0001`) and the same body returns the **same** `AWAITING_SIGNATURE` intent both times — not a new one and not an error.

## `GET /v1/exchange/intents/{id}`

Returns the current state. No side effects.

## `POST /v1/exchange/intents/{id}/submit`

Body: the user-signed transaction XDR.

| HTTP | Resulting state | Meaning |
|---|---|---|
| 200 | `CONFIRMED` or `FAILED` | The ledger already decided |
| 202 | `SUBMITTED` or `RECONCILING` | In flight — poll the intent or wait for a reconciliation event |

It never reports success speculatively. An honest "don't know yet" is always a 202, never a 200.

## Real Testnet result

A real exchange of 5 SHOP for USDC through core and the gateway reached `CONFIRMED`: transaction [`5879422d5f…`](https://stellar.expert/explorer/testnet/tx/5879422d5f67f3388f26f525a7cadaa9640eaa1c521fed272de3fc3dfbe775e1) at ledger 5557552. Known gap, disclosed rather than hidden: `amountOutActual` stays `null` when an intent confirms synchronously at submit — only the asynchronous worker/reconciliation path fills it in today.
