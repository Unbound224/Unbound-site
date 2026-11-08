# API reference: auth and wallets

## Merchant / admin credentials

### `POST /v1/auth/register`

Self-registers a `merchant` account. Grants no authority until an admin verifies the merchant (see [Issuers and assets](issuers-and-assets.md)).

{% tabs %}
{% tab title="Request" %}
```json
{ "email": "shop@example.invalid", "password": "change-me-shop-1234" }
```
{% endtab %}
{% tab title="Response 201" %}
```json
{ "id": "acc_8f2c1d", "email": "shop@example.invalid" }
```
{% endtab %}
{% endtabs %}

Password must be 12+ characters. The equivalent schema (`Credentials`) is shared by login.

### `POST /v1/auth/login`

```json
{ "email": "shop@example.invalid", "password": "change-me-shop-1234" }
```

If the account has MFA enabled, omitting `code` returns `MFA_REQUIRED` (401); include it once you have a 6-digit TOTP code:

```json
{ "email": "admin@example.invalid", "password": "change-me-admin-123", "code": "483920" }
```

Response: `{ "token": "...", "role": "merchant", "accountId": "acc_8f2c1d" }`.

**Lockout:** 5 wrong attempts in a row locks the account for 15 minutes (`MAX_FAILURES = 5`, `LOCK_MS = 15 * 60_000`). A missing MFA code does **not** count as a failed attempt; a wrong, replayed or stale TOTP code does.

### `POST /v1/auth/mfa/enroll` / `.../activate` / `.../disable`

Admin-only. `enroll` returns `{ "secret": "...", "otpauthUri": "otpauth://totp/Unbound:admin@example.invalid?secret=...&issuer=Unbound" }` once — scan it into an authenticator app. `activate` with `{ "code": "123456" }` turns MFA on. `disable` also needs a currently valid code, so a stolen session token alone can never remove the second factor.

### `POST /v1/auth/password-reset` / `.../confirm`

`password-reset` always returns `202 { "accepted": true }` whether or not the email exists — this is deliberate, so the endpoint can't be used to enumerate accounts. At most 3 reset emails per account per hour; further requests are silently dropped (not an error, to avoid leaking account existence through timing). With no mail provider configured, the reset link is printed to the server console instead of emailed.

`confirm` takes `{ "token": "...", "password": "..." }`; the token is single-use and expires after 30 minutes, and on success **every** existing session for that account is revoked.

### `POST /v1/auth/logout`

Revokes the current session only. No body.

### `POST /v1/admin/accounts`

Admin-only. Creates a `merchant` or `admin` account directly: `{ "email": "...", "password": "...", "role": "admin" }`.

## Wallet challenge (holders)

### `POST /v1/wallets/challenge`

```json
{ "publicKey": "GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX" }
```

Response: `{ "challengeId": "ch_...", "message": "unbound-challenge:ch_...:<random>" }`. The challenge expires after 5 minutes.

### `POST /v1/wallets/verify`

```json
{ "challengeId": "ch_...", "signature": "<base64 ed25519 signature of message>", "role": "r" }
```

Response: `{ "token": "...", "actor": { "id": "usr_...", "role": "user" } }`.

A challenge can be verified **exactly once**: a correct signature submitted a second time for the same challenge is refused with `CHALLENGE_INVALID`, the same code a wrong-key signature gets. The same Stellar public key always maps to the same holder account, confirmed directly from `Unbound-core`'s own test suite (`tests/wallets-redemption.test.ts`):

```ts
const ch = await w.app.wallets.createChallenge(kp.publicKey());
const sig = Buffer.from(kp.sign(Buffer.from(ch.message))).toString('base64');
const v = await w.app.wallets.verifyChallenge(ch.challengeId, sig, 'r');
// a second verify of the SAME challenge, even with a correct signature, now fails:
await expect(w.app.wallets.verifyChallenge(ch.challengeId, sig, 'r'))
  .rejects.toMatchObject({ code: 'CHALLENGE_INVALID' });
```

## Portfolio

### `GET /v1/portfolio`

Holder-only. Returns every ledger balance across the caller's bound wallets, classified. See [Guide: holder](../guides/holder.md) for the full status table (`REDEEMABLE`, `SUPPORTED_ASSET`, `UNVERIFIED`, `SUSPENDED`, `EXPIRED`, `FROZEN`). Example shape:

```json
{
  "asOf": "2026-11-04T10:00:00.000Z",
  "wallets": ["GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX"],
  "holdings": [
    {
      "wallet": "GBC5IXHMZLVVNUKPS55ZZ4BHXEBYCCZBBBCKJYYYHLHOYMKWABBTV5FX",
      "asset": { "code": "SHOP", "issuer": "GDRIDJU3VKOYAQXMI4WVEVSLFATOSOK4JAVJQMYK2D5YGIY4Z6ALYQWX" },
      "balance": "100.0000000",
      "status": "REDEEMABLE",
      "program": { "id": "prg_1", "unitOfAccount": "1 SHOP = 1 USD of store credit", "expiresAt": "2027-11-04T00:00:00Z", "jurisdiction": "US-DE", "contact": "support@example.invalid" }
    }
  ],
  "native": [{ "wallet": "GBC5...", "balance": "9999.9999900" }],
  "notice": "Only REDEEMABLE credit can be exchanged or redeemed. No value is implied for any other status."
}
```
