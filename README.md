# LottoARC

A USDC raffle platform on Arc Mainnet. Players buy tickets with USDC; when a pool fills, a 10-minute countdown begins and anyone can trigger the draw. The winner receives ~94.02% of the pot. Pools that expire without filling return USDC to all participants in full.

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- **Smart contract**: Solidity 0.8.20 · OpenZeppelin (Ownable, ReentrancyGuard) · Foundry
- **Frontend**: React 19 · Vite · wagmi · viem · framer-motion · sonner · lucide-react (inline styles, no Tailwind)
- **Chain**: Arc Mainnet (chain ID 5042) · USDC `0x3600000000000000000000000000000000000000`
- **License**: Business Source License 1.1 (non-commercial use only until 2030-01-01)

## Features

- Multi-pool factory — owner creates pools with configurable size (2–100 players), entry fee, and duration (15 min – 168 h)
- Multi-ticket purchase — buy 1 to all remaining slots in one transaction
- Auto-draw — pool fills → 10-min countdown → anyone calls executeDraw
- Manual draw — owner schedules for non-full pools with ≥ 2 tickets
- Dashboard with 5 tabs: Open / Timed Out / Closed / Cancelled / All
- Claimable panel — unclaimed winnings and refunds always visible
- History pagination — 20 pools per page, newest first
- Dark / Light mode
- 9 languages: Thai · English · Spanish · German · Japanese · French · Portuguese · Russian · Chinese
- Share / Invite button on every open pool

## Prize split

| Recipient | Share |
|---|---|
| Winner | 94.02% |
| Owner (house) | 5% |
| Treasury | 0.98% |

## Contract

| | |
|---|---|
| Address | `0x049dB638171D12bFD5cC616C23D54a14482Bb0c0` |
| Chain | Arc Mainnet (5042) |
| Explorer | https://explorer.arc.io |

> **Note**: The contract above is the previous version. Re-deploy `contracts/ArcRaffle_Remix.sol` via Remix IDE with your wallet to get the v2 contract with all new features, then update `RAFFLE_ADDRESS` in `frontend/src/raffle-abi.ts`.

## Development

### Prerequisites

- Node.js 18+ and [bun](https://bun.sh)
- [Foundry](https://getfoundry.sh) (for contract work)

### Install

```bash
cd frontend && bun install
```

### Environment variables

None required — the app connects directly to Arc Mainnet RPC via wagmi.

| Variable | Purpose |
|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | Optional — enables WalletConnect / mobile wallets. Get one at cloud.walletconnect.com |

### Run

```bash
cd frontend && bun run dev
```

### Build

```bash
cd frontend && bun run build
```

### Test (contracts)

```bash
forge test
```

## Deploy contract

1. Open `contracts/ArcRaffle_Remix.sol` in [Remix IDE](https://remix.ethereum.org)
2. Compile with Solidity 0.8.20 and optimisation enabled
3. Connect MetaMask → Arc Mainnet (chain ID 5042, RPC `https://rpc.mainnet.arc.io`)
4. Deploy `ArcRaffle` with constructor arg: your owner wallet address
5. Update `RAFFLE_ADDRESS` in `frontend/src/raffle-abi.ts`

## Security

- 113/113 Foundry tests pass (unit + fuzz + invariant)
- Full security review at `docs/security-review-final.md`
- Pull-payment pattern for all payouts (no push-payment griefing)
- CEI pattern throughout
- Three permissionless cancel paths guard against stuck funds
- RNG uses future-block entropy (best available on Arc — no VRF yet)

## License

© 2026 Maxplay1666. See [LICENSE](./LICENSE) for terms.  
Non-commercial use only until 2030-01-01. Commercial use requires written permission.
