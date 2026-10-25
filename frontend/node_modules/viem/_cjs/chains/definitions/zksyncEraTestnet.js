"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zksyncEraTestnet = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
const chainConfig_js_1 = require("../../zksync/chainConfig.js");
exports.zksyncEraTestnet = (0, defineChain_js_1.defineChain)({
    ...chainConfig_js_1.chainConfig,
    id: 312,
    name: 'ZKsync Era Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.zksync-era-testnet.zksync.dev'],
            webSocket: ['wss://rpc.zksync-era-testnet.zksync.dev/ws'],
        },
    },
    blockExplorers: {
        default: {
            name: 'ZKsync Explorer',
            url: 'https://block-explorer.zksync-era-testnet.zksync.dev',
            apiUrl: 'https://block-explorer-api.zksync-era-testnet.zksync.dev/api',
        },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 10618,
        },
    },
    testnet: true,
});
//# sourceMappingURL=zksyncEraTestnet.js.map