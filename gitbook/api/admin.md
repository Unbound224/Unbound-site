# API reference: admin

All endpoints on this page require the `admin` role.

## Jobs

### `GET /v1/admin/jobs`

Status of every scheduled maintenance job:

```json
{
  "jobs": [
    { "name": "recover-stuck-intents", "intervalMs": 60000, "lastRunAt": "2026-11-04T10:19:00.000Z", "running": false },
    { "name": "escalate-overdue-disputes", "intervalMs": 300000, "lastRunAt": "2026-11-04T10:15:00.000Z", "running": false },
    { "name": "reconcile-escrows", "intervalMs": 120000, "lastRunAt": "2026-11-04T10:18:00.000Z", "running": false }
  ]
}
```

(`sync-trusted-assets`, documented in [How it works](../getting-started/how-it-works.md), runs on its own 30-second loop outside the `Job` list above.)

### `POST /v1/admin/jobs/{name}/run`

Runs the named job immediately. It never overlaps a run already in progress — a single-flight lease lock (`src/jobs/lock.ts`) guards this, so calling it twice in quick succession is safe, not a race.

## Reconciliation ingestion

### `POST /v1/admin/ledger-events`

Ingests a reconciliation event from `Unbound-stellar`'s chain worker. Shape (from `docs/ARCHITECTURE.md`'s reconciliation event contract):

```json
{
  "id": "evt_9f1a",
  "sourceRepo": "unbound-stellar",
  "schemaVersion": "1.0",
  "network": "TESTNET",
  "ledgerCursor": "5557552",
  "entityRef": "5879422d5f67f3388f26f525a7cadaa9640eaa1c521fed272de3fc3dfbe775e1",
  "status": "CONFIRMED",
  "observedAt": "2026-11-04T10:20:40.000Z"
}
```

In practice this endpoint is called by the chain worker process, authenticated with an admin session token the worker obtains by logging in (never stored long-term) — not typically called by a human operator.

## Merchants and targets

Covered in [Issuers and assets](issuers-and-assets.md): `GET /v1/admin/merchants`, `POST /v1/admin/merchants/{id}/verify`, `POST /v1/admin/merchants/{id}/revoke`, `POST /v1/admin/targets`.

## Accounts

### `POST /v1/admin/accounts`

Creates a `merchant` or `admin` account directly, bypassing self-registration — covered in [Auth and wallets](auth-and-wallets.md).

## Disputes

`POST /v1/admin/disputes/{id}/resolve` — covered in [Redemptions and disputes](redemptions-and-disputes.md).

## What admin cannot do through this API

There is no endpoint to move escrowed funds, override a ledger-confirmed state, or touch a holder's wallet key. The only on-chain lever an admin has anywhere in the system is the escrow contract's own `set_paused`, which blocks **new** `open_return` calls only (see [Contract functions](../contract/functions.md)) — and that's called directly against the contract by whoever holds the deployed admin key, not through this HTTP API at all.
