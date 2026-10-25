// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArcRaffleDeployTest is ArcRaffleBase {
    // ── constructor ───────────────────────────────────────────────────────

    function test_Constructor_SetsOwner() public view {
        assertEq(raffle.owner(), owner);
    }

    function test_Constructor_NextPoolIdStartsAt1() public view {
        assertEq(raffle.nextPoolId(), 1);
    }

    function test_Constructor_TreasuryConstant() public view {
        assertEq(raffle.TREASURY(), 0x3d2b1177305fF33E2384F3e059B9dDE10147ABD5);
    }

    // ── createPool: valid preset durations ───────────────────────────────

    function test_CreatePool_15Min() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 900);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 900);
        assertEq(p.maxTickets, 10);
    }

    function test_CreatePool_30Min() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 1800);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 1800);
    }

    function test_CreatePool_1Hour() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 3600);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 3600);
    }

    function test_CreatePool_24Hours() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 86400);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 86400);
    }

    function test_CreatePool_72Hours() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 259200);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 259200);
    }

    function test_CreatePool_168Hours() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 604800);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 604800);
    }

    function test_CreatePool_Custom2Hours() public {
        vm.prank(owner);
        raffle.createPool(10, ENTRY_FEE, 7200);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 7200);
    }

    // ── createPool: emits event ───────────────────────────────────────────

    function test_CreatePool_EmitsPoolCreated() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true, address(raffle));
        emit ArcRaffle.PoolCreated(1, MAX_TICKETS, ENTRY_FEE, DURATION);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
    }

    // ── createPool: stores state correctly ───────────────────────────────

    function test_CreatePool_SetsDeadline() public {
        uint256 t = block.timestamp;
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.deadlineTimestamp, t + DURATION);
        assertEq(p.createdAt, t);
        assertEq(uint8(p.status), uint8(ArcRaffle.PoolStatus.Open));
    }

    function test_CreatePool_IncreasesNextPoolId() public {
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        assertEq(raffle.nextPoolId(), 2);
    }

    function test_CreatePool_AppearsInOpenPools() public {
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        uint256[] memory open = raffle.getOpenPools();
        assertEq(open.length, 1);
        assertEq(open[0], 1);
    }

    // ── createPool: revert: bad duration ─────────────────────────────────

    function test_CreatePool_Revert_DurationTooShort() public {
        vm.prank(owner);
        vm.expectRevert("Invalid duration");
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, 899);
    }

    function test_CreatePool_Revert_DurationTooLong() public {
        vm.prank(owner);
        vm.expectRevert("Invalid duration");
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, 604801);
    }

    // ── createPool: revert: bad maxTickets ───────────────────────────────

    function test_CreatePool_Revert_MaxTicketsOne() public {
        vm.prank(owner);
        vm.expectRevert("Invalid max tickets");
        raffle.createPool(1, ENTRY_FEE, DURATION);
    }

    function test_CreatePool_Revert_MaxTickets101() public {
        vm.prank(owner);
        vm.expectRevert("Invalid max tickets");
        raffle.createPool(101, ENTRY_FEE, DURATION);
    }

    // ── createPool: revert: entryFee too low ─────────────────────────────

    function test_CreatePool_Revert_EntryFeeTooLow() public {
        vm.prank(owner);
        vm.expectRevert("Entry fee too low");
        raffle.createPool(MAX_TICKETS, 999_999, DURATION);
    }

    // ── createPool: revert: non-owner ────────────────────────────────────

    function test_CreatePool_Revert_NonOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
    }

    // ── createPoolWithPreset: presets ────────────────────────────────────

    function test_CreatePoolWithPreset_FifteenMinutes() public {
        vm.prank(owner);
        raffle.createPoolWithPreset(
            MAX_TICKETS, ENTRY_FEE,
            ArcRaffle.DurationPreset.FifteenMinutes, 0
        );
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 900);
    }

    function test_CreatePoolWithPreset_ThirtyMinutes() public {
        vm.prank(owner);
        raffle.createPoolWithPreset(
            MAX_TICKETS, ENTRY_FEE,
            ArcRaffle.DurationPreset.ThirtyMinutes, 0
        );
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 1800);
    }

    function test_CreatePoolWithPreset_OneHour() public {
        vm.prank(owner);
        raffle.createPoolWithPreset(
            MAX_TICKETS, ENTRY_FEE,
            ArcRaffle.DurationPreset.OneHour, 0
        );
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 3600);
    }

    function test_CreatePoolWithPreset_TwentyFourHours() public {
        vm.prank(owner);
        raffle.createPoolWithPreset(
            MAX_TICKETS, ENTRY_FEE,
            ArcRaffle.DurationPreset.TwentyFourHours, 0
        );
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 86400);
    }

    function test_CreatePoolWithPreset_SeventyTwoHours() public {
        vm.prank(owner);
        raffle.createPoolWithPreset(
            MAX_TICKETS, ENTRY_FEE,
            ArcRaffle.DurationPreset.SeventyTwoHours, 0
        );
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 259200);
    }

    function test_CreatePoolWithPreset_Custom2Hours() public {
        vm.prank(owner);
        raffle.createPoolWithPreset(
            MAX_TICKETS, ENTRY_FEE,
            ArcRaffle.DurationPreset.Custom, 7200
        );
        ArcRaffle.Pool memory p = raffle.getPool(1);
        assertEq(p.durationSeconds, 7200);
    }
}
