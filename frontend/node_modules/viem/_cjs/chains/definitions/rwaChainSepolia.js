"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rwaChainSepolia = void 0;
const chainConfig_js_1 = require("../../op-stack/chainConfig.js");
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
const sourceId = 84532;
exports.rwaChainSepolia = (0, defineChain_js_1.defineChain)({
    ...chainConfig_js_1.chainConfig,
    id: 77410,
    name: 'RWA Chain Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 1_000,
    rpcUrls: {
        default: {
            http: ['https://sepolia-rpc.rwa-chain.io'],
            webSocket: ['wss://sepolia-ws.rwa-chain.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'RWA Chain Sepolia Explorer',
            url: 'https://sepolia-explorer.rwa-chain.io',
            apiUrl: 'https://sepolia-explorer.rwa-chain.io/api',
        },
    },
    contracts: {
        ...chainConfig_js_1.chainConfig.contracts,
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 0,
        },
        disputeGameFactory: {
            [sourceId]: {
                address: '0x6feb86b00a9e8c550770ea663a67c40851e90448',
            },
        },
        portal: {
            [sourceId]: {
                address: '0x4c7d4bf40d7f86bdfd4ef00065571dbc2349a448',
            },
        },
        l1StandardBridge: {
            [sourceId]: {
                address: '0xb389ae59ad2dfd21781aa2cc8a456e029f78ab54',
            },
        },
    },
    testnet: true,
    sourceId,
});
//# sourceMappingURL=rwaChainSepolia.js.map