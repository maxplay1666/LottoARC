import type { ReplacementReason } from '../../actions/public/waitForTransactionReceipt.js';
import type { Transaction } from '../Transaction.js';
/**
 * Tempo transaction replacement semantics.
 *
 * - Protocol nonces (nonce key `0`, including Ethereum transaction types) and
 *   2D nonces occupy the sender's `(nonceKey, nonce)` slot.
 * - Expiring nonces are deduplicated by their expiring nonce hash, so a
 *   transaction is replaced only by another carrying the same sender payload
 *   (e.g. re-sponsored with a different fee payer signature or fee token).
 */
export declare const transactionReplacement: {
    readonly getKey: (transaction: {
        from: import("abitype").Address;
        hash: `0x${string}`;
        nonce: number;
    }) => string;
    readonly getReason: ({ replaced, replacement }: {
        replaced: {
            from: import("abitype").Address;
            hash: `0x${string}`;
            nonce: number;
        };
        replacement: {
            from: import("abitype").Address;
            hash: `0x${string}`;
            nonce: number;
        };
    }) => ReplacementReason;
};
/**
 * Returns the expiring nonce hash of a Tempo transaction:
 * `keccak256(encodeForSigning(tx) || sender)`. It excludes the fee payer
 * signature and fee token, so it is invariant to sponsorship.
 *
 * @internal
 */
export declare function getExpiringNonceHash(transaction: Transaction): `0x${string}`;
//# sourceMappingURL=replacement.d.ts.map