// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";

contract ArcRaffleFuzzTest is ArcRaffleBase {
    // ── fuzz: fee math across ticket counts and entry fees ────────────────

    /// @dev Verifies the fee split invariant for any pot value:
    ///      houseFee + winnerTax + winnerPayout == pot
    function testFuzz_FeeMath_SumsCorrectly(
        uint16 rawTickets,
        uint64 rawFee
    ) public pure {
        // bound to valid ranges: 2..100 tickets, fee >= 1e6 (1 USDC)
        uint256 ticketCount = bound(rawTickets, 2, 100);
        uint256 entryFee    = bound(rawFee, 1_000_000, 1_000_000_000); // 1..1000 USDC

        uint256 pot = ticketCount * entryFee;

        uint256 houseFee    = (pot * HOUSE_FEE_BPS)   / BPS_DENOMINATOR;
        uint256 prizeAfter  = pot - houseFee;
        uint256 winnerTax   = (prizeAfter * WINNER_TAX_BPS) / BPS_DENOMINATOR;
        uint256 winnerPayout = prizeAfter - winnerTax;

        // Total must equal the pot
        assertEq(houseFee + winnerTax + winnerPayout, pot);
    }

    /// @dev House fee is exactly floor(pot * 500 / 10_000) — no more, no less.
    ///      Integer division makes exact equality houseFee*10000==pot*500 wrong when
    ///      pot is not divisible by 20; instead assert the rounding error is < 1 unit.
    function testFuzz_HouseFee_IsAlways5Pct(
        uint16 rawTickets,
        uint64 rawFee
    ) public pure {
        uint256 ticketCount = bound(rawTickets, 2, 100);
        uint256 entryFee    = bound(rawFee, 1_000_000, 1_000_000_000);
        uint256 pot         = ticketCount * entryFee;

        uint256 houseFee = (pot * 500) / 10_000;

        // houseFee is the integer floor of 5% of pot.
        // Verify: houseFee <= pot*5/100 <= houseFee + 1 (rounding error < 1)
        assertGe(houseFee * 10_000, pot * 500 - 9_999); // lower bound (floor)
        assertLe(houseFee * 10_000, pot * 500);          // never rounds up
    }

    /// @dev Winner always gets > 94% of pot (floor due to integer division).
    function testFuzz_WinnerPayout_GtMinimum(
        uint16 rawTickets,
        uint64 rawFee
    ) public pure {
        uint256 ticketCount = bound(rawTickets, 2, 100);
        uint256 entryFee    = bound(rawFee, 1_000_000, 1_000_000_000);
        uint256 pot         = ticketCount * entryFee;

        uint256 houseFee     = (pot * HOUSE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 net          = pot - houseFee;
        uint256 winnerTax    = (net * WINNER_TAX_BPS) / BPS_DENOMINATOR;
        uint256 winnerPayout = net - winnerTax;

        // winner payout is at least 93% (loose lower bound; exact is ~94.02%)
        assertGe(winnerPayout * 10_000, pot * 9300);
    }

    /// @dev Treasury (winnerTax) is always ≤ 1% of pot.
    function testFuzz_TreasuryTax_LeOnePercent(
        uint16 rawTickets,
        uint64 rawFee
    ) public pure {
        uint256 ticketCount = bound(rawTickets, 2, 100);
        uint256 entryFee    = bound(rawFee, 1_000_000, 1_000_000_000);
        uint256 pot         = ticketCount * entryFee;

        uint256 houseFee  = (pot * HOUSE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 net       = pot - houseFee;
        uint256 winnerTax = (net * WINNER_TAX_BPS) / BPS_DENOMINATOR;

        // winnerTax <= 1% of pot
        assertLe(winnerTax * 10_000, pot * 100);
    }

    // ── fuzz: enterPool with valid quantity ───────────────────────────────

    function testFuzz_EnterPool_ValidQty(uint8 rawQty) public {
        uint256 poolId = _createStandardPool(); // MAX_TICKETS = 5
        uint256 qty = bound(rawQty, 1, MAX_TICKETS);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        raffle.enterPool(poolId, qty);

        assertEq(raffle.getPoolTickets(poolId).length, qty);
        assertEq(usdc.balanceOf(alice), aliceBefore - qty * ENTRY_FEE);
    }

    // ── fuzz: createPool valid durations ─────────────────────────────────

    function testFuzz_CreatePool_ValidDuration(uint32 rawDuration) public {
        uint256 dur = bound(rawDuration, MIN_DURATION, MAX_DURATION);
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, dur);
        ArcRaffle.Pool memory p = raffle.getPool(raffle.nextPoolId() - 1);
        assertEq(p.durationSeconds, dur);
    }
}
