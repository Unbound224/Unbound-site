# Local setup

These are the real quick-start commands from each repository's README, run as documented. All three backend/frontend repos need **Node 22+**; the contract additionally needs Rust.

## Unbound-core (the API)

```bash
npm ci
npm run check                      # lint + typecheck + tests + build

export DATABASE_FILE=./data/dev.db \
  BOOTSTRAP_ADMIN_EMAIL=admin@example.invalid BOOTSTRAP_ADMIN_PASSWORD='change-me-admin-123' \
  SEED_MERCHANT_EMAIL=shop@example.invalid SEED_MERCHANT_PASSWORD='change-me-shop-1234'
npm run seed                       # verified merchant, SHOP credit program, a USDC target (synthetic)
npm start                          # http://127.0.0.1:3001
curl http://127.0.0.1:3001/v1/targets
```

{% hint style="warning" %}
**Real gap found on a live run:** starting with `DATABASE_FILE=./data/dev.db` fails if the `data/` directory doesn't exist yet. Create it first (`mkdir -p data` / `New-Item -ItemType Directory -Force data`). This is documented in [Failure modes](../architecture/failure-modes.md) because it actually broke a real Testnet run before being noticed.
{% endhint %}

Everything above runs fully offline against the labeled `FakeStellarGateway` — no Testnet connection needed. To talk to a real `Unbound-stellar` gateway instead, also set `STELLAR_GATEWAY_URL` and `STELLAR_GATEWAY_TOKEN` (see [Environment variables](environment-variables.md)).

## Unbound-stellar (SDK, gateway, contract)

```bash
npm ci
npm run check                      # lint + typecheck + tests + build
npx tsx scripts/m1-demo.ts         # offline demo: issue, quote, settle, a refused no-trustline route
```

The demo runs on `SimulatedLedger`, an in-memory test adapter that still verifies real XDR signatures, sequence numbers and time bounds — its hashes are not Testnet hashes, so don't confuse its output with the real evidence in [Testnet evidence](../testnet-evidence.md).

The contract (needs Rust stable plus the `wasm32v1-none` target; on Windows set `RUSTUP_TOOLCHAIN=stable-x86_64-pc-windows-msvc`):

```bash
cd contracts
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
cd ..
DRY_RUN=1 scripts/deploy-testnet.sh   # prints the stellar-cli steps; drop DRY_RUN to deploy for real
```

Running the gateway against real Testnet (needs your own random `GATEWAY_TOKEN`, 16+ characters):

```bash
export GATEWAY_TOKEN=<random 16+ chars> ESCROW_CONTRACT_ID=CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C
npm run gateway                    # http://127.0.0.1:3002, Horizon + Soroban RPC on Testnet
```

See [Build, test, deploy](../contract/build-test-deploy.md) for the contract toolchain in full.

## Unbound-site (landing page + consoles)

```bash
npm ci
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=/core, CORE_PROXY_TARGET=http://127.0.0.1:3001
npm run dev                    # http://localhost:3000
npm run check                  # lint + typecheck + tests + production build — the same steps CI runs
```

The landing page works with no backend running at all. The `/merchant` and `/admin` consoles need a running `Unbound-core` (the steps above) — point `CORE_PROXY_TARGET` at it.

## Wiring all three together

1. Start `Unbound-core` with a real gateway (`STELLAR_GATEWAY_URL` pointing at a running `Unbound-stellar` gateway, plus `STELLAR_ESCROW_ENABLED=true` if you want escrow mode).
2. Start the `Unbound-stellar` gateway against Testnet, with `ESCROW_CONTRACT_ID` set to a deployed contract.
3. Start `Unbound-site` with `CORE_PROXY_TARGET` pointing at core.
4. Core's `sync-trusted-assets` job (every 30 seconds, also at startup) pushes the eligible-issuer list to the gateway — without it, the gateway refuses every asset as untrusted. This exact failure happened on a real run; see [Failure modes](../architecture/failure-modes.md).

This is the same topology `Unbound-core/scripts/testnet-e2e.ts` and `scripts/testnet-exchange.ts` actually exercised against live Testnet — see [Testnet evidence](../testnet-evidence.md) for what that run proved.
