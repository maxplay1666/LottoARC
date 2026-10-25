# Deploying ArcRaffle to Arc Mainnet

> **Warning:** Arc mainnet uses real USDC. Transactions are irreversible. Review the contract source thoroughly before deploying. Consider a professional audit before accepting real user funds.

## Prerequisites

1. [Foundry](https://getfoundry.sh/) installed on your machine.
2. An Arc mainnet wallet funded with USDC (USDC is the gas token on Arc). You can bridge USDC to Arc via https://bridge.arc.io or any CCTP-compatible bridge.
3. Your deployer private key exported as an environment variable — **never paste it in a terminal without env vars**.

## Step 1 — Build the contract

```bash
cd /path/to/ARC
forge build
```

Confirm output: `Compiler run successful!`

## Step 2 — Set environment variables

```bash
export PRIVATE_KEY=<your_deployer_private_key>
export ARC_MAINNET_RPC=https://rpc.mainnet.arc.io
```

## Step 3 — Deploy

Replace `<YOUR_WALLET_ADDRESS>` with your deployer wallet address (it becomes the Raffle owner and receives the 5% house fee).

```bash
forge create contracts/ArcRaffle.sol:ArcRaffle \
  --rpc-url $ARC_MAINNET_RPC \
  --private-key $PRIVATE_KEY \
  --constructor-args <YOUR_WALLET_ADDRESS> \
  --broadcast
```

The output will include the deployed contract address. **Copy it.**

## Step 4 — Verify on explorer (optional but recommended)

```bash
forge verify-contract <DEPLOYED_ADDRESS> contracts/ArcRaffle.sol:ArcRaffle \
  --rpc-url $ARC_MAINNET_RPC \
  --etherscan-api-key <API_KEY_IF_REQUIRED>
```

Check https://explorer.arc.io for your contract.

## Step 5 — Wire into the frontend

Open `frontend/src/raffle-abi.ts` and set:

```ts
export const RAFFLE_ADDRESS = '0x<YOUR_DEPLOYED_ADDRESS>' as `0x${string}`
```

## Step 6 — Set WalletConnect Project ID (optional)

Create a free project at https://cloud.walletconnect.com and add the ID:

```bash
# frontend/.env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Step 7 — Run the frontend

```bash
cd frontend
bun install
bun run dev
```

Open http://localhost:5174.

## Owner actions

Once deployed, you (the owner) can:

- **Schedule a draw**: Call `scheduleDraw()` when at least 2 tickets are sold. Sets a draw block 3 blocks ahead.
- **Execute a draw**: Anyone (not just owner) calls `executeDraw()` after the draw block. Winner gets 95%, you get 5%.
- **Cancel a round**: Call `cancelRound()` before scheduling a draw to refund all ticket holders.

## Raffle flow for players

1. Approve 1 USDC to the contract address via the frontend (one-time per entry).
2. Call `enterRaffle()` — pays 1 USDC for one ticket slot.
3. When owner schedules the draw, wait for the draw block (about 3 seconds on Arc).
4. Anyone can call `executeDraw()` — winner is selected from `blockhash(drawBlock)`.

## AGENTS.md note

After deployment, update `AGENTS.md` with the contract address and deployment tx hash.
