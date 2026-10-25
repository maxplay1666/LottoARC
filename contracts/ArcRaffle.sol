// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ArcRaffle is Ownable, ReentrancyGuard {
    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);

    enum PoolStatus {
        Open,
        DrawScheduled,
        Closed,
        Cancelled
    }

    enum DurationPreset {
        FifteenMinutes,
        ThirtyMinutes,
        OneHour,
        TwentyFourHours,
        SeventyTwoHours,
        Custom
    }

    struct Pool {
        uint256 poolId;
        uint256 maxTickets;
        uint256 entryFee;
        uint256 durationSeconds;
        uint256 createdAt;
        uint256 deadlineTimestamp;
        address[] tickets;
        uint256 drawBlock;
        uint256 commitDeadlineBlock;
        uint256 firstTicketTimestamp;
        uint256 autoDrawTimestamp;
        PoolStatus status;
    }

    uint256 public nextPoolId;
    mapping(uint256 => Pool) public pools;

    uint256[] public openPoolIds;
    mapping(uint256 => uint256) private _openPoolIndexPlusOne;

    uint256[] public allPoolIds;

    mapping(address => mapping(uint256 => bool)) private _playerEnteredPool;
    mapping(address => uint256[]) private _playerPoolList;

    mapping(address => uint256) public pendingRefunds;
    uint256 public treasuryBalance;

    address public immutable TREASURY = 0x3d2b1177305fF33E2384F3e059B9dDE10147ABD5;

    uint256 public constant HOUSE_FEE_BPS = 500;
    uint256 public constant WINNER_TAX_BPS = 98;
    uint256 private constant BPS_DENOMINATOR = 10_000;

    uint256 public constant MIN_DURATION = 900;
    uint256 public constant MAX_DURATION = 604800;
    uint256 public constant REVEAL_DELAY = 3;
    uint256 public constant AUTO_DRAW_GRACE = 900;
    uint256 public constant FULL_POOL_DRAW_DELAY = 600;

    uint256 public constant MIN_TICKETS = 2;
    uint256 public constant MAX_TICKETS_CAP = 100;
    uint256 public constant FRONTEND_PAGE_SIZE = 20;

    uint256 public constant PRESET_15_MIN = 15 minutes;
    uint256 public constant PRESET_30_MIN = 30 minutes;
    uint256 public constant PRESET_1_HOUR = 1 hours;
    uint256 public constant PRESET_24_HOURS = 24 hours;
    uint256 public constant PRESET_72_HOURS = 72 hours;

    event PoolCreated(uint256 indexed poolId, uint256 maxTickets, uint256 entryFee, uint256 durationSeconds);
    event PoolEntered(uint256 indexed poolId, address indexed player, uint256 ticketIndex);
    event PoolFull(uint256 indexed poolId);
    event DrawScheduled(uint256 indexed poolId, uint256 drawBlock);
    event WinnerDrawn(uint256 indexed poolId, address indexed winner, uint256 winnerPayout, uint256 pot);
    event PoolCancelled(uint256 indexed poolId);
    event TreasuryClaimed(address indexed by, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {
        nextPoolId = 1;
    }

    function createPool(uint256 maxTickets, uint256 entryFee, uint256 durationSeconds) external onlyOwner {
        _createPool(maxTickets, entryFee, durationSeconds);
    }

    function createPoolWithPreset(
        uint256 maxTickets,
        uint256 entryFee,
        DurationPreset preset,
        uint256 customDurationSeconds
    ) external onlyOwner {
        uint256 durationSeconds = _resolveDuration(preset, customDurationSeconds);
        _createPool(maxTickets, entryFee, durationSeconds);
    }

    function enterPool(uint256 poolId) external nonReentrant {
        _enterPool(poolId, 1);
    }

    function enterPool(uint256 poolId, uint256 qty) external nonReentrant {
        _enterPool(poolId, qty);
    }

    function scheduleDraw(uint256 poolId) external onlyOwner {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.Open, "Pool not open");
        require(pool.drawBlock == 0, "Draw already scheduled");
        require(pool.autoDrawTimestamp == 0, "Auto draw pending");
        require(block.timestamp <= pool.deadlineTimestamp, "Pool deadline passed");
        require(pool.tickets.length >= 2, "Need at least 2 tickets");
        require(pool.tickets.length < pool.maxTickets, "Pool full uses auto draw");

        uint256 scheduledBlock = block.number + REVEAL_DELAY;
        pool.drawBlock = scheduledBlock;
        pool.commitDeadlineBlock = scheduledBlock + 256;
        pool.status = PoolStatus.DrawScheduled;

        _removeFromOpenPools(poolId);

        emit DrawScheduled(poolId, scheduledBlock);
    }

    function executeDraw(uint256 poolId) external nonReentrant {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        uint256 ticketCount = pool.tickets.length;
        require(ticketCount >= 2, "Need at least 2 tickets");

        bool hasAutoPath = pool.autoDrawTimestamp > 0;
        bool hasManualPath = pool.drawBlock > 0;
        require(hasAutoPath || hasManualPath, "No draw path");

        uint256 random;

        if (hasAutoPath) {
            require(pool.status == PoolStatus.Open, "Pool not open");
            require(block.timestamp >= pool.autoDrawTimestamp, "Auto draw countdown active");
            require(ticketCount == pool.maxTickets, "Pool not full");

            random = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, poolId)));
        } else {
            require(pool.status == PoolStatus.DrawScheduled, "Draw not scheduled");
            require(block.number > pool.drawBlock, "Draw block not reached");
            require(block.number <= pool.commitDeadlineBlock, "Draw expired");
            require(blockhash(pool.drawBlock) != bytes32(0), "Block hash unavailable");

            random = uint256(keccak256(abi.encodePacked(blockhash(pool.drawBlock), poolId)));
        }

        uint256 pot = ticketCount * pool.entryFee;
        uint256 houseFee = (pot * HOUSE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 prizeAfterHouseFee = pot - houseFee;
        uint256 winnerTax = (prizeAfterHouseFee * WINNER_TAX_BPS) / BPS_DENOMINATOR;
        uint256 winnerPayout = prizeAfterHouseFee - winnerTax;

        address winner = pool.tickets[random % ticketCount];

        pool.status = PoolStatus.Closed;
        pool.autoDrawTimestamp = 0;

        treasuryBalance += winnerTax;
        pendingRefunds[owner()] += houseFee;
        pendingRefunds[winner] += winnerPayout;

        _removeFromOpenPools(poolId);

        emit WinnerDrawn(poolId, winner, winnerPayout, pot);
    }

    function cancelPool(uint256 poolId) external onlyOwner nonReentrant {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.Open, "Pool not open");
        require(pool.autoDrawTimestamp == 0, "Auto draw pending");

        _accruePoolRefunds(poolId);

        pool.status = PoolStatus.Cancelled;
        _removeFromOpenPools(poolId);

        emit PoolCancelled(poolId);
    }

    function cancelStalePool(uint256 poolId) external nonReentrant {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.Open, "Pool not open");
        require(pool.autoDrawTimestamp == 0, "Use cancelExpiredAutoDraw");
        require(pool.drawBlock == 0, "Draw already scheduled");
        require(block.timestamp > pool.deadlineTimestamp, "Pool not expired");
        require(pool.tickets.length >= 1, "No tickets");

        _accruePoolRefunds(poolId);

        pool.status = PoolStatus.Cancelled;
        _removeFromOpenPools(poolId);

        emit PoolCancelled(poolId);
    }

    function cancelExpiredDraw(uint256 poolId) external nonReentrant {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.DrawScheduled, "Draw not scheduled");
        require(block.number > pool.commitDeadlineBlock, "Draw not expired");

        _accruePoolRefunds(poolId);

        pool.status = PoolStatus.Cancelled;
        _removeFromOpenPools(poolId);

        emit PoolCancelled(poolId);
    }

    function cancelExpiredAutoDraw(uint256 poolId) external nonReentrant {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.Open, "Pool not open");
        require(pool.autoDrawTimestamp > 0, "Auto draw not set");
        require(block.timestamp > pool.autoDrawTimestamp + AUTO_DRAW_GRACE, "Auto draw not expired");

        _accruePoolRefunds(poolId);

        pool.status = PoolStatus.Cancelled;
        _removeFromOpenPools(poolId);

        emit PoolCancelled(poolId);
    }

    function claimRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No refund available");

        pendingRefunds[msg.sender] = 0;

        bool refunded = USDC.transfer(msg.sender, amount);
        require(refunded, "Refund transfer failed");
    }

    function claimTreasury() external nonReentrant {
        require(msg.sender == TREASURY, "Not treasury");

        uint256 amount = treasuryBalance;
        require(amount > 0, "Nothing to claim");

        treasuryBalance = 0;

        bool ok = USDC.transfer(TREASURY, amount);
        require(ok, "Transfer failed");

        emit TreasuryClaimed(TREASURY, amount);
    }

    function renounceOwnership() public override onlyOwner {
        require(openPoolIds.length == 0, "ArcRaffle: active pool");
        super.renounceOwnership();
    }

    function getPoolTickets(uint256 poolId) external view returns (address[] memory) {
        require(_poolExists(poolId), "Pool does not exist");
        return pools[poolId].tickets;
    }

    function getPoolPot(uint256 poolId) external view returns (uint256) {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        return pool.tickets.length * pool.entryFee;
    }

    function getOpenPools() external view returns (uint256[] memory) {
        return openPoolIds;
    }

    function getAllPools(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (limit == 0) {
            return new uint256[](0);
        }

        uint256 total = allPoolIds.length;
        if (offset >= total) {
            return new uint256[](0);
        }

        uint256 cappedLimit = limit;
        if (cappedLimit > FRONTEND_PAGE_SIZE) {
            cappedLimit = FRONTEND_PAGE_SIZE;
        }

        uint256 remaining = total - offset;
        uint256 count = cappedLimit < remaining ? cappedLimit : remaining;

        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = allPoolIds[total - 1 - (offset + i)];
        }

        return ids;
    }

    function getMyPools(address player, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (limit == 0) {
            return new uint256[](0);
        }

        uint256 cappedLimit = limit;
        if (cappedLimit > FRONTEND_PAGE_SIZE) {
            cappedLimit = FRONTEND_PAGE_SIZE;
        }

        uint256[] storage playerPools = _playerPoolList[player];
        uint256 total = playerPools.length;
        if (offset >= total) {
            return new uint256[](0);
        }

        uint256 remaining = total - offset;
        uint256 count = cappedLimit < remaining ? cappedLimit : remaining;

        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = playerPools[total - 1 - (offset + i)];
        }

        return ids;
    }

    function getPool(uint256 poolId) external view returns (Pool memory) {
        require(_poolExists(poolId), "Pool does not exist");
        return pools[poolId];
    }

    function isTimedOut(uint256 poolId) external view returns (bool) {
        require(_poolExists(poolId), "Pool does not exist");

        Pool storage pool = pools[poolId];
        return
            pool.status == PoolStatus.Open &&
            block.timestamp > pool.deadlineTimestamp &&
            pool.tickets.length < pool.maxTickets;
    }

    function _createPool(uint256 maxTickets, uint256 entryFee, uint256 durationSeconds) internal {
        require(maxTickets >= MIN_TICKETS && maxTickets <= MAX_TICKETS_CAP, "Invalid max tickets");
        require(entryFee >= 1_000_000, "Entry fee too low");
        require(durationSeconds >= MIN_DURATION && durationSeconds <= MAX_DURATION, "Invalid duration");

        uint256 poolId = nextPoolId;
        nextPoolId = poolId + 1;

        Pool storage pool = pools[poolId];
        pool.poolId = poolId;
        pool.maxTickets = maxTickets;
        pool.entryFee = entryFee;
        pool.durationSeconds = durationSeconds;
        pool.createdAt = block.timestamp;
        pool.deadlineTimestamp = block.timestamp + durationSeconds;
        pool.status = PoolStatus.Open;

        _openPoolIndexPlusOne[poolId] = openPoolIds.length + 1;
        openPoolIds.push(poolId);
        allPoolIds.push(poolId);

        emit PoolCreated(poolId, maxTickets, entryFee, durationSeconds);
    }

    function _enterPool(uint256 poolId, uint256 qty) internal {
        require(_poolExists(poolId), "Pool does not exist");
        require(qty >= 1, "Invalid quantity");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.Open, "Pool not open");
        require(pool.drawBlock == 0, "Draw already scheduled");
        require(block.timestamp <= pool.deadlineTimestamp, "Pool deadline passed");

        uint256 ticketCount = pool.tickets.length;
        require(ticketCount < pool.maxTickets, "Pool full");

        uint256 remaining = pool.maxTickets - ticketCount;
        require(qty <= remaining, "Quantity exceeds remaining slots");

        // ── Effects (all state changes BEFORE external call) ────────────────
        if (ticketCount == 0) {
            pool.firstTicketTimestamp = block.timestamp;
        }

        for (uint256 i = 0; i < qty; i++) {
            pool.tickets.push(msg.sender);
            emit PoolEntered(poolId, msg.sender, ticketCount + i);
        }

        if (!_playerEnteredPool[msg.sender][poolId]) {
            _playerEnteredPool[msg.sender][poolId] = true;
            _playerPoolList[msg.sender].push(poolId);
        }

        bool isFull = pool.tickets.length == pool.maxTickets;
        if (isFull) {
            pool.autoDrawTimestamp = block.timestamp + FULL_POOL_DRAW_DELAY;
            emit PoolFull(poolId);
        }

        uint256 totalCost = pool.entryFee * qty;

        // ── Interaction (external call LAST) ────────────────────────────────
        bool pulled = USDC.transferFrom(msg.sender, address(this), totalCost);
        require(pulled, "USDC transfer failed");
    }

    function _resolveDuration(DurationPreset preset, uint256 customDurationSeconds) internal pure returns (uint256) {
        if (preset == DurationPreset.FifteenMinutes) {
            return PRESET_15_MIN;
        }
        if (preset == DurationPreset.ThirtyMinutes) {
            return PRESET_30_MIN;
        }
        if (preset == DurationPreset.OneHour) {
            return PRESET_1_HOUR;
        }
        if (preset == DurationPreset.TwentyFourHours) {
            return PRESET_24_HOURS;
        }
        if (preset == DurationPreset.SeventyTwoHours) {
            return PRESET_72_HOURS;
        }

        require(preset == DurationPreset.Custom, "Invalid preset");
        return customDurationSeconds;
    }

    function _accruePoolRefunds(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        uint256 ticketCount = pool.tickets.length;

        for (uint256 i = 0; i < ticketCount; i++) {
            pendingRefunds[pool.tickets[i]] += pool.entryFee;
        }
    }

    function _removeFromOpenPools(uint256 poolId) internal {
        uint256 indexPlusOne = _openPoolIndexPlusOne[poolId];
        if (indexPlusOne == 0) {
            return;
        }

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = openPoolIds.length - 1;

        if (index != lastIndex) {
            uint256 lastPoolId = openPoolIds[lastIndex];
            openPoolIds[index] = lastPoolId;
            _openPoolIndexPlusOne[lastPoolId] = index + 1;
        }

        openPoolIds.pop();
        delete _openPoolIndexPlusOne[poolId];
    }

    function _poolExists(uint256 poolId) internal view returns (bool) {
        return poolId > 0 && poolId < nextPoolId;
    }
}
