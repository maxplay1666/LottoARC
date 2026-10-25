// SPDX-License-Identifier: MIT
pragma solidity >=0.4.16 ^0.8.20;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 *
 * IMPORTANT: Deprecated in favor of accessing `msg.sender` and `msg.data` directly. This contract, along with its
 * `_msgSender`, `_msgData` and `_contextSuffixLength` functions, will be removed in v6.0, where contracts read
 * `msg.sender` and `msg.data` directly. Contracts that override `_msgSender`/`_msgData` (e.g. to support
 * meta-transactions) will lose that extension point; plan the migration before upgrading.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// lib/openzeppelin-contracts/contracts/utils/StorageSlot.sol

// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.sol.eta.

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol

// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}

// contracts/ArcRaffle.sol

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
