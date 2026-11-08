# Build, test, deploy

Everything on this page is a real command from `Unbound-stellar`, copied from its README and CI workflow (`.github/workflows/contracts.yml`), not invented for the docs.

## Toolchain

| Tool | Version |
|---|---|
| Rust | stable, target `wasm32v1-none` |
| `soroban-sdk` | `29.0.1` |
| `stellar-cli` | `27.1.0` (used for the real Testnet deployment) |

{% hint style="warning" %}
On Windows, set `RUSTUP_TOOLCHAIN=stable-x86_64-pc-windows-msvc` before running the Rust commands below.
{% endhint %}

## Build and test locally

```bash
cd contracts
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

`cargo test` runs `src/test.rs` (the functional and auth tests) and `src/test_golden.rs` (golden XDR fixtures shared with the TypeScript decoder, at `fixtures/soroban/redemption-escrow.v1.json`), plus the seeded randomized invariant test described in [Contract functions](functions.md).

## Build the deployable wasm

`soroban-sdk` 29 requires the build system to declare spec-shaking support before it will produce a wasm:

```bash
export SOROBAN_SDK_BUILD_SYSTEM_SUPPORTS_SPEC_SHAKING_V2=1
cargo build --locked --release --target wasm32v1-none
ls -l target/wasm32v1-none/release/unbound_redemption_escrow.wasm
```

This proves the contract compiles for `wasm32v1-none`. A real deployment instead uses `stellar contract build`, which shakes the spec itself — that's what `scripts/deploy-testnet.sh` calls.

## Deploy to Testnet

```bash
cd ..                               # repo root
DRY_RUN=1 scripts/deploy-testnet.sh # prints every stellar-cli step without sending anything
scripts/deploy-testnet.sh           # drop DRY_RUN to actually deploy
```

The script:

1. Builds and uploads the contract wasm.
2. Deploys a new contract instance.
3. Calls `init` with the configured admin.
4. Reads `admin()` back from the deployed contract and **aborts if it does not match** — this is `init`'s first-caller-wins behavior turned into a safety check, not just a log line.
5. Has a separate `authorize` subcommand that calls `set_authorized` on an asset's SAC so the escrow may hold it — required once per issuer before that issuer's credit can use escrow mode.

The script refuses to run against anything but Testnet: CI explicitly checks `! STELLAR_NETWORK=mainnet scripts/deploy-testnet.sh` fails.

The real run against Testnet (2026-11-04) deployed [`CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C`](https://stellar.expert/explorer/testnet/contract/CC4ETHM44IUJ4GDRT57VH4OSNEMPEGUKQHQJCUQDIU2LKIAKZYIYOP6C) on the first attempt with no script changes — full transaction hashes are in [Testnet evidence](../testnet-evidence.md).

## Exercise it against Testnet

```bash
npx tsx scripts/testnet-smoke.ts
```

Runs `open_return` → `confirm`, `open_return` → `reject`, a replayed redemption id (refused on-chain, `#6`), a wrong-signer attempt (refused client-side by `stellar-cli`, before it ever reaches the chain), and `open_return` → wait for the deadline → `expire_refund`. It signs with `stellar keys` aliases on Testnet, never a raw secret key. Raw evidence lands in `contracts/deployments/testnet-smoke.json`.

## CI

`.github/workflows/contracts.yml` runs on every push and pull request, in this order: `cargo fmt --all --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked`, the spec-shaking wasm build, then uploads `unbound_redemption_escrow.wasm` as a build artifact. A separate `deploy-script` job lints the deploy script (`bash -n`), runs it in `DRY_RUN=1`, and asserts it refuses to target `mainnet`.

{% hint style="info" %}
CI builds and tests the contract on every push; it does **not** deploy. Every live Testnet deployment on this page's evidence came from a human (or agent) running `scripts/deploy-testnet.sh` directly, which is why the contract id in [Testnet evidence](../testnet-evidence.md) is a single fixed value rather than something that changes per CI run.
{% endhint %}
