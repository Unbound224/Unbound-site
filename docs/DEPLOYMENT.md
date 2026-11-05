# Unbound — Environment, Deployment and Recovery

## Environment boundaries
- Local: deterministic Docker Compose services, Stellar local network/Testnet, synthetic users/fixtures.
- Staging: separate database, bucket, API credentials, signing identities, Testnet assets/contracts, observability.
- Production: requires security audit, real issuer/provider agreements and relevant jurisdictional legal/compliance review. Not included in preimplementation scaffold.

## Suggested variables (non-secret examples only)
```dotenv
APP_ENV=development
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
DATABASE_URL=postgresql://localhost:5432/unbound
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:3001
CHAIN_START_LEDGER=0
LOG_LEVEL=info
```
- Credentials to sign on-chain go into a secure secret manager or hardware-backed user wallet, never into a public mobile/web bundle.
- Signed store badge links are configured after actual publication; no fabricated App Store or Google Play app URLs.

## CI & GitHub setup
- GitHub Actions per repo: formatting/lint, schema checks, unit tests, dependency scanning; chain/devices smoke tests where supported.
- Branch protection and PR review recommended.
- Release tag points to tested sibling versions in an integration lockfile.
- All paths use offline/synthetic test fixtures, not real user financial records.

## Failure recovery
- Rebuild indexers from ledger cursor; compare DB projection vs chain truth.
- Restore DB backups after verifying transaction-intent reconciliation.
- Never republish user transactions solely because a client request timed out.
- Test signing-key rotation, dependency outages, stale quotes, malicious user input, insufficient balances and duplicate delivery.
- External reference infrastructure may change; check upstream project versions and licenses at build time.

## Hosted deployment (2026-11-05)

Vercel project `unbound-site` (domain `unbound-web1.vercel.app`), Production environment variables, all public values:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `/core` (the browser calls this site's same-origin proxy) |
| `CORE_PROXY_TARGET` | `https://unbound-core.onrender.com` (Unbound-core on Render, free plan) |

`next.config.ts` reads `CORE_PROXY_TARGET` at build time to create the `/core/*` rewrite, so changing it needs a new build.
Core and the Stellar gateway run on free Render instances: they sleep when idle (the first request after a pause can take 50
seconds or more) and core's SQLite data resets on every redeploy. Core refuses to start unless `APP_ENV=development`; this is a
development entrypoint, not a hardened production mode.
