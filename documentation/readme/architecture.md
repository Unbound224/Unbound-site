# Architecture and repository relationships

Each product is split by deployable responsibility. Smart contracts and client-facing applications change at different rates, use different toolchains and need scoped review.

## Sideband

Payer mobile and provider gateway exchange signed voucher commitments through a local transport. The Soroban channel settles the latest valid commitment. The protocol repository is shared behavior; channels verifies and settles; gateway and mobile own runtime concerns.

## Torrent

The web client reads indexed state. The API validates that state and constructs a transaction a wallet signs. The Soroban escrow is the authority for funds and payout rights. The indexer independently rebuilds events and reconciles against contract state.

## Unbound

Web or mobile clients work through the policy API and Stellar gateway, but ledger confirmation decides final state. The Soroban redemption escrow is the protected exception path. Holders and issuers sign with their own keys; the service does not custody keys or funds.
