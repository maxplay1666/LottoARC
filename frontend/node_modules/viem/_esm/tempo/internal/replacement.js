import * as Hex from 'ox/Hex';
import { TxEnvelopeTempo } from 'ox/tempo';
import { maxUint256 } from '../../constants/number.js';
import { isAddressEqual } from '../../utils/address/isAddressEqual.js';
import { keccak256 } from '../../utils/hash/keccak256.js';
/**
 * Tempo transaction replacement semantics.
 *
 * - Protocol nonces (nonce key `0`, including Ethereum transaction types) and
 *   2D nonces occupy the sender's `(nonceKey, nonce)` slot.
 * - Expiring nonces are deduplicated by their expiring nonce hash, so a
 *   transaction is replaced only by another carrying the same sender payload
 *   (e.g. re-sponsored with a different fee payer signature or fee token).
 */
export const transactionReplacement = {
    getKey(transaction) {
        const tx = transaction;
        if (tx.type !== 'tempo')
            return `0:${tx.nonce}`;
        const nonceKey = tx.nonceKey ?? 0n;
        if (nonceKey === maxUint256)
            return `expiring:${getExpiringNonceHash(tx)}`;
        return `${nonceKey}:${tx.nonce}`;
    },
    getReason({ replaced, replacement }) {
        return getReason(replaced, replacement);
    },
};
/**
 * Returns the expiring nonce hash of a Tempo transaction:
 * `keccak256(encodeForSigning(tx) || sender)`. It excludes the fee payer
 * signature and fee token, so it is invariant to sponsorship.
 *
 * @internal
 */
export function getExpiringNonceHash(transaction) {
    const tx = transaction;
    const envelope = TxEnvelopeTempo.from({
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
    return keccak256(Hex.concat(TxEnvelopeTempo.encodeForSigning(envelope), tx.from));
}
function getReason(replaced, replacement) {
    const calls = getCalls(replacement);
    const replacedCalls = getCalls(replaced);
    if (calls.length === replacedCalls.length &&
        calls.every((call, i) => isSameCall(call, replacedCalls[i])))
        return 'repriced';
    if (calls.every((call) => call.to &&
        isAddressEqual(call.to, replacement.from) &&
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
    return ((a.to && b.to ? isAddressEqual(a.to, b.to) : !a.to && !b.to) &&
        (a.value ?? 0n) === (b.value ?? 0n) &&
        (isEmpty(a.data) ? isEmpty(b.data) : a.data === b.data));
}
function isEmpty(data) {
    return !data || data === '0x';
}
//# sourceMappingURL=replacement.js.map