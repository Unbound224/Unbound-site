# Sideband

Sideband lets two nearby devices agree on a price, meter a service, and settle later when connectivity returns. The payer signs small off-chain payment commitments. A Soroban channel contract pays valid commitments after a provider submits them.

## Why Stellar is load-bearing

The channel contract holds the channel funds, accepts a monotonic commitment sequence, and prevents a provider from claiming more than the payer signed. Stellar Testnet provides the settlement record while the mobile and gateway layers remain useful during intermittent local connectivity.

## Flow

1. A payer opens and funds a channel.
2. Payer and provider negotiate a local session over a supported transport.
3. Usage increments create payer-signed voucher commitments.
4. The provider can settle the latest valid commitment when connectivity returns.
5. The contract releases the committed amount and records the result.

## Components

| Repository                                                           | Owns                                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Sideband-protocol](https://github.com/Sideband34/Sideband-protocol) | Wire frames, session state machine, metering and transport interface       |
| [Sideband-channels](https://github.com/Sideband34/Sideband-channels) | Soroban channel contract and TypeScript voucher/settlement SDK             |
| [Sideband-gateway](https://github.com/Sideband34/Sideband-gateway)   | HTTP 402 gateway, provider sessions, settlement and landing page           |
| [Sideband-mobile](https://github.com/Sideband34/Sideband-mobile)     | Payer key storage, session journal, channel actions and transport adapters |

The landing page is [sideband-web1.vercel.app](https://sideband-web1.vercel.app). The Testnet contract is [CD67A4SD…5OTS](https://stellar.expert/explorer/testnet/contract/CD67A4SD2ZWA4BPWVCJKSJ3AI4TJCHEJRUJIDUPPOWT4CEQAJOMS5OTS). No Bluetooth or phone-hardware test is claimed. Read the [canonical Sideband documentation](https://github.com/Sideband34/Sideband-gateway/tree/main/gitbook) for contract calls, voucher encoding, lifecycle and transports.
