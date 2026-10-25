// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArcRaffleDrawTest is ArcRaffleBase {
    uint256 internal poolId;

    function setUp() public override {
        super.setUp();
        poolId = _createStandardPool(); // 5 tickets, 5 USDC each, 1-hour
    }

    // ── helpers ───────────────────────────────────────────────────────────

    /// Fill pool and warp past autoDrawTimestamp so executeDraw can be called.
    function _fillAndWarpForAutoDraw() internal {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp);
    }

    // ── auto-draw: fill → autoDrawTimestamp set ───────────────────────────

    function test_AutoDraw_AutoDrawTimestampSetAfterFill() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertGt(p.autoDrawTimestamp, 0);
        assertEq(p.autoDrawTimestamp, block.timestamp + FULL_POOL_DRAW_DELAY);
    }

    // ── auto-draw: executeDraw before autoDrawTimestamp reverts ───────────

    function test_AutoDraw_Revert_CountdownStillActive() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp - 1); // 1 second too early
        vm.expectRevert("Auto draw countdown active");
        raffle.executeDraw(poolId);
    }

    // ── auto-draw: executeDraw succeeds at autoDrawTimestamp ──────────────

    function test_AutoDraw_ExecuteDrawSucceeds() public {
        _fillAndWarpForAutoDraw();
        raffle.executeDraw(poolId); // any caller
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Closed));
    }

    // ── auto-draw: fee math (HOUSE=5%, TREASURY=0.98% of net, WINNER=~94.02%) ─

    function test_AutoDraw_FeeMath_Correct() public {
        _fillAndWarpForAutoDraw();

        uint256 pot = MAX_TICKETS * ENTRY_FEE; // 5 * 5e6 = 25e6
        (uint256 houseFee, uint256 winnerTax, uint256 winnerPayout) = _expectedFees(pot);

        // house fee = 5% of pot = 1_250_000
        assertEq(houseFee, (pot * 500) / 10_000);
        // winner tax (treasury) = 0.98% of (pot - houseFee)
        uint256 net = pot - houseFee;
        assertEq(winnerTax, (net * 98) / 10_000);
        assertEq(winnerPayout, net - winnerTax);

        raffle.executeDraw(poolId);

        // treasury balance
        assertEq(raffle.treasuryBalance(), winnerTax);

        // owner's pending refund should be the houseFee
        assertEq(raffle.pendingRefunds(owner), houseFee);
    }

    function test_AutoDraw_EmitsWinnerDrawn() public {
        _fillAndWarpForAutoDraw();

        uint256 pot = MAX_TICKETS * ENTRY_FEE;
        (, , uint256 winnerPayout) = _expectedFees(pot);

        // Pre-compute the winner exactly as the contract will (same block context).
        // executeDraw uses blockhash(block.number - 1) and block.timestamp.
        uint256 random = uint256(
            keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, poolId))
        );
        address[] memory tickets = raffle.getPoolTickets(poolId);
        address expectedWinner = tickets[random % tickets.length];

        vm.expectEmit(true, true, false, true, address(raffle));
        emit ArcRaffle.WinnerDrawn(poolId, expectedWinner, winnerPayout, pot);
        raffle.executeDraw(poolId);
    }

    function test_AutoDraw_WinnerCanClaimPayout() public {
        _fillAndWarpForAutoDraw();

        uint256 pot = MAX_TICKETS * ENTRY_FEE;
        (, , uint256 winnerPayout) = _expectedFees(pot);

        raffle.executeDraw(poolId);

        // Find who the winner is
        uint256 random = uint256(
            keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, poolId))
        );
        address[] memory tickets = raffle.getPoolTickets(poolId);
        address winner = tickets[random % tickets.length];

        assertEq(raffle.pendingRefunds(winner), winnerPayout);
    }

    // ── auto-draw: pool removed from open list after draw ─────────────────

    function test_AutoDraw_PoolRemovedFromOpenPools() public {
        _fillAndWarpForAutoDraw();
        raffle.executeDraw(poolId);
        uint256[] memory open = raffle.getOpenPools();
        assertEq(open.length, 0);
    }

    // ── auto-draw: revert if pool not full ────────────────────────────────

    function test_AutoDraw_Revert_PoolNotFull() public {
        // Manually set up autoDrawTimestamp by filling partially then hacking
        // Instead: enter 4/5, should not be able to trigger auto path at all
        vm.prank(alice);
        raffle.enterPool(poolId, 4);
        // autoDrawTimestamp == 0, so hasAutoPath=false and hasManualPath=false → "No draw path"
        vm.expectRevert("No draw path");
        raffle.executeDraw(poolId);
    }

    // ── manual draw: scheduleDraw → executeDraw via future block ──────────

    function test_ManualDraw_ScheduleAndExecute() public {
        // Add 2 tickets (minimum needed)
        vm.prank(alice);
        raffle.enterPool(poolId, 2);

        // Schedule draw as owner
        vm.prank(owner);
        raffle.scheduleDraw(poolId);

        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.DrawScheduled));
        uint256 drawBlock = p.drawBlock;
        assertEq(drawBlock, block.number + REVEAL_DELAY);

        // Roll past drawBlock
        vm.roll(drawBlock + 1);
        raffle.executeDraw(poolId);

        p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Closed));
    }

    function test_ManualDraw_EmitsDrawScheduled() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);

        uint256 expectedBlock = block.number + REVEAL_DELAY;
        vm.prank(owner);
        vm.expectEmit(true, false, false, true, address(raffle));
        emit ArcRaffle.DrawScheduled(poolId, expectedBlock);
        raffle.scheduleDraw(poolId);
    }

    function test_ManualDraw_FeeMath() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);

        vm.prank(owner);
        raffle.scheduleDraw(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.roll(p.drawBlock + 1);

        uint256 pot = 2 * ENTRY_FEE;
        (uint256 houseFee, uint256 winnerTax, uint256 winnerPayout) = _expectedFees(pot);

        raffle.executeDraw(poolId);

        assertEq(raffle.treasuryBalance(), winnerTax);
        assertEq(raffle.pendingRefunds(owner), houseFee);
        // winner payout is non-zero and equals expected
        // Winner is either alice or alice (both tickets are alice here)
        assertEq(raffle.pendingRefunds(alice), winnerPayout);
    }

    // ── scheduleDraw reverts ──────────────────────────────────────────────

    function test_ScheduleDraw_Revert_NonOwner() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                alice
            )
        );
        raffle.scheduleDraw(poolId);
    }

    function test_ScheduleDraw_Revert_NotEnoughTickets() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1); // only 1
        vm.prank(owner);
        vm.expectRevert("Need at least 2 tickets");
        raffle.scheduleDraw(poolId);
    }

    function test_ScheduleDraw_Revert_PoolFull_UsesAutoDraw() public {
        _fillPool(poolId); // fills pool → autoDrawTimestamp set
        vm.prank(owner);
        vm.expectRevert("Auto draw pending");
        raffle.scheduleDraw(poolId);
    }

    function test_ScheduleDraw_Revert_DeadlinePassed() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(owner);
        vm.expectRevert("Pool deadline passed");
        raffle.scheduleDraw(poolId);
    }

    // ── executeDraw reverts: no draw path ─────────────────────────────────

    function test_ExecuteDraw_Revert_NoDrawPath() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.expectRevert("No draw path");
        raffle.executeDraw(poolId);
    }

    // ── executeDraw reverts: manual draw block not reached ────────────────

    function test_ExecuteDraw_Revert_DrawBlockNotReached() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(owner);
        raffle.scheduleDraw(poolId);
        // Don't roll forward
        vm.expectRevert("Draw block not reached");
        raffle.executeDraw(poolId);
    }

    // ── executeDraw reverts: manual draw expired ──────────────────────────

    function test_ExecuteDraw_Revert_DrawExpired() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(owner);
        raffle.scheduleDraw(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.roll(p.commitDeadlineBlock + 1);
        vm.expectRevert("Draw expired");
        raffle.executeDraw(poolId);
    }
}
