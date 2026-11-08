# Guide: merchant (issuer)

You run a business that wants to let customers trade or redeem store credit you've issued on Stellar. This guide covers both the console (`/merchant` on the live site) and the underlying API calls it makes, so it stays accurate even if the console's UI changes.

## Applying

1. Register an account: `POST /v1/auth/register` with an email and a password of at least 12 characters. This creates a `merchant` account with **no authority yet**.
2. Apply: `POST /v1/merchants/apply` with your legal name, jurisdiction and contact details.
3. A reviewer looks at your application and either verifies it (with an internal evidence reference — a ticket or document id, never the document itself) or rejects it. You cannot self-verify, and nothing in the system claims to certify your business on its own; see [Guide: auditor](auditor.md) for what that review actually involves.

You'll be locked out for 15 minutes after 5 failed login attempts in a row — this applies to every merchant and admin account, not just yours.

## Registering a credit program

Once verified, register your asset: `POST /v1/merchants/me/assets` with the asset code, your issuer public key, and a **signed redemption policy**.

The policy is a JSON document you sign with your issuer's Stellar key (Ed25519, over the canonical JSON of the policy without the signature field itself). It states:

- Your legal identity and a registration reference
- The asset's unit of account (for example, "1 SHOP = 1 USD of store credit")
- Face value and redemption limits (minimum and maximum per request)
- An expiry date — after this, your credit stops being eligible until you republish
- Jurisdiction, refund policy, contact, and any KYC requirements
- Explicit `tokenizationAuthorized: true` and `transferAllowed: true` — you have to say yes to both

See [Credit, issuers and policies](../concepts/credit-and-issuers.md) for the full field table and every validation error code. Unknown fields are rejected outright; there is no lenient mode.

**Two things your Stellar account needs before any of this works:** your issuer account must have `AUTH_REQUIRED` and `AUTH_REVOCABLE` set, and if you want redemption **escrow** mode available for your asset, you must call `set_authorized` once on your asset's Stellar Asset Contract to let the escrow contract hold it. Without that second step, every redemption of your credit falls back to the plain native return automatically — nothing breaks, you just don't get the on-chain refund guarantee for your holders.

## Handling the redemption queue

`GET /v1/merchants/me/redemptions` lists redemptions holders have sent back to you. For each one in `RETURN_CONFIRMED`:

- **Confirm fulfilment**: `POST /v1/merchants/me/redemptions/{id}/confirm`. In native mode, this just marks it `FULFILLED` (the credit was already burned when it was returned to you). In escrow mode, you get back an unsigned transaction (`escrow.pendingXdr`) that you sign with your **issuer key** and submit via `POST /v1/merchants/me/redemptions/{id}/escrow/submit` — only then does the credit actually move from the escrow to you.
- **Reject**: `POST /v1/merchants/me/redemptions/{id}/reject` with a reason (3-500 characters). Native mode: the holder gets `refundDue: true` and you owe them an off-chain refund (settle it, or expect a dispute if you don't). Escrow mode: you sign the on-chain refund the same way as confirm, and the holder is refunded directly from the contract — nothing is owed off-chain.

You must act **before the deadline** (7 days by default) in escrow mode; after that, only the holder's timeout refund is possible, and your confirm attempt is refused with `INVALID_STATE`.

## The merchant console (`/merchant`)

The live site's merchant console does the same calls through a browser: sign in, see your verified programs and redemption queue with escrow state and the deadline, confirm/reject with a reason, and sign escrow transactions with a Freighter wallet (or by pasting a signed envelope). As of this writing, escrow signing in the console is built and tested against a **mocked** wallet; it has not yet been tried end to end with a real Freighter install — see the site's own status table for the current state of that specific path.

## Disputes

If a holder opens a dispute against one of your redemptions, you'll see it and have 7 days to respond (`POST /v1/disputes/{id}/messages`) before it escalates automatically to a reviewer. A reviewer's resolution records a ruling for the record; it does not move any funds on its own.

{% hint style="warning" %}
A Stellar asset you issue is not by itself proof to anyone that you'll honor it. Unbound's eligibility check (verified + active + valid policy) is a gate on *being listed as redeemable*, not a legal guarantee, and this is unaudited Testnet software with synthetic credit only.
{% endhint %}
