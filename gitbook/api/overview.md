# API reference: overview

`Unbound-core` exposes one versioned HTTP API, `/v1/*`, documented as OpenAPI 3.1 at [`openapi/openapi.json`](https://github.com/Unbound224/Unbound-core/blob/main/openapi/openapi.json) and snapshot-tested in CI so the spec can't silently drift from the real router. This page covers what's true across every endpoint; the following pages group the 40+ endpoints by area with real request/response shapes.

{% hint style="info" %}
The hosted instance (`https://unbound-core.onrender.com`) is a **development entrypoint**: it only starts with `APP_ENV=development`, its SQLite data resets on every redeploy, and it sleeps when idle (first request after a pause can take 50+ seconds). See [Try it](../getting-started/try-it.md).
{% endhint %}

## Base URL and versioning

| Environment | Base URL |
|---|---|
| Local | `http://127.0.0.1:3001` |
| Hosted (Testnet, development entrypoint) | `https://unbound-core.onrender.com` |

Every path is under `/v1`. There is no unversioned or `/v2` surface today.

## Authentication

Two separate schemes, because holders and merchants/admins authenticate differently:

| Who | How | Lifetime |
|---|---|---|
| Holder (`user`) | Wallet challenge/verify (`POST /v1/wallets/challenge` then `POST /v1/wallets/verify`) — proves control of a Stellar key, not a password | Session token, 1 hour |
| Merchant / admin | Email + password (`POST /v1/auth/login`), 12+ character password, optional 6-digit TOTP code for admins with MFA enabled | Session token until logout or password reset |

Every authenticated endpoint takes the session token as a bearer token: `Authorization: Bearer <token>`.

## Idempotency

Every endpoint that creates or submits something state-changing requires an `Idempotency-Key` header, 8-128 characters:

- The same key with the same request body returns the same record (safe to retry).
- The same key with a **different** body returns `IDEMPOTENCY_CONFLICT` (HTTP 409).

This applies to, among others, `POST /v1/exchange/intents`, `POST /v1/exchange/intents/{id}/submit`, and `POST /v1/redemptions`.

## Error shape

Every error response has the same JSON shape (`Error` schema):

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "invalid redemption request",
    "requestId": "req_7f2a1c9e"
  }
}
```

`message` is always safe to show a user — it never contains secrets or internals. `requestId` ties the error back to the server's own audit log for support purposes.

## Error codes and HTTP status

Copied directly from `Unbound-core/src/common/errors.ts`:

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Request body or header failed schema validation |
| `UNAUTHENTICATED` | 401 | Missing/invalid credentials, bad session token, or too many login attempts |
| `CHALLENGE_INVALID` | 401 | Wallet challenge was wrong, replayed, expired, or already used |
| `MFA_REQUIRED` | 401 | Password was correct but a TOTP code is required and missing |
| `FORBIDDEN` | 403 | Authenticated, but not allowed to act on this resource |
| `NOT_FOUND` | 404 | Resource doesn't exist, or exists but you can't see it (same response either way) |
| `INVALID_STATE` | 409 | The requested transition isn't legal from the resource's current state |
| `IDEMPOTENCY_CONFLICT` | 409 | Same `Idempotency-Key`, different request body |
| `QUOTE_EXPIRED` | 410 | The quote's expiry has passed |
| `ASSET_NOT_ELIGIBLE` | 422 | Asset has no active, verified, unexpired program |
| `MERCHANT_NOT_VERIFIED` | 422 | Related merchant isn't `VERIFIED` |
| `POLICY_INVALID` | 422 | Redemption policy failed validation |
| `NO_ROUTE` | 422 | No viable exchange path exists |
| `GATEWAY_REJECTED` | 422 | The Stellar gateway refused the request (includes escrow unavailability) |
| `UNKNOWN_NETWORK` | 422 | Request named a network other than Testnet |
| `REDEMPTION_UNAVAILABLE` | 422 | Credit has no active, verified, in-limits redemption program |
| `PAYLOAD_TOO_LARGE` | 413 | Request body exceeded the size limit |
| `SENSITIVE_ACTIONS_PAUSED` | 423 | A reconciliation discrepancy has paused new redemptions/exchanges |
| `INTERNAL` | 500 | Unexpected server error |

## CORS

By default core sends **no** CORS headers (same-origin only — this is why `Unbound-site`'s browser calls go through its own `/core/*` proxy rather than calling core cross-origin directly). Set `CORS_ALLOWED_ORIGINS` to a comma-separated, exact origin list to allow a browser on another origin to call core directly.

## Amounts

Every amount in every request and response is a **decimal string with exactly 7 places** (for example `"80.0000000"`), matching Stellar's base unit: 1 unit = 10,000,000 stroops. Amounts never pass through floating point anywhere in the pipeline, client included.

The following pages group endpoints by area:

- [Auth and wallets](auth-and-wallets.md)
- [Issuers and assets](issuers-and-assets.md)
- [Exchange](exchange.md)
- [Redemptions and disputes](redemptions-and-disputes.md)
- [Admin](admin.md)
