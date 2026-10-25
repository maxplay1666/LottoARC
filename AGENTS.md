# LottoARC — Agent Notes

## Contract (v2)

- **File**: `contracts/ArcRaffle.sol`
- **Remix flat file**: `contracts/ArcRaffle_Remix.sol`
- **Network**: Arc Mainnet (chain ID 5042)
- **Deployed address (v3)**: `0x79F7592E01fA78BdC2810B0860B7a11986280793`
- **Previous address (v2)**: `0xf06655c118ba475F1eb943F5cD17a96f808e8E80`
- **Previous address (v1)**: `0x049dB638171D12bFD5cC616C23D54a14482Bb0c0`
- **Owner / Deployer**: `0x3d2b1177305fF33E2384F3e059B9dDE10147ABD5`
- **Treasury**: `0x3d2b1177305fF33E2384F3e059B9dDE10147ABD5` (hardcoded immutable)
- **USDC**: `0x3600000000000000000000000000000000000000`
- **Explorer**: https://explorer.arc.io/address/0xf06655c118ba475F1eb943F5cD17a96f808e8E80

## Frontend

- **Location**: `frontend/`
- **Live URL**: https://lottoarc.vercel.app
- **ABI + addresses**: `frontend/src/raffle-abi.ts`

## v2 Key Decisions

- Duration: 15min–168h (900s–604800s). Presets: 15m/30m/1h/24h/72h/custom.
- Auto-draw: pool fills → 10-min countdown (autoDrawTimestamp=now+600) → anyone calls executeDraw.
- Multi-ticket: enterPool(poolId, qty) buys 1–remaining slots in one tx.
- No player cancellation once entered.
- Fees: House 5% (HOUSE_FEE_BPS=500), Treasury 0.98% (WINNER_TAX_BPS=98), Winner ~94.02%.
- Pull-payment refunds: pendingRefunds mapping; users call claimRefund().
- Per-user indexed pools: _playerPoolList + _playerEnteredPool for O(1) getMyPools.
- 113/113 Foundry tests pass (unit + fuzz + invariant).
