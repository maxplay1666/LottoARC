"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionReplacement = void 0;
exports.getExpiringNonceHash = getExpiringNonceHash;
const Hex = require("ox/Hex");
const tempo_1 = require("ox/tempo");
const number_js_1 = require("../../constants/number.js");
const isAddressEqual_js_1 = require("../../utils/address/isAddressEqual.js");
const keccak256_js_1 = require("../../utils/hash/keccak256.js");
exports.transactionReplacement = {
    getKey(transaction) {
        const tx = transaction;
        if (tx.type !== 'tempo')
            return `0:${tx.nonce}`;
        const nonceKey = tx.nonceKey ?? 0n;
        if (nonceKey === number_js_1.maxUint256)
            return `expiring:${getExpiringNonceHash(tx)}`;
        return `${nonceKey}:${tx.nonce}`;
    },
    getReason({ replaced, replacement }) {
        return getReason(replaced, replacement);
    },
};
function getExpiringNonceHash(transaction) {
    const tx = transaction;
    const envelope = tempo_1.TxEnvelopeTempo.from({
        accessList: tx.accessList,
        authorizationList: tx.authorizationList,
        calls: tx.calls,
        chainId: tx.chainId,
        feePayerSignature: tx.feePayerSignature ? null : undefined,
        feeToken: tx.feeToken,
        gas: tx.gas,
        keyAuthorization: tx.keyAuthorization ?? undefined,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        nonce: BigInt(tx.nonce),
        nonceKey: tx.nonceKey,
        validAfter: tx.validAfter,
        validBefore: tx.validBefore,
    });
    return (0, keccak256_js_1.keccak256)(Hex.concat(tempo_1.TxEnvelopeTempo.encodeForSigning(envelope), tx.from));
}
function getReason(replaced, replacement) {
    const calls = getCalls(replacement);
    const replacedCalls = getCalls(replaced);
    if (calls.length === replacedCalls.length &&
        calls.every((call, i) => isSameCall(call, replacedCalls[i])))
        return 'repriced';
    if (calls.every((call) => call.to &&
        (0, isAddressEqual_js_1.isAddressEqual)(call.to, replacement.from) &&
        !call.value &&
        isEmpty(call.data)))
        return 'cancelled';
    return 'replaced';
}
function getCalls(transaction) {
    if (transaction.type === 'tempo')
        return transaction.calls;
    return [
        { data: transaction.input, to: transaction.to, value: transaction.value },
    ];
}
function isSameCall(a, b) {
    return ((a.to && b.to ? (0, isAddressEqual_js_1.isAddressEqual)(a.to, b.to) : !a.to && !b.to) &&
        (a.value ?? 0n) === (b.value ?? 0n) &&
        (isEmpty(a.data) ? isEmpty(b.data) : a.data === b.data));
}
function isEmpty(data) {
    return !data || data === '0x';
}
//# sourceMappingURL=replacement.js.map