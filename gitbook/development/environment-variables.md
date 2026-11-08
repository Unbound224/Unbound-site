# Environment variables

Every variable below is copied from the real `.env.example` in each repository. None of these are secrets by themselves — they're placeholders — but never commit a filled-in `.env` with real values.

## Unbound-core

| Variable | Default / example | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Core refuses to start in anything else; there is no hardened production mode yet |
| `STELLAR_NETWORK` | `testnet` | Any other value is refused |
| `PORT` | `3001` | HTTP port |
| `DATABASE_FILE` | unset (in-memory) | SQLite file for durable storage; omit for ephemeral in-memory storage |
| `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` | unset | Creates the first admin account at startup, dev only |
| `STELLAR_GATEWAY_URL` | unset (uses the fake gateway) | Point at a real `Unbound-stellar` gateway instead of `FakeStellarGateway` |
| `STELLAR_GATEWAY_TOKEN` | unset | Bearer token the gateway expects; shared with the gateway's own `GATEWAY_TOKEN` |
| `STELLAR_ESCROW_ENABLED` | unset (`false`) | Turns on the in-memory `FakeEscrow` with the fake gateway, or real escrow mode with a real gateway (also needs `ESCROW_CONTRACT_ID` on the gateway side) |
| `ESCROW_WINDOW_HOURS` | `168` (7 days) | Merchant answer window for new escrowed redemptions; the contract itself allows 1-720 hours |
| `CORS_ALLOWED_ORIGINS` | unset (same-origin only) | Exact, comma-separated origins allowed to call core from a browser |
| `JOBS_ENABLED` | unset (`false` means jobs don't run) | Turns on the in-process maintenance jobs |
| `PASSWORD_RESET_URL` | `http://localhost:3000/merchant/reset-password` | Where reset emails point; with no mail provider configured, reset emails print to the server console instead |
| `MFA_ENCRYPTION_KEY` | unset | 32-byte (64 hex char) key sealing TOTP secrets at rest; without it, secrets are stored unsealed (dev only) |
| `MAIL_PROVIDER` | unset (dev console outbox) | Set to `resend` to send real email |
| `RESEND_API_KEY` / `MAIL_FROM` | unset | Needed only when `MAIL_PROVIDER=resend` |

## Unbound-stellar

| Variable | Default / example | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Same convention as core |
| `STELLAR_NETWORK` | `testnet` | Any other passphrase is refused |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` | Classic Stellar API |
| `GATEWAY_TOKEN` | none (generate your own, 16+ chars) | Bearer token the gateway requires; shared with core's `STELLAR_GATEWAY_TOKEN` |
| `PORT` | `3002` | Gateway HTTP port |
| `STATE_DIR` | `./state` | Where the worker's pending-hash queue persists |
| `CORE_URL` | `http://127.0.0.1:3001` | Where the chain worker reports reconciliation events |
| `CORE_TOKEN` | unset | Worker's session token for core (obtained by logging in; never stored long-term) |
| `ESCROW_CONTRACT_ID` | unset (native-only fallback) | Deployed redemption-escrow contract id, printed by `scripts/deploy-testnet.sh` |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC, used only for the escrow contract |

## Unbound-site

| Variable | Default / example | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Same convention |
| `STELLAR_NETWORK` | `testnet` | Informational / consistency with the other repos |
| `NEXT_PUBLIC_API_URL` | `/core` | Where the browser calls core; the site's own same-origin proxy, never a direct cross-origin call |
| `CORE_PROXY_TARGET` | `http://127.0.0.1:3001` | What the `/core/*` rewrite actually forwards to; read at **build** time by `next.config.ts`, so changing it needs a rebuild |
| `NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` | unset | Official store badges only render when set to a real `apps.apple.com` / `play.google.com` URL. Unset today — the app is not in any store — so the UI shows "Download for Android (beta APK)" and "iOS - coming soon" instead. |

## Hosted (production) values in use today

Unbound-site's Vercel project sets these two **public** variables in its Production environment (from `docs/DEPLOYMENT.md`):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `/core` |
| `CORE_PROXY_TARGET` | `https://unbound-core.onrender.com` |

See [Deployment](../deployment.md) for the full Render/Vercel topology these variables plug into.
