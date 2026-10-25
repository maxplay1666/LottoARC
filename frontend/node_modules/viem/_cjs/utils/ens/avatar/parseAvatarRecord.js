"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAvatarRecord = parseAvatarRecord;
const Base64 = require("ox/Base64");
const utils_js_1 = require("./utils.js");
async function parseAvatarRecord(client, { gatewayUrls, record, }) {
    if (/eip155:/i.test(record))
        return parseNftAvatarUri(client, { gatewayUrls, record });
    return (0, utils_js_1.parseAvatarUri)({ uri: record, gatewayUrls });
}
async function parseNftAvatarUri(client, { gatewayUrls, record, }) {
    const nft = (0, utils_js_1.parseNftUri)(record);
    const nftUri = await (0, utils_js_1.getNftTokenUri)(client, { nft });
    const { uri: resolvedNftUri, isOnChain, isEncoded, } = (0, utils_js_1.resolveAvatarUri)({ uri: nftUri, gatewayUrls });
    if (isOnChain &&
        (resolvedNftUri.includes('data:application/json;base64,') ||
            resolvedNftUri.startsWith('{'))) {
        const encodedJson = isEncoded
            ?
                Base64.toString(resolvedNftUri
                    .replace('data:application/json;base64,', '')
                    .replace(/\s/g, ''))
            :
                resolvedNftUri;
        const decoded = JSON.parse(encodedJson);
        return (0, utils_js_1.parseAvatarUri)({ uri: (0, utils_js_1.getJsonImage)(decoded), gatewayUrls });
    }
    return (0, utils_js_1.getMetadataAvatarUri)({
        gatewayUrls,
        uri: (0, utils_js_1.getNftMetadataUri)({ nft, uri: resolvedNftUri }),
    });
}
//# sourceMappingURL=parseAvatarRecord.js.map