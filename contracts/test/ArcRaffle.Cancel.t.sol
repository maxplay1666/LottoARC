// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArcRaffleCancelTest is ArcRaffleBase {
    uint256 internal poolId;

    function setUp() public override {
        super.setUp();
        poolId = _createStandardPool(); // 5 tickets, 5 USDC, 1h
    }

    // ── cancelPool: owner cancels before any draw scheduled ───────────────

    function test_CancelPool_OwnerCancels_BeforeAnyTickets() public {
        vm.prank(owner);
        raffle.cancelPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Cancelled));
    }

    function test_CancelPool_OwnerCancels_AccruesRefunds() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(bob);
        raffle.enterPool(poolId, 1);

        vm.prank(owner);
        raffle.cancelPool(poolId);

        // alice bought 2 → 2 × ENTRY_FEE, bob 1 → 1 × ENTRY_FEE
        assertEq(raffle.pendingRefunds(alice), ENTRY_FEE * 2);
        assertEq(raffle.pendingRefunds(bob),   ENTRY_FEE * 1);
    }

    function test_CancelPool_EmitsPoolCancelled() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false, address(raffle));
        emit ArcRaffle.PoolCancelled(poolId);
        raffle.cancelPool(poolId);
    }

    function test_CancelPool_RemovesFromOpenPools() public {
        vm.prank(owner);
        raffle.cancelPool(poolId);
        assertEq(raffle.getOpenPools().length, 0);
    }

    // ── cancelPool: revert: non-owner ────────────────────────────────────

    function test_CancelPool_Revert_NonOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                alice
            )
        );
        raffle.cancelPool(poolId);
    }

    // ── cancelPool: revert: autoDrawTimestamp set (pool full) ────────────

    function test_CancelPool_Revert_AutoDrawPending() public {
        _fillPool(poolId); // fills → autoDrawTimestamp set
        vm.prank(owner);
        vm.expectRevert("Auto draw pending");
        raffle.cancelPool(poolId);
    }

    // ── cancelPool: revert: draw already scheduled ────────────────────────

    function test_CancelPool_Revert_DrawAlreadyScheduled() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(owner);
        raffle.scheduleDraw(poolId);

        // After scheduleDraw the pool status becomes DrawScheduled (not Open),
        // so cancelPool hits "Pool not open" first.
        vm.prank(owner);
        vm.expectRevert("Pool not open");
        raffle.cancelPool(poolId);
    }

    // ── cancelStalePool: pool expires with < maxTickets ───────────────────

    function test_CancelStalePool_AccruesRefunds() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(bob);
        raffle.enterPool(poolId, 1);

        // Warp past deadline
        vm.warp(block.timestamp + DURATION + 1);

        raffle.cancelStalePool(poolId); // anyone can call

        assertEq(raffle.pendingRefunds(alice), ENTRY_FEE * 2);
        assertEq(raffle.pendingRefunds(bob),   ENTRY_FEE * 1);
    }

    function test_CancelStalePool_SetsCancelled() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        vm.warp(block.timestamp + DURATION + 1);
        raffle.cancelStalePool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Cancelled));
    }

    function test_CancelStalePool_Revert_NotExpired() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 1);
        vm.expectRevert("Pool not expired");
        raffle.cancelStalePool(poolId);
    }

    function test_CancelStalePool_Revert_NoTickets() public {
        vm.warp(block.timestamp + DURATION + 1);
        vm.expectRevert("No tickets");
        raffle.cancelStalePool(poolId);
    }

    function test_CancelStalePool_Revert_AutoDrawSet() public {
        _fillPool(poolId);
        vm.warp(block.timestamp + DURATION + 1);
        vm.expectRevert("Use cancelExpiredAutoDraw");
        raffle.cancelStalePool(poolId);
    }

    // ── cancelExpiredDraw: owner schedules draw → commit window expires ───

    function test_CancelExpiredDraw_AccruesRefunds() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(bob);
        raffle.enterPool(poolId, 1);

        vm.prank(owner);
        raffle.scheduleDraw(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);

        // Roll past commitDeadlineBlock
        vm.roll(p.commitDeadlineBlock + 1);
        raffle.cancelExpiredDraw(poolId);

        assertEq(raffle.pendingRefunds(alice), ENTRY_FEE * 2);
        assertEq(raffle.pendingRefunds(bob),   ENTRY_FEE * 1);
    }

    function test_CancelExpiredDraw_SetsCancelled() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(owner);
        raffle.scheduleDraw(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.roll(p.commitDeadlineBlock + 1);
        raffle.cancelExpiredDraw(poolId);
        p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Cancelled));
    }

    function test_CancelExpiredDraw_Revert_NotExpired() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 2);
        vm.prank(owner);
        raffle.scheduleDraw(poolId);
        vm.expectRevert("Draw not expired");
        raffle.cancelExpiredDraw(poolId);
    }

    function test_CancelExpiredDraw_Revert_WrongStatus() public {
        // pool is still Open (not DrawScheduled)
        vm.expectRevert("Draw not scheduled");
        raffle.cancelExpiredDraw(poolId);
    }

    // ── cancelExpiredAutoDraw: fill → warp past autoDrawTimestamp+900 ─────

    function test_CancelExpiredAutoDraw_AccruesRefunds() public {
        vm.prank(alice);
        raffle.enterPool(poolId, 3);
        vm.prank(bob);
        raffle.enterPool(poolId, 2);
        // Pool is now full → autoDrawTimestamp set

        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        uint256 expiry = p.autoDrawTimestamp + AUTO_DRAW_GRACE;
        vm.warp(expiry + 1);

        raffle.cancelExpiredAutoDraw(poolId);

        // alice: 3, bob: 2
        assertEq(raffle.pendingRefunds(alice), ENTRY_FEE * 3);
        assertEq(raffle.pendingRefunds(bob),   ENTRY_FEE * 2);
    }

    function test_CancelExpiredAutoDraw_SetsCancelled() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp + AUTO_DRAW_GRACE + 1);
        raffle.cancelExpiredAutoDraw(poolId);
        p = raffle.getPool(poolId);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Cancelled));
    }

    function test_CancelExpiredAutoDraw_Revert_NotYetExpired() public {
        _fillPool(poolId);
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        vm.warp(p.autoDrawTimestamp + AUTO_DRAW_GRACE - 1);
        vm.expectRevert("Auto draw not expired");
        raffle.cancelExpiredAutoDraw(poolId);
    }

    function test_CancelExpiredAutoDraw_Revert_AutoDrawNotSet() public {
        // Pool is open but autoDrawTimestamp == 0
        vm.expectRevert("Auto draw not set");
        raffle.cancelExpiredAutoDraw(poolId);
    }
}
