// ArcRaffle v2 — multi-pool, multi-ticket, auto-draw
export const RAFFLE_ADDRESS = '0x79F7592E01fA78BdC2810B0860B7a11986280793' as `0x${string}`
export const TREASURY_ADDRESS = '0x3d2b1177305fF33E2384F3e059B9dDE10147ABD5' as `0x${string}`
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`
export const USDC_DECIMALS = 6

export const RAFFLE_ABI = [
  // constructor
  { inputs: [{ internalType: 'address', name: 'initialOwner', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' },
  // write
  { inputs: [{ internalType: 'uint256', name: 'maxTickets', type: 'uint256' }, { internalType: 'uint256', name: 'entryFee', type: 'uint256' }, { internalType: 'uint256', name: 'durationSeconds', type: 'uint256' }], name: 'createPool', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }, { internalType: 'uint256', name: 'qty', type: 'uint256' }], name: 'enterPool', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'scheduleDraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'executeDraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'cancelPool', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'cancelExpiredDraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'cancelStalePool', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'cancelExpiredAutoDraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'claimRefund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'claimTreasury', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  // view
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'getPool', outputs: [{ components: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }, { internalType: 'uint256', name: 'maxTickets', type: 'uint256' }, { internalType: 'uint256', name: 'entryFee', type: 'uint256' }, { internalType: 'uint256', name: 'durationSeconds', type: 'uint256' }, { internalType: 'uint256', name: 'createdAt', type: 'uint256' }, { internalType: 'uint256', name: 'deadlineTimestamp', type: 'uint256' }, { internalType: 'address[]', name: 'tickets', type: 'address[]' }, { internalType: 'uint256', name: 'drawBlock', type: 'uint256' }, { internalType: 'uint256', name: 'commitDeadlineBlock', type: 'uint256' }, { internalType: 'uint256', name: 'firstTicketTimestamp', type: 'uint256' }, { internalType: 'uint256', name: 'autoDrawTimestamp', type: 'uint256' }, { internalType: 'uint8', name: 'status', type: 'uint8' }], internalType: 'struct ArcRaffle.Pool', name: '', type: 'tuple' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getOpenPools', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'offset', type: 'uint256' }, { internalType: 'uint256', name: 'limit', type: 'uint256' }], name: 'getAllPools', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'player', type: 'address' }, { internalType: 'uint256', name: 'offset', type: 'uint256' }, { internalType: 'uint256', name: 'limit', type: 'uint256' }], name: 'getMyPools', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'isTimedOut', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'nextPoolId', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'treasuryBalance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'pendingRefunds', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'TREASURY', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'MIN_DURATION', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'MAX_DURATION', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // events
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'poolId', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'maxTickets', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'entryFee', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'durationSeconds', type: 'uint256' }], name: 'PoolCreated', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'poolId', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'player', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'ticketIndex', type: 'uint256' }], name: 'PoolEntered', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'PoolFull', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'poolId', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'winner', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'winnerPayout', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'pot', type: 'uint256' }], name: 'WinnerDrawn', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'poolId', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'drawBlock', type: 'uint256' }], name: 'DrawScheduled', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'poolId', type: 'uint256' }], name: 'PoolCancelled', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'by', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'TreasuryClaimed', type: 'event' },
] as const
