# API reference: redemptions and disputes

See [Redemption lifecycle](../concepts/redemption-lifecycle.md) for the full state machine and NATIVE vs. ESCROW mode. Field names and error codes below are copied from `Unbound-core/src/modules/redemption/service.ts` and `src/modules/disputes/service.ts`.

## Redemptions

### `POST /v1/redemptions`

Requires `Idempotency-Key`. Body (`RedemptionCreate` schema exactly):

```json
{
  "asset": { "code": "SHOP", "issuer": "GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX" },
  "amount": "30.0000000",
  "holder": "GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX"
}
```

Response `201`: `{ "id": "red_...", "state": "AWAITING_RETURN", "mode": "NATIVE" | "ESCROW", "unsignedXdr": "...", "returnTxHash": "..." }`.

Refusals, taken directly from the service's real checks:

| Code | When |
|---|---|
| `REDEMPTION_UNAVAILABLE` | No active verified program for the asset, the asset is a supported target (not credit), amount is below the policy's `minUnits`, amount is above `maxUnitsPerRequest`, the merchant was revoked, or the policy expired |
| `FORBIDDEN` | `holder` isn't a wallet bound to the calling user |
| `IDEMPOTENCY_CONFLICT` | Same key, different `asset`/`amount` |

### `POST /v1/redemptions/{id}/return`

Submits the holder-signed return transaction. Replaying this after it already moved past `AWAITING_RETURN` just returns the current record (idempotent), not an error.

### `GET /v1/redemptions/{id}`

Visible to the owning holder, the owning merchant, or any admin; everyone else gets `NOT_FOUND` (never `FORBIDDEN` — existence isn't revealed to the wrong party).

### `POST /v1/redemptions/{id}/refund`

Holder-only. Requests the escrow timeout refund once the deadline has passed; returns `escrow.pendingXdr` for the holder to sign. Refused with `INVALID_STATE` if the mode isn't `ESCROW`, the state isn't `RETURN_CONFIRMED`, or the deadline hasn't arrived yet.

### `POST /v1/redemptions/{id}/escrow/submit`

Submits the holder-signed `expire_refund` (or the merchant-signed confirm/reject from the merchant endpoints below — the same submit path serves both signer roles, checked against who is allowed to sign which pending action).

## Merchant-side redemption actions

### `GET /v1/merchants/me/redemptions`

Lists the calling merchant's redemptions only.

### `POST /v1/merchants/me/redemptions/{id}/confirm`

| Mode | Behavior |
|---|---|
| NATIVE | `200`, state becomes `FULFILLED` immediately |
| ESCROW | `202`, response includes `escrow.pendingXdr` — the issuer signs it and submits via the escrow submit endpoint below; `FULFILLED` follows once that confirms on-chain |

Calling it again after `FULFILLED` is idempotent (returns `FULFILLED` again, not an error). Calling it from any state other than `RETURN_CONFIRMED` is `INVALID_STATE` — real test-verified message: *"cannot confirm a redemption in RETURN_SUBMITTED; the returned credit must be confirmed on the ledger first."*

### `POST /v1/merchants/me/redemptions/{id}/reject`

```json
{ "reason": "item out of stock" }
```

`reason` must be 3-500 characters. NATIVE: `200`, `{ "state": "REJECTED", "refundDue": true }`. ESCROW: `202` with `escrow.pendingXdr` for the issuer to sign; once confirmed, `refundDue: false` because the contract already refunded the holder on-chain.

### `POST /v1/merchants/me/redemptions/{id}/escrow/submit`

Submits the issuer-signed confirm/reject transaction built above.

## Disputes

### `POST /v1/disputes`

```json
{ "kind": "REDEMPTION", "subjectRef": "red_8f2c1d", "reason": "merchant has not responded in 10 days" }
```

`kind` is `REDEMPTION` or `EXCHANGE`; `reason` is 10-2000 characters. Exactly one live dispute is allowed per subject — opening a second one while the first is still open just returns the existing dispute.

### `GET /v1/disputes` / `GET /v1/disputes/{id}`

Visible to the opener, the involved merchant (redemption disputes only), or any admin.

### `POST /v1/disputes/{id}/messages`

```json
{ "text": "we shipped the replacement on the 3rd" }
```

A merchant's first message on an `OPEN` dispute automatically moves it to `MERCHANT_RESPONDED`.

### `POST /v1/disputes/{id}/withdraw`

Opener-only. Closes the dispute as `WITHDRAWN`.

### `POST /v1/admin/disputes/{id}/resolve`

Admin-only:

```json
{ "outcome": "FOR_HOLDER", "note": "merchant did not respond within the window; refund is owed" }
```

Closes the dispute as `RESOLVED_FOR_HOLDER` or `RESOLVED_FOR_MERCHANT`. This **records a ruling and never moves funds** — see [Guide: auditor](../guides/auditor.md).

### Dispute states

`OPEN` → `MERCHANT_RESPONDED` → `ESCALATED` (automatic after 7 days unanswered) → `RESOLVED_FOR_HOLDER` / `RESOLVED_FOR_MERCHANT` / `WITHDRAWN` (terminal).
