// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ArcRaffle} from "../ArcRaffle.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

/// @dev Abstract base — shared actors, deploy, and helpers.
///      No test_ / testFuzz_ / invariant_ functions here.
abstract contract ArcRaffleBase is Test {
    // ── canonical USDC address hardcoded in contract ──────────────────────
    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;
    address internal constant TREASURY   = 0x3d2b1177305fF33E2384F3e059B9dDE10147ABD5;

    // ── fee constants (mirrors ArcRaffle) ─────────────────────────────────
    uint256 internal constant HOUSE_FEE_BPS    = 500;
    uint256 internal constant WINNER_TAX_BPS   = 98;
    uint256 internal constant BPS_DENOMINATOR  = 10_000;

    // ── timing constants ──────────────────────────────────────────────────
    uint256 internal constant REVEAL_DELAY          = 3;
    uint256 internal constant AUTO_DRAW_GRACE       = 900;
    uint256 internal constant FULL_POOL_DRAW_DELAY  = 600;
    uint256 internal constant MIN_DURATION          = 900;
    uint256 internal constant MAX_DURATION          = 604_800;

    // ── test actors ───────────────────────────────────────────────────────
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob   = makeAddr("bob");
    address internal carol = makeAddr("carol");

    // ── contracts ─────────────────────────────────────────────────────────
    ArcRaffle internal raffle;
    MockERC20  internal usdc;

    // ── standard pool params ──────────────────────────────────────────────
    uint256 internal constant ENTRY_FEE   = 5_000_000;   // 5 USDC (6-dec)
    uint256 internal constant MAX_TICKETS = 5;
    uint256 internal constant DURATION    = 3_600;        // 1 hour

    function setUp() public virtual {
        // 1. Deploy a mock ERC-20, etch its bytecode at the canonical USDC address
        MockERC20 mock = new MockERC20("Mock USDC", "mUSDC", 6);
        vm.etch(USDC_ADDR, address(mock).code);
        usdc = MockERC20(USDC_ADDR);

        // 2. Deploy ArcRaffle owned by `owner`
        vm.prank(owner);
        raffle = new ArcRaffle(owner);

        // 3. Seed players with USDC and grant allowances
        _seedAndApprove(alice, 1_000_000e6);
        _seedAndApprove(bob,   1_000_000e6);
        _seedAndApprove(carol, 1_000_000e6);
        _seedAndApprove(owner, 1_000_000e6);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    function _seedAndApprove(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(raffle), type(uint256).max);
    }

    /// @dev Creates a pool with standard params and returns the poolId.
    function _createStandardPool() internal returns (uint256 poolId) {
        vm.prank(owner);
        raffle.createPool(MAX_TICKETS, ENTRY_FEE, DURATION);
        poolId = raffle.nextPoolId() - 1;
    }

    /// @dev Fills all tickets in a pool using alice, bob, carol round-robin.
    function _fillPool(uint256 poolId) internal {
        address[3] memory players = [alice, bob, carol];
        ArcRaffle.Pool memory p = raffle.getPool(poolId);
        uint256 remaining = p.maxTickets - p.tickets.length;
        for (uint256 i = 0; i < remaining; i++) {
            address player = players[i % 3];
            vm.prank(player);
            raffle.enterPool(poolId, 1);
        }
    }

    /// @dev Computes expected fee split for a given pot.
    function _expectedFees(uint256 pot)
        internal
        pure
        returns (uint256 houseFee, uint256 winnerTax, uint256 winnerPayout)
    {
        houseFee     = (pot * HOUSE_FEE_BPS)   / BPS_DENOMINATOR;
        uint256 prz  = pot - houseFee;
        winnerTax    = (prz * WINNER_TAX_BPS)  / BPS_DENOMINATOR;
        winnerPayout = prz - winnerTax;
    }
}
