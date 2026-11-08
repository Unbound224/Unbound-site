# API reference: issuers and assets

## Discovery (public, no auth)

### `GET /v1/assets`

Lists eligible redeemable assets. Optional `?issuer=` filter.

```json
{ "assets": [{ "code": "SHOP", "issuer": "GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX" }] }
```

### `GET /v1/assets/{id}`

Returns one eligible asset and its signed redemption policy in full (see the field table in [Credit, issuers and policies](../concepts/credit-and-issuers.md)).

### `GET /v1/targets`

Lists assets a holder may receive in an exchange — not redeemable credit. `{ "targets": [{ "code": "USDC", "issuer": "..." }] }`.

## Merchant application

### `POST /v1/merchants/apply`

```json
{ "legalName": "Example Shop LLC", "jurisdiction": "US-DE", "contact": "support@example.invalid" }
```

Validation (from the real `MerchantApply` OpenAPI schema): `legalName` 2-200 chars, `jurisdiction` 2-100 chars, `contact` 3-200 chars, no additional properties.

### `POST /v1/merchants/me/assets`

Registers a credit program with a signed policy:

```json
{
  "assetCode": "SHOP",
  "issuerPublicKey": "GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX",
  "policy": {
    "schemaVersion": "1.0",
    "legalIdentity": { "legalName": "Example Shop LLC", "registrationRef": "DE-REG-00123" },
    "assetCode": "SHOP",
    "issuerPublicKey": "GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX",
    "unitOfAccount": "1 SHOP = 1 USD of store credit",
    "faceValue": { "amountPerUnit": "1.0000000", "currency": "USD" },
    "redemptionLimits": { "minUnits": "1", "maxUnitsPerRequest": "500" },
    "expiresAt": "2027-11-04T00:00:00Z",
    "jurisdiction": "US-DE",
    "refundPolicy": "Rejected redemptions are refunded within 5 business days.",
    "contact": "support@example.invalid",
    "kycRequirements": "none",
    "tokenizationAuthorized": true,
    "transferAllowed": true,
    "signature": "<base64 ed25519 signature over the canonical JSON, issuer key, signature field omitted>"
  }
}
```

Validation errors use `POLICY_INVALID` with reasons drawn from: `SCHEMA_INVALID`, `SIGNATURE_INVALID`, `ISSUER_KEY_MISMATCH`, `ASSET_CODE_MISMATCH`, `EXPIRED`, `LIMITS_INCONSISTENT`. See [Credit, issuers and policies](../concepts/credit-and-issuers.md) for what each one means.

## Reviewer actions (admin-only)

### `GET /v1/admin/merchants`

Lists every merchant and its status (`APPLIED`, `VERIFIED`, `REJECTED`, `REVOKED`).

### `POST /v1/admin/merchants/{id}/verify`

```json
{ "evidenceRef": "ticket-4821" }
```

### `POST /v1/admin/merchants/{id}/revoke`

```json
{ "reason": "failed KYC re-check" }
```

Revoking a merchant immediately suspends **every** credit program it owns — there's no partial revocation path.

### `POST /v1/admin/targets`

```json
{ "code": "USDC", "issuer": "GCHGR7UN3XYKUEZJAZ74QSXAJOB7DIOGFVDS5KD3LDMNQVBO3HHOU5QF" }
```

Adds a swap target. This is the exact call that registered the real USDC target used in the Testnet exchange run — see [Testnet evidence](../testnet-evidence.md).

{% hint style="info" %}
`MerchantApply`, `RedemptionCreate` and `QuoteRequest` schemas on this and the following pages are reproduced directly from `Unbound-core/openapi/openapi.json`'s `components.schemas`, including field names, types and length limits — not re-typed from memory.
{% endhint %}
