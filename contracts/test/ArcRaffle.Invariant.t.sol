// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ArcRaffleBase} from "./ArcRaffle.Base.t.sol";
import {ArcRaffle} from "../ArcRaffle.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";
import {Test} from "forge-std/Test.sol";

/// @dev Handler that drives the invariant test.
///      Wraps the state-changing calls so the fuzzer can compose them.
contract RaffleHandler is Test {
    ArcRaffle public raffle;
    MockERC20  public usdc;

    address internal owner;
    address internal alice;
    address internal bob;

    uint256 public currentPool;          // tracks the most-recently created pool

    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;
    uint256 internal constant ENTRY_FEE   = 5_000_000;
    uint256 internal constant MAX_TICKETS = 5;
    uint256 internal constant DURATION    = 3_600;

    constructor(ArcRaffle _raffle, MockERC20 _usdc, address _owner, address _alice, address _bob) {
        raffle = _raffle;
        usdc   = _usdc;
        owner  = _owner;
        alice  = _alice;
        bob    = _bob;
    }

    // ── actions ───────────────────────────────────────────────────────────

    function createPool() external {
        vm.prank(owner);
        try raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION) {
            currentPool = raffle.nextPoolId() - 1;
        } catch {}
    }

    function enterPool(uint8 rawQty) external {
        if (currentPool == 0) return;
        uint256 qty = bound(rawQty, 1, MAX_TICKETS);
        // ensure alice has enough USDC and allowance
        _ensureFunds(alice, qty);
        vm.prank(alice);
        try raffle.enterPool(currentPool, qty) {} catch {}
    }

    function enterPoolBob(uint8 rawQty) external {
        if (currentPool == 0) return;
        uint256 qty = bound(rawQty, 1, MAX_TICKETS);
        _ensureFunds(bob, qty);
        vm.prank(bob);
        try raffle.enterPool(currentPool, qty) {} catch {}
    }

    function cancelPool() external {
        if (currentPool == 0) return;
        vm.prank(owner);
        try raffle.cancelPool(currentPool) {} catch {}
    }

    function cancelStalePool() external {
        if (currentPool == 0) return;
        try raffle.cancelStalePool(currentPool) {} catch {}
    }

    function cancelExpiredAutoDraw() external {
        if (currentPool == 0) return;
        try raffle.cancelExpiredAutoDraw(currentPool) {} catch {}
    }

    function cancelExpiredDraw() external {
        if (currentPool == 0) return;
        try raffle.cancelExpiredDraw(currentPool) {} catch {}
    }

    function scheduleDraw() external {
        if (currentPool == 0) return;
        vm.prank(owner);
        try raffle.scheduleDraw(currentPool) {} catch {}
    }

    function executeDraw() external {
        if (currentPool == 0) return;
        try raffle.executeDraw(currentPool) {} catch {}
    }

    function claimRefundAlice() external {
        vm.prank(alice);
        try raffle.claimRefund() {} catch {}
    }

    function claimRefundBob() external {
        vm.prank(bob);
        try raffle.claimRefund() {} catch {}
    }

    function claimRefundOwner() external {
        vm.prank(owner);
        try raffle.claimRefund() {} catch {}
    }

    function warpForward(uint32 seconds_) external {
        vm.warp(block.timestamp + bound(seconds_, 1, 7 days));
    }

    function rollForward(uint8 blocks_) external {
        vm.roll(block.number + bound(blocks_, 1, 300));
    }

    // ── internal helpers ──────────────────────────────────────────────────

    function _ensureFunds(address who, uint256 qty) internal {
        uint256 needed = qty * ENTRY_FEE;
        if (usdc.balanceOf(who) < needed) {
            usdc.mint(who, needed * 10);
        }
        vm.prank(who);
        usdc.approve(address(raffle), type(uint256).max);
    }
}

// ── Invariant test contract ───────────────────────────────────────────────────

contract ArcRaffleInvariantTest is ArcRaffleBase {
    RaffleHandler internal handler;

    function setUp() public override {
        super.setUp();
        // Create a starting pool so the handler has something to work with
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);

        handler = new RaffleHandler(raffle, usdc, owner, alice, bob);
        handler.createPool(); // give handler its own pool to thrash

        targetContract(address(handler));
    }

    /// @dev Core invariant: the sum of all pending refunds plus treasuryBalance
    ///      must never exceed the raffle's actual USDC balance.
    ///      (Winners' pending refunds are also included in pendingRefunds.)
    function invariant_PendingRefundsNeverExceedBalance() public view {
        uint256 contractBalance = usdc.balanceOf(address(raffle));

        // Sum tracked liabilities
        uint256 aliceRefund = raffle.pendingRefunds(alice);
        uint256 bobRefund   = raffle.pendingRefunds(bob);
        uint256 ownerRefund = raffle.pendingRefunds(owner);
        uint256 treasury    = raffle.treasuryBalance();

        uint256 totalLiabilities = aliceRefund + bobRefund + ownerRefund + treasury;

        assertLe(
            totalLiabilities,
            contractBalance,
            "Liabilities exceed contract USDC balance"
        );
    }

    /// @dev Status sanity: a cancelled pool is never also in openPoolIds.
    function invariant_CancelledPoolNotInOpenList() public view {
        uint256[] memory open = raffle.getOpenPools();
        for (uint256 i = 0; i < open.length; i++) {
            ArcRaffle.Pool memory p = raffle.getPool(open[i]);
            assertTrue(
                p.status != ArcRaffle.PoolStatus.Cancelled &&
                p.status != ArcRaffle.PoolStatus.Closed,
                "Closed/cancelled pool found in openPoolIds"
            );
        }
    }

    /// @dev nextPoolId is always > any known pool id in allPoolIds.
    function invariant_NextPoolIdConsistency() public view {
        uint256 next = raffle.nextPoolId();
        // We can't easily read all allPoolIds in a view without a getter,
        // but we can assert that any pool we created has id < nextPoolId
        if (handler.currentPool() > 0) {
            assertLt(handler.currentPool(), next);
        }
    }
}
