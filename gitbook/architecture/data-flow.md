# Data flow

This page traces one request of each kind end to end through the real services, so it's clear which repository does what and where the ledger becomes the source of truth.

## Exchange: quote → intent → submit → settle

```mermaid
sequenceDiagram
    participant U as Holder (wallet)
    participant C as Unbound-core
    participant G as Unbound-stellar gateway
    participant L as Stellar Testnet
    U->>C: POST /v1/exchange/quote
    C->>G: ask for a strict-send path
    G->>L: Horizon path-finding
    L-->>G: candidate paths
    G-->>C: expected/min amount, expiry
    C-->>U: quote (expires in ~60s)
    U->>C: POST /v1/exchange/intents (Idempotency-Key, quoteId)
    C->>G: build unsigned strict-send tx
    G-->>C: unsigned XDR
    C-->>U: intent AWAITING_SIGNATURE + unsigned XDR
    U->>U: decode, re-check against quote, sign locally
    U->>C: POST /v1/exchange/intents/{id}/submit (signed XDR)
    C->>G: submit
    G->>L: submit transaction
    L-->>G: CONFIRMED / FAILED / unknown (timeout)
    G-->>C: result
    C-->>U: 200 CONFIRMED/FAILED, or 202 SUBMITTED/RECONCILING
```

If the result is unknown (a lost response, not a ledger rejection), the intent becomes `RECONCILING`. The chain worker is watching the same transaction hash against Horizon independently and reports the verdict back to core as a reconciliation event — this is why a lost HTTP response never needs a blind retry.

## Redemption (escrow mode): return → hold → issuer decision

```mermaid
sequenceDiagram
    participant U as Holder (wallet)
    participant C as Unbound-core
    participant G as Unbound-stellar gateway
    participant E as redemption-escrow contract
    participant M as Merchant (issuer key)
    U->>C: POST /v1/redemptions
    C->>G: escrow.open (amount, redemptionId, deadline)
    G->>E: build unsigned open_return
    G-->>C: unsigned XDR
    C-->>U: AWAITING_RETURN + unsigned XDR
    U->>C: POST /v1/redemptions/{id}/return (signed XDR)
    C->>G: submit
    G->>E: open_return (consumer-signed)
    E-->>G: ReturnOpened event, credit locked
    C-->>U: RETURN_SUBMITTED, then RETURN_CONFIRMED
    M->>C: POST /v1/merchants/me/redemptions/{id}/confirm
    C->>G: escrow.confirm
    G->>E: build unsigned confirm (issuer must sign)
    C-->>M: escrow.pendingXdr to sign
    M->>C: POST .../escrow/submit (issuer-signed)
    C->>G: submit
    G->>E: confirm (issuer-signed)
    E-->>G: ReturnConfirmed event, credit released to issuer
    C-->>M: FULFILLED
```

The same diagram with `reject` instead of `confirm` refunds the holder on-chain instead; if the merchant never responds, the holder calls `POST /v1/redemptions/{id}/refund` after the deadline instead of waiting on the merchant, and anyone's signed `expire_refund` closes it.

## Reconciliation path (the one that catches everything else)

```mermaid
flowchart LR
  TX["Any submitted transaction hash<br/>(exchange, native return, or escrow action)"]
  W["Chain worker<br/>watches pending hashes"]
  H["Horizon"]
  C["Unbound-core<br/>reconciliation.ingest"]
  G["OperationsGuard"]
  TX --> W
  W -- "poll" --> H
  H -- "CONFIRMED / FAILED" --> W
  W -- "reconciliation event<br/>{id, sourceRepo, schemaVersion, network, ledgerCursor, entityRef, status, observedAt}" --> C
  C -- "verdict matches local state" --> OK["Applied: intent/redemption moves to its terminal state"]
  C -- "verdict disagrees with local state" --> G
  G -- "SENSITIVE_ACTIONS_PAUSED (423)" --> Pause["Core pauses new redemptions/exchanges until a reviewer looks"]
```

This is the one path every state machine in Unbound ultimately depends on: nothing becomes `CONFIRMED`, `FULFILLED`, `REJECTED` or `EXPIRED` without either an immediate ledger verdict at submit time, or a later reconciliation event carrying the same thing. A discrepancy — the ledger saying one thing while core's database says another — never resolves itself silently; it pauses sensitive actions and waits for a human. See [Failure modes and recovery](failure-modes.md).
