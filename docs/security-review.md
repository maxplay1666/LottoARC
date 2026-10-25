# ArcRaffle Security Review

## Summary

Full max-severity review over 2 rounds. All 6 Critical/Medium findings fixed. 52/52 unit tests pass including fuzz and invariant tests.

**Status: READY FOR DEPLOY (subject to independent professional audit for mainnet)**

---

## Round 1 Findings → Fixed

| Severity | Finding | Fix Applied |
|---|---|---|
| Critical | `block.prevrandao` always 0 on Arc — blockhash RNG manipulable | Replaced with future-block entropy (scheduleDraw sets drawBlock 3 ahead; executeDraw uses blockhash of that block) |
| Medium | No refund path if round stalls at 1 ticket | Added `cancelRound()` with pull-refund accounting |

## Round 2 Findings → Fixed

| Severity | Finding | Fix Applied |
|---|---|---|
| Critical | Owner can add tickets after draw scheduled (bias winner) | `enterRaffle()` requires `drawBlock == 0` |
| Critical | `executeDraw` at exact drawBlock gets `blockhash = 0` (known constant) | Changed to `block.number > drawBlock` + explicit `blockhash != 0` check |
| Critical | No permissionless escape if owner never calls `scheduleDraw` | Added `cancelStaleRound()` — anyone can cancel 7200 blocks after first ticket |
| Medium | Push-refund loop in `cancelRound` bricked by USDC blocklisted address | Changed to pull-refund mapping (`pendingRefunds`) + `claimRefund()` |
| Medium | `renounceOwnership()` can lock funds if round is active | Overridden to revert when `tickets.length > 0` or `drawBlock != 0` |

---

## Fee Math (verified by fuzz + invariant tests)

For a full round (10 tickets = 10 USDC pot):

| Recipient | BPS | Amount |
|---|---|---|
| Owner (house fee) | 500 / 10000 = 5% | 0.50 USDC |
| Winner payout | 9500 − 1% of 9500 = 9405 / 10000 | 9.405 USDC |
| Treasury (winner tax) | 1% of 9500 = 95 / 10000 | 0.095 USDC |
| **Total** | | **10.000 USDC** |

No dust leak — all funds accounted for.

---

## Residual Informational Notes (not blocking)

- `houseFee` sent to `owner()` — if ownership is transferred between scheduleDraw and executeDraw, house fee goes to new owner. Acceptable given `renounceOwnership` is guarded; owner transfer is a deliberate act.
- Winner tax naming: `winnerTax` is withheld from the winner's payout and goes to TREASURY, not to the winner. This is correct per spec but could confuse auditors who expect a "tax" to go to a government/player. Consider renaming to `platformFee2` for clarity in a future version.
- `_accrueRefunds` is O(n) over tickets — harmless at MAX_TICKETS=10.

---

## What This Review Is NOT

This review used Arc Studio's internal corpus and covers common Solidity vulnerability classes. It is **NOT** a substitute for a paid professional audit before accepting real user funds on mainnet. Engage a third-party auditor before launch.
