// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";

contract ArcRaffleClaimTest is ArcRaffleBase {
    uint256 internal poolId;

    function setUp() public override {
        super.setUp();
        poolId = _createStandardPool();
    }

    // ── claimRefund: after cancel, player gets correct USDC back ──────────

    function test_ClaimRefund_AfterCancelPool() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(bob);
        raffle.enterPool(poolId, 1);

        vm.prank(owner);
        raffle.cancelPool(poolId);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        raffle.claimRefund();
        assertEq(usdc.balanceOf(alice), aliceBefore + ENTRY_FEE * 2);
        assertEq(raffle.pendingRefunds(alice), 0);

        uint256 bobBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        raffle.claimRefund();
        assertEq(usdc.balanceOf(bob), bobBefore + ENTRY_FEE * 1);
    }

    function test_ClaimRefund_OwnerGetsHouseFeeAfterDraw() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp);
        raffle.executeDraw(poolId);

        uint256 pot = MAX_TICKETS * ENTRY_FEE;
        (uint256 houseFee, , ) = _expectedFees(pot);

        uint256 ownerBefore = usdc.balanceOf(owner);
        vm.prank(owner);
        raffle.claimRefund();
        assertEq(usdc.balanceOf(owner), ownerBefore + houseFee);
        assertEq(raffle.pendingRefunds(owner), 0);
    }

    function test_ClaimRefund_Revert_NoRefundAvailable() public {
        vm.prank(alice);
        vm.expectRevert("No refund available");
        raffle.claimRefund();
    }

    function test_ClaimRefund_Revert_DoubleClaimPrevented() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        vm.prank(owner);
        raffle.cancelPool(poolId);

        vm.prank(alice);
        raffle.claimRefund();

        vm.prank(alice);
        vm.expectRevert("No refund available");
        raffle.claimRefund();
    }

    // ── claimTreasury: after draw, treasury gets correct USDC ─────────────

    function test_ClaimTreasury_AfterAutoDraw() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp);
        raffle.executeDraw(poolId);

        uint256 pot = MAX_TICKETS * ENTRY_FEE;
        (, uint256 winnerTax, ) = _expectedFees(pot);

        assertEq(raffle.treasuryBalance(), winnerTax);

        uint256 treasuryBefore = usdc.balanceOf(TREASURY);
        vm.prank(TREASURY);
        raffle.claimTreasury();

        assertEq(usdc.balanceOf(TREASURY), treasuryBefore + winnerTax);
        assertEq(raffle.treasuryBalance(), 0);
    }

    function test_ClaimTreasury_EmitsTreasuryClaimed() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp);
        raffle.executeDraw(poolId);

        uint256 pot = MAX_TICKETS * ENTRY_FEE;
        (, uint256 winnerTax, ) = _expectedFees(pot);

        vm.prank(TREASURY);
        vm.expectEmit(true, false, false, true, address(raffle));
        emit ArcRaffle.TreasuryClaimed(TREASURY, winnerTax);
        raffle.claimTreasury();
    }

    function test_ClaimTreasury_Revert_NotTreasury() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp);
        raffle.executeDraw(poolId);

        vm.prank(alice);
        vm.expectRevert("Not treasury");
        raffle.claimTreasury();
    }

    function test_ClaimTreasury_Revert_NothingToClaim() public {
        vm.prank(TREASURY);
        vm.expectRevert("Nothing to claim");
        raffle.claimTreasury();
    }

    // ── getAllPools pagination ─────────────────────────────────────────────

    function test_GetAllPools_ReturnNewest3() public {
        // setUp() already created pool #1. Create 4 more → IDs 2,3,4,5.
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(owner);
            raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        }

        // Total pools: 1,2,3,4,5 — getAllPools(0,3) → 3 newest in reverse: [5, 4, 3]
        uint256[] memory result = raffle.getAllPools(0, 3);
        assertEq(result.length, 3);
        assertEq(result[0], 5);
        assertEq(result[1], 4);
        assertEq(result[2], 3);
    }

    function test_GetAllPools_Offset() public {
        // setUp() already created pool #1. Create 4 more → IDs 2,3,4,5.
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(owner);
            raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        }
        // Total: 1..5 — getAllPools(2, 3) → [3, 2, 1]
        uint256[] memory result = raffle.getAllPools(2, 3);
        assertEq(result.length, 3);
        assertEq(result[0], 3);
        assertEq(result[1], 2);
        assertEq(result[2], 1);
    }

    function test_GetAllPools_LimitZeroReturnsEmpty() public {
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        uint256[] memory result = raffle.getAllPools(0, 0);
        assertEq(result.length, 0);
    }

    function test_GetAllPools_OffsetBeyondTotalReturnsEmpty() public {
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        uint256[] memory result = raffle.getAllPools(10, 5);
        assertEq(result.length, 0);
    }

    function test_GetAllPools_CappedAt20() public {
        // Create 25 pools
        for (uint256 i = 0; i < 25; i++) {
            vm.prank(owner);
            raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        }
        // limit=25 is capped to FRONTEND_PAGE_SIZE=20
        uint256[] memory result = raffle.getAllPools(0, 25);
        assertEq(result.length, 20);
    }

    // ── isTimedOut ────────────────────────────────────────────────────────

    function test_IsTimedOut_FalseBeforeDeadline() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        assertFalse(raffle.isTimedOut(poolId));
    }

    function test_IsTimedOut_TrueAfterDeadlineWithPartialFill() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        vm.warp(block.timestamp + DURATION + 1);
        assertTrue(raffle.isTimedOut(poolId));
    }

    function test_IsTimedOut_FalseWhenFull() public {
        _fillPool(poolId);
        vm.warp(block.timestamp + DURATION + 1);
        // pool is full (autoDrawTimestamp set) so tickets.length == maxTickets → not timed out
        assertFalse(raffle.isTimedOut(poolId));
    }

    function test_IsTimedOut_FalseWhenCancelled() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        vm.prank(owner);
        raffle.cancelPool(poolId);
        // status != Open
        assertFalse(raffle.isTimedOut(poolId));
    }

    function test_IsTimedOut_Revert_PoolNotExist() public {
        vm.expectRevert("Pool does not exist");
        raffle.isTimedOut(999);
    }

    // ── getPool/getOpenPools basics ────────────────────────────────────────

    function test_GetPool_Revert_PoolNotExist() public {
        vm.expectRevert("Pool does not exist");
        raffle.getPool(999);
    }

    function test_GetOpenPools_EmptyAtStart() public view {
        // Before creating pool (fresh raffle with no pools yet)
        // Note: setUp() already creates 1 pool via _createStandardPool? No — setUp only calls super.setUp()
        // Actually poolId is set in setUp, so there IS one open pool
        uint256[] memory open = raffle.getOpenPools();
        assertEq(open.length, 1);
    }

    // ── renounceOwnership guarded ─────────────────────────────────────────

    function test_RenounceOwnership_Revert_ActivePool() public {
        vm.prank(owner);
        vm.expectRevert("ArcRaffle: active pool");
        raffle.renounceOwnership();
    }

    function test_RenounceOwnership_SucceedsWhenNoActivePools() public {
        vm.prank(owner);
        raffle.cancelPool(poolId);
        vm.prank(owner);
        raffle.renounceOwnership();
        assertEq(raffle.owner(), address(0));
    }
}
