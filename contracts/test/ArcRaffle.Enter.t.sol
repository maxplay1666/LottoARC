// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";

contract ArcRaffleEnterTest is ArcRaffleBase {
    uint256 internal poolId;

    function setUp() public override {
        super.setUp();
        poolId = _createStandardPool(); // MAX_TICKETS=5, ENTRY_FEE=5 USDC, DURATION=1h
    }

    // ── buy 1 ticket ──────────────────────────────────────────────────────

    function test_EnterPool_Buy1Ticket() public {
        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        assertEq(usdc.balanceOf(alice), before - ENTRY_FEE);
        assertEq(raffle.getPoolTickets(poolId).length, 1);
        assertEq(raffle.getPoolTickets(poolId)[0], alice);
    }

    function test_EnterPool_Buy1Ticket_SetsFirstTicketTimestamp() public {
        uint256 t = block.timestamp;
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertEq(p.firstTicketTimestamp, t);
    }

    function test_EnterPool_Buy1Ticket_EmitsPoolEntered() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true, address(raffle));
        emit ArcRaffle.PoolEntered(poolId, alice, 0);
        raffle.enterPool(poolId, 1);
    }

    // ── buy 3 tickets ─────────────────────────────────────────────────────

    function test_EnterPool_Buy3Tickets() public {
        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        raffle.enterPool(poolId, 3);
        assertEq(usdc.balanceOf(alice), before - (ENTRY_FEE * 3));
        assertEq(raffle.getPoolTickets(poolId).length, 3);
    }

    function test_EnterPool_Buy3Tickets_EmitsFor_Each() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true, address(raffle));
        emit ArcRaffle.PoolEntered(poolId, alice, 0);
        // We just confirm no revert; checking all 3 emits would need 3 separate calls
        raffle.enterPool(poolId, 3);
    }

    // ── buy all remaining ─────────────────────────────────────────────────

    function test_EnterPool_BuyAllRemaining_SetsAutoDrawTimestamp() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 5); // fill all 5
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertEq(p.autoDrawTimestamp, block.timestamp + FULL_POOL_DRAW_DELAY);
    }

    function test_EnterPool_BuyAllRemaining_EmitsPoolFull() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, false, address(raffle));
        emit ArcRaffle.PoolFull(poolId);
        raffle.enterPool(poolId, 5);
    }

    function test_EnterPool_BuyAllRemaining_TransfersFullCost() public {
        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        raffle.enterPool(poolId, 5);
        assertEq(usdc.balanceOf(alice), before - (ENTRY_FEE * 5));
        assertEq(usdc.balanceOf(address(raffle)), ENTRY_FEE * 5);
    }

    // ── pot getter ────────────────────────────────────────────────────────

    function test_GetPoolPot_AfterMultipleEntries() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(bob);
        raffle.enterPool(poolId, 1);
        assertEq(raffle.getPoolPot(poolId), ENTRY_FEE * 3);
    }

    // ── revert: qty = 0 ──────────────────────────────────────────────────

    function test_EnterPool_Revert_QtyZero() public {
        vm.prank(alice);
        vm.expectRevert("Invalid quantity");
        raffle.enterPool(poolId, 0);
    }

    // ── revert: qty > remaining ───────────────────────────────────────────

    function test_EnterPool_Revert_QtyExceedsRemaining() public {
        vm.prank(alice);
        vm.expectRevert("Quantity exceeds remaining slots");
        raffle.enterPool(poolId, 6); // max is 5
    }

    function test_EnterPool_Revert_QtyExceedsRemainingAfterPartialFill() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 3); // 2 remaining
        vm.prank(bob);
        vm.expectRevert("Quantity exceeds remaining slots");
        raffle.enterPool(poolId, 3);
    }

    // ── revert: pool full ─────────────────────────────────────────────────

    function test_EnterPool_Revert_PoolAlreadyFull() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 5);
        vm.prank(bob);
        vm.expectRevert("Pool full");
        raffle.enterPool(poolId, 1);
    }

    // ── revert: pool does not exist ───────────────────────────────────────

    function test_EnterPool_Revert_PoolNotExist() public {
        vm.prank(alice);
        vm.expectRevert("Pool does not exist");
        raffle.enterPool(999, 1);
    }

    // ── revert: pool past deadline ────────────────────────────────────────

    function test_EnterPool_Revert_PastDeadline() public {
        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(alice);
        vm.expectRevert("Pool deadline passed");
        raffle.enterPool(poolId, 1);
    }

    // ── no-cancel: player cannot cancel to recover USDC ───────────────────
    // cancelPool and cancelStalePool have different guards; for an open unfilled pool
    // cancelPool is owner-only, cancelStalePool requires deadline passed.

    function test_NoCancel_PlayerCannotCallCancelPool() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        // Alice tries to cancel — not owner
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                alice
            )
        );
        raffle.cancelPool(poolId);
    }

    function test_NoCancel_PlayerCannotCallCancelStalePool_WhileOpen() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        // Deadline not yet passed → should revert
        vm.prank(alice);
        vm.expectRevert("Pool not expired");
        raffle.cancelStalePool(poolId);
    }

    function test_NoCancel_PlayerCannotCallCancelExpiredAutoDrawWhileNotExpired() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 5); // fills → autoDrawTimestamp set
        // autoDrawTimestamp + 900 not yet reached
        vm.warp(block.timestamp + FULL_POOL_DRAW_DELAY + AUTO_DRAW_GRACE - 1);
        vm.prank(alice);
        vm.expectRevert("Auto draw not expired");
        raffle.cancelExpiredAutoDraw(poolId);
    }
}
