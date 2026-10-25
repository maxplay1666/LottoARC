import { Address as core_Address, Hash, Hex, Rlp, RpcResponse, Signature, } from 'ox';
import { AccountConfig, KeyAuthorization, SignatureEnvelope, TxEnvelopeTempo, } from 'ox/tempo';
import { getBlockNumber } from '../../../actions/public/getBlockNumber.js';
import { readContract } from '../../../actions/public/readContract.js';
import { createClient } from '../../../clients/createClient.js';
import { http } from '../../../clients/transports/http.js';
import * as AccessKey from '../../actions/accessKey.js';
import * as Transaction from '../../Transaction.js';
import * as Accounts from './accounts.js';
import * as Request from './request.js';
import * as Utils from './utils.js';
export function create(options) {
    // Bind signing permission to the middleware invocation and its validated payload.
    const authorized = new WeakMap();
    const allowedFeePayers = new Set(options.allowedFeePayers?.map((url) => ExternalFeePayerUrl.normalize(url, {
        allowUnsafe: options.internal_allowUnsafeUrls,
    })));
    const validity = options.validity ?? defaultValidity;
    // A non-integer window would let `Validity.assert` admit unbounded `validBefore` values.
    if (!Number.isSafeInteger(validity) || validity <= 0)
        throw new RpcResponse.InvalidParamsError({
            message: 'Expected `validity` to be a positive integer number of seconds.',
        });
    const resolveFeeToken = (chainId) => {
        if (typeof options.feeToken !== 'function')
            return options.feeToken;
        if (chainId === undefined)
            return undefined;
        return options.feeToken({ chainId });
    };
    return {
        async handleRequest(context, next) {
            const { request } = context;
            if (![
                'eth_fillTransaction',
                'eth_signRawTransaction',
                'eth_sendRawTransaction',
                'eth_sendRawTransactionSync',
            ].includes(request.method))
                return next();
            const { client, getClient, options: requestOptions } = context;
            const chainId = requestOptions.chainId;
            const getTokens = (id) => context.resolveTokens(id);
            const record = (details) => {
                if (details && requestOptions.response)
                    requestOptions.response.sponsorship_details = details;
            };
            if (request.method !== 'eth_fillTransaction') {
                if (!options.account) {
                    if (request.method === 'eth_signRawTransaction')
                        throw new RpcResponse.MethodNotFoundError({
                            message: 'eth_signRawTransaction requires a fee payer to be configured on the relay. Add `Relay.feePayer({ account })` to enable transaction sponsorship.',
                        });
                    return next();
                }
                const serialized = request.params?.[0];
                if (typeof serialized !== 'string' ||
                    !requestsRawSponsorship(serialized))
                    return next();
                const result = await handleRawTransaction({
                    account: options.account,
                    getClient,
                    getFeeToken: async (id) => (await getTokens(id))[0],
                    method: request.method,
                    minimumBaseFee: options.minimumBaseFee ?? defaultMinimumBaseFee,
                    onRejected: options.onRejected,
                    onSponsored: options.onSponsored,
                    request,
                    resolveFeeToken,
                    validate: options.validate,
                    validity,
                });
                record(result.sponsorshipDetails);
                return result.result;
            }
            const parameters = request.params[0];
            const { feePayer: _, ...normalized } = Utils.normalizeFillTransactionRequest(parameters);
            const external = typeof parameters.feePayer === 'string'
                ? ExternalFeePayerUrl.normalize(parameters.feePayer, {
                    allowUnsafe: options.internal_allowUnsafeUrls ?? false,
                })
                : undefined;
            if (external && !allowedFeePayers.has(external))
                throw new RpcResponse.InvalidParamsError({
                    message: 'External fee payer URL is not allowed.',
                });
            const wantsSponsorship = (!!options.account || !!external) && parameters.feePayer !== false;
            if (options.account && !external)
                delete normalized.feePayerSignature;
            const base = { ...normalized, chainId };
            if (!wantsSponsorship)
                return Request.fill(client, base);
            // An external fee payer picks its own token, so the local sponsor's preference stays out of its request.
            const token = external
                ? (parameters.feeToken ??
                    (await getTokens(chainId))[0])
                : (resolveFeeToken(chainId) ??
                    parameters.feeToken ??
                    (!options.validate ? (await getTokens(chainId))[0] : undefined));
            const transaction = {
                ...base,
                feePayer: true,
                ...(token ? { feeToken: token } : {}),
            };
            const prepared = isPreparedTransaction(transaction);
            const fillClient = external
                ? createClient({
                    chain: client.chain,
                    transport: http(external, {
                        fetchOptions: { redirect: 'error' },
                        retryCount: 0,
                    }),
                })
                : client;
            const result = prepared && !external
                ? { tx: transaction }
                : await Request.fill(fillClient, transaction, external ? { ...requestOptions, retryCount: 0 } : requestOptions);
            const filled = Utils.normalizeTempoTransaction(result.tx);
            // Reserve intrinsic gas for larger signatures before validating and signing the candidate.
            if ((!prepared || parameters.feePayer !== true) &&
                filled.gas &&
                !filled.feePayerSignature)
                filled.gas += 20000n;
            if (token && (!external || filled.feeToken == null))
                Object.assign(filled, { feeToken: token });
            const defer = typeof normalized.configurableAccountSimulation === 'object' &&
                normalized.configurableAccountSimulation !== null;
            // Bound before validation so the validated envelope is the one signed, and returned signatures expire.
            const signs = !!options.account && !external && !defer;
            if (signs && filled.validBefore == null)
                filled.validBefore = Validity.generate({ validity });
            const sponsored = external ||
                !options.validate ||
                (await shouldSponsor({
                    sender: parameters.from,
                    transaction: filled,
                    validate: options.validate,
                }));
            if (!sponsored)
                return Request.fill(client, { ...base, feePayer: false });
            if (signs)
                Validity.assert(filled, { validity });
            const sponsor = sponsored
                ? external
                    ? (result.capabilities?.sponsor ?? result.sponsor)
                    : options.account
                        ? getSponsor({ ...options, account: options.account })
                        : undefined
                : undefined;
            if (options.account && !external && !defer) {
                delete filled.signature;
                if (!filled.from)
                    filled.from = parameters.from;
                authorized.set(context, TxEnvelopeTempo.getFeePayerSignPayload(TxEnvelopeTempo.from(filled), { sender: filled.from }));
            }
            return {
                ...result,
                ...(sponsor ? { sponsor } : {}),
                tx: Utils.formatTempoTransaction(filled),
                capabilities: {
                    ...result.capabilities,
                    sponsored: external
                        ? (result.capabilities?.sponsored ?? !!sponsor)
                        : !!sponsor,
                    ...(sponsor ? { sponsor } : {}),
                },
            };
        },
        async signTransaction(result, context) {
            const approved = authorized.get(context);
            authorized.delete(context);
            const parameters = context.request.params[0];
            if (!approved ||
                !options.account ||
                typeof parameters.feePayer === 'string' ||
                parameters.feePayer === false ||
                !result.capabilities?.sponsored ||
                (typeof parameters.configurableAccountSimulation === 'object' &&
                    parameters.configurableAccountSimulation !== null))
                return undefined;
            const transaction = Utils.normalizeTempoTransaction(result.tx);
            const payload = TxEnvelopeTempo.getFeePayerSignPayload(TxEnvelopeTempo.from(transaction), { sender: (transaction.from ?? parameters.from) });
            if (payload !== approved)
                throw new RpcResponse.InvalidParamsError({
                    message: 'Sponsored transaction changed after validation.',
                });
            const signed = await sign({
                account: options.account,
                onSponsored: options.onSponsored,
                sender: parameters.from,
                transaction,
                signal: context.options.signal,
                validity,
            });
            if (signed.sponsorshipDetails && context.options.response)
                context.options.response.sponsorship_details = signed.sponsorshipDetails;
            const tx = Utils.formatTempoTransaction(signed.transaction);
            return tx.feePayerSignature;
        },
    };
}
/** Refusal messages keyed by named validation reason. */
const refusalMessages = {
    billing_past_due: 'Billing past due.',
    billing_required: 'Billing required.',
    fee_token_unsupported: 'Fee token unsupported.',
    spend_limit_exceeded: 'Spend limit exceeded.',
    tx_fee_limit_exceeded: 'Transaction fee limit exceeded.',
};
/** Returns sponsor metadata for `eth_fillTransaction` responses. */
// biome-ignore lint/correctness/noUnusedVariables: declaration merge
function getSponsor(options) {
    const { account, name, url } = options;
    return {
        address: account.address,
        ...(name ? { name } : {}),
        ...(url ? { url } : {}),
    };
}
/** Returns whether the fee payer approves a filled transaction. */
// biome-ignore lint/correctness/noUnusedVariables: declaration merge
async function shouldSponsor(options) {
    const { sender, transaction, validate } = options;
    if (!validate)
        return true;
    // Named refusal reasons collapse to false: fills fall back to an
    // unsponsored fill instead of surfacing the reason.
    const verdict = await validate({
        ...transaction,
        from: sender,
    });
    return verdict === true;
}
/** Returns whether a raw Tempo transaction is explicitly requesting sponsorship. */
function requestsRawSponsorship(serialized) {
    if (!Utils.isSerializedTempoTransaction(serialized))
        return false;
    const transaction = Transaction.deserialize(serialized);
    return ('feePayerSignature' in transaction && transaction.feePayerSignature === null);
}
/** Returns `true` when a fill request already has the fields needed for sponsorship signing. */
function isPreparedTransaction(value) {
    return (typeof value.from === 'string' &&
        typeof Utils.resolveChainId(value.chainId) === 'number' &&
        typeof value.gas !== 'undefined' &&
        typeof value.nonce !== 'undefined' &&
        (typeof value.maxFeePerGas !== 'undefined' ||
            typeof value.gasPrice !== 'undefined'));
}
/** Signs a filled transaction as the fee payer. */
export async function sign(options) {
    const { account, transaction, sender, validity = defaultValidity } = options;
    const from = transaction.from ?? sender;
    const { signature: _, ...withoutSenderSig } = transaction;
    const prepared = { ...withoutSenderSig, from };
    if (!prepared.from)
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction sender must be provided before fee payer signing.',
        });
    if (!account.sign)
        throw new Error('Fee payer account cannot sign transactions.');
    const chainId = Utils.resolveChainId(transaction.chainId);
    if (chainId === undefined)
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction chainId must be provided before fee payer signing.',
        });
    const envelope = TxEnvelopeTempo.from(prepared);
    // Checked on the envelope itself: serialization drops non-numeric bounds, which would sign an unbounded payload.
    Validity.assert(envelope, { validity });
    const signPayload = TxEnvelopeTempo.getFeePayerSignPayload(envelope, {
        sender: prepared.from,
    });
    options.signal?.throwIfAborted();
    const feePayerSignature = Signature.from(await account.sign({ hash: signPayload }));
    options.signal?.throwIfAborted();
    // Record the commitment before releasing the signature, since the signed fill can be broadcast through another endpoint.
    const feeToken = transaction.feeToken;
    const sponsorshipDetails = await options.onSponsored?.({
        chainId,
        feePayer: account.address,
        ...(feeToken ? { feeToken } : {}),
        method: 'eth_fillTransaction',
        sender: prepared.from,
        signPayload,
        transaction: TxEnvelopeTempo.serialize(envelope, { feePayerSignature }),
    });
    return {
        ...(sponsorshipDetails ? { sponsorshipDetails } : {}),
        transaction: { ...prepared, feePayerSignature },
    };
}
/** Handles `eth_signRawTransaction` and broadcast methods for sponsored Tempo transactions. */
// biome-ignore lint/correctness/noUnusedVariables: declaration merge
async function handleRawTransaction(options) {
    const { account, getClient, method, request, validate, validity = defaultValidity, } = options;
    const serialized = request.params?.[0];
    if (!Utils.isSerializedTempoTransaction(serialized))
        throw new RpcResponse.InvalidParamsError({
            message: 'Only Tempo (0x76/0x78) transactions are supported.',
        });
    // Refused before validation, recording, or signing, so every decision reads the exact signed bytes.
    if (!isCanonical(serialized))
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction encoding is not canonical. Re-encode it with in-range field values.',
        });
    const transaction = Transaction.deserialize(serialized);
    // Sponsorship only applies after sender has signed original transaction.
    if (!transaction.signature)
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction must be signed by the sender before fee payer signing.',
        });
    if (!account.sign)
        throw new Error('Fee payer account cannot sign transactions.');
    // Raw signing returns the co-signed bytes, and sender-signed bytes cannot gain a bound afterwards.
    if (method === 'eth_signRawTransaction')
        Validity.assert(transaction, { validity });
    const client = getClient(transaction.chainId);
    // Verified before validation or signing so unauthorized envelopes never reach sponsorship policy.
    const sender = await recoverSender(client, serialized);
    const feeToken_chain = client.chain?.feeToken;
    // Senders do not commit to `feeToken` on sponsored envelopes, so the sponsor's preference overrides the envelope's.
    const feeToken = options.resolveFeeToken?.(transaction.chainId) ??
        transaction.feeToken ??
        (await options.getFeeToken?.(transaction.chainId)) ??
        feeToken_chain;
    const transaction_sponsored = {
        ...transaction,
        from: sender,
        ...(feeToken ? { feeToken } : {}),
    };
    if (validate) {
        const verdict = await validate(transaction_sponsored);
        if (verdict !== true)
            throw new RpcResponse.InvalidParamsError(verdict === false
                ? { message: 'Sponsorship rejected.' }
                : { data: { code: verdict }, message: refusalMessages[verdict] });
    }
    const envelope = TxEnvelopeTempo.from(transaction_sponsored);
    const signPayload = TxEnvelopeTempo.getFeePayerSignPayload(envelope, {
        sender,
    });
    const feePayerSignature = Signature.from(await account.sign({ hash: signPayload }));
    const serializedTransaction = TxEnvelopeTempo.serialize(envelope, {
        feePayerSignature,
        signature: transaction.signature,
    });
    const event = {
        chainId: transaction.chainId,
        feePayer: account.address,
        ...(feeToken ? { feeToken } : {}),
        method,
        sender,
        signPayload,
        transaction: serializedTransaction,
        transactionHash: Hash.keccak256(serializedTransaction),
    };
    // Awaited before any broadcast so a recording failure refuses sponsorship;
    // no sponsored transaction ever reaches the chain unrecorded.
    const sponsorshipDetails = await options.onSponsored?.(event);
    // Raw-sign requests stop after fee-payer signature is added; send methods broadcast it.
    const result = method === 'eth_signRawTransaction'
        ? serializedTransaction
        : await client
            .request({
            method: method,
            params: [
                serializedTransaction,
                ...(request.params?.slice(1) ?? []),
            ],
        })
            .catch(async (error) => {
            // Transport failures, timeouts, and node-local floors stay unreported: the envelope may still land.
            if (isBaseFeeRejection(error) &&
                (transaction.maxFeePerGas ?? 0n) < options.minimumBaseFee)
                await options.onRejected?.(event);
            throw error;
        });
    return { result, ...(sponsorshipDetails ? { sponsorshipDetails } : {}) };
}
/** Returns whether a raw envelope re-serializes to its exact bytes; lossy parses (such as `u64` values past `Number.MAX_SAFE_INTEGER`) and non-canonical RLP fail. */
function isCanonical(serialized) {
    try {
        const envelope = TxEnvelopeTempo.deserialize(serialized);
        // Fee-payer handoffs encode a sender address or, for configurable senders, the `0x00` marker.
        const slot = Rlp.toHex(Hex.slice(serialized, 1))[11];
        const serialized_parsed = serialized.startsWith(TxEnvelopeTempo.feePayerMagic)
            ? TxEnvelopeTempo.serialize(envelope, {
                format: 'feePayer',
                ...(typeof slot === 'string' && core_Address.validate(slot)
                    ? { sender: slot }
                    : {}),
            })
            : TxEnvelopeTempo.serialize(envelope);
        return serialized_parsed === serialized.toLowerCase();
    }
    catch {
        // Serialization refuses parsed values outside the safe integer range.
        return false;
    }
}
/** Recovers a raw envelope's sender from its signature, rejecting placeholders and access keys the sender has not authorized. */
async function recoverSender(client, serialized) {
    const envelope = TxEnvelopeTempo.deserialize(serialized);
    const { keyAuthorization, signature } = envelope;
    if (!signature)
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction must be signed by the sender before fee payer signing.',
        });
    const payload = TxEnvelopeTempo.getSignPayload(envelope);
    const sender = await (async () => {
        if (signature.type === 'configurable')
            return verifyConfigurable(client, { payload, signature });
        if (signature.type !== 'keychain')
            return recoverSigner(payload, signature);
        // Tempo rejects legacy access-key signatures, which do not bind the key to its account.
        if (signature.version !== 'v2')
            throw new RpcResponse.InvalidParamsError({
                message: 'Legacy access key signatures are not supported.',
            });
        const { inner, userAddress } = signature;
        const keyId = recoverSigner(TxEnvelopeTempo.getSignPayload(envelope, { from: userAddress }), inner);
        // Only primitive inner signatures recover a key, so the type indexes `keyTypes`.
        if (!keyId)
            return undefined;
        const keyType = keyTypes[inner.type];
        // A same-transaction authorization signed by the account provisions the key; the node
        // requires its chain, key type, and any named account to match exactly.
        const authorization = await (async () => {
            if (!keyAuthorization ||
                !core_Address.isEqual(keyAuthorization.address, keyId) ||
                keyAuthorization.chainId !== BigInt(envelope.chainId) ||
                keyAuthorization.type !== inner.type ||
                (keyAuthorization.account &&
                    !core_Address.isEqual(keyAuthorization.account, userAddress)))
                return undefined;
            const { signature: signature_authorization } = keyAuthorization;
            const payload_authorization = KeyAuthorization.getSignPayload(keyAuthorization);
            const authorizer = signature_authorization.type === 'configurable'
                ? await verifyConfigurable(client, {
                    payload: payload_authorization,
                    signature: signature_authorization,
                })
                : recoverSigner(payload_authorization, signature_authorization);
            if (authorizer && core_Address.isEqual(authorizer, userAddress))
                return keyAuthorization;
            return undefined;
        })();
        // Zones lack the signature-verifier precompile, so read the keychain directly; an unknown
        // key has zero expiry. Caller-scoped Zone endpoints authorize reads by the account.
        const [key, isWitnessBurned] = await Promise.all([
            readContract(client, {
                ...AccessKey.getMetadata.call({
                    account: userAddress,
                    accessKey: keyId,
                }),
                account: userAddress,
            }),
            authorization?.witness
                ? readContract(client, {
                    ...AccessKey.isWitnessBurned.call({
                        account: userAddress,
                        witness: authorization.witness,
                    }),
                    account: userAddress,
                })
                : false,
        ]);
        const now = BigInt(Math.floor(Date.now() / 1000));
        const authorized = (() => {
            if (key.isRevoked)
                return false;
            // Without a usable authorization, the key must already be active on chain.
            if (!authorization)
                return key.signatureType === keyType && now < key.expiry;
            // Provisioning fails for an existing key, an expired grant, or a burned witness, so replays never pass.
            if (key.expiry !== 0n || isWitnessBurned)
                return false;
            return authorization.expiry == null || now < BigInt(authorization.expiry);
        })();
        if (!authorized)
            throw new RpcResponse.InvalidParamsError({
                message: 'Transaction access key is not authorized for its sender.',
            });
        return userAddress;
    })();
    if (!sender)
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction signature is invalid.',
        });
    // An address-valued fee-payer marker is caller-supplied and stands only when the signature agrees.
    if (envelope.from && !core_Address.isEqual(envelope.from, sender))
        throw new RpcResponse.InvalidParamsError({
            message: 'Transaction sender does not match its signature.',
        });
    return sender;
}
/**
 * Returns a configurable signature's account once its config matches the on-chain commitment and
 * its owner approvals of `payload` reach quorum. Raw signing returns before any node checks them.
 */
// biome-ignore lint/correctness/noUnusedVariables: declaration merge
async function verifyConfigurable(client, options) {
    const { payload, signature } = options;
    const { account } = signature;
    const config = AccountConfig.from(signature.config);
    const blockNumber = await getBlockNumber(client, { cacheTime: 0 });
    await Accounts.validateConfig({
        account,
        blockNumber,
        client: client,
        config,
    });
    const { threshold, weight } = await Accounts.selectApprovals({
        account,
        approvals: signature.signatures.map((approval) => SignatureEnvelope.serialize(approval)),
        config,
        hash: AccountConfig.getSignPayload({ account, config, payload }),
    });
    if (weight < threshold)
        throw new RpcResponse.InvalidParamsError({
            message: 'Configurable account approvals do not reach quorum.',
        });
    return account;
}
/** Returns the signer of a primitive signature, or `undefined` when it does not verify against `payload`. */
function recoverSigner(payload, signature) {
    try {
        if (signature.type === 'secp256k1')
            return SignatureEnvelope.extractAddress({ payload, signature });
        if (signature.type !== 'p256' && signature.type !== 'webAuthn')
            return undefined;
        const { publicKey } = signature;
        if (!SignatureEnvelope.verify(signature, { payload, publicKey }))
            return undefined;
        return core_Address.fromPublicKey(publicKey);
    }
    catch {
        return undefined;
    }
}
/** AccountKeychain signature type ids keyed by primitive signature type. */
const keyTypes = { p256: 1, secp256k1: 0, webAuthn: 2 };
/** Default lowest base fee Tempo consensus admits (the T7 floor), in attodollars per gas. */
const defaultMinimumBaseFee = 600000000n;
/** Returns whether a broadcast error carries the node's base-fee floor rejection. */
function isBaseFeeRejection(error) {
    let current = error;
    const seen = new Set();
    while (current && typeof current === 'object' && !seen.has(current)) {
        seen.add(current);
        const { cause, code, message } = current;
        // Reth reports pool admission failures as invalid input (-32000). `transaction underpriced`
        // reflects a node-configurable floor, so another node could still admit the envelope.
        if (code === -32000 && message === 'gas price is less than basefee')
            return true;
        current = cause;
    }
    return false;
}
/** Default longest validity, in seconds, of a returned fee-payer signature. */
const defaultValidity = 3_600;
/** Granularity, in seconds, of a generated `validBefore`, so identical fill retries share one sign payload. */
const validityStep = 300;
/** Bounds on how long a returned fee-payer signature stays valid on chain. */
var Validity;
(function (Validity) {
    /** Returns a `validBefore` rounded down to the generation step, then extended by `validity`. */
    function generate(options) {
        const { validity } = options;
        const step = Math.min(validityStep, validity);
        const time = Math.floor(Date.now() / 1_000);
        return time - (time % step) + validity;
    }
    Validity.generate = generate;
    /** Throws unless `validBefore` is a future time within `validity` seconds that opens after `validAfter`. */
    function assert(window, options) {
        const { validAfter, validBefore } = window;
        const { validity } = options;
        const time = Math.floor(Date.now() / 1_000);
        if (validBefore === undefined ||
            validBefore === null ||
            !Number.isSafeInteger(validBefore) ||
            validBefore <= time ||
            validBefore > time + validity ||
            (validAfter !== undefined &&
                validAfter !== null &&
                validAfter >= validBefore))
            throw new RpcResponse.InvalidParamsError({
                message: `Sponsored transactions require a \`validBefore\` within ${validity} seconds.`,
            });
    }
    Validity.assert = assert;
})(Validity || (Validity = {}));
export var ExternalFeePayerUrl;
(function (ExternalFeePayerUrl) {
    /** Normalizes external fee-payer relay URLs before forwarding fill payloads. */
    function normalize(value, options = {}) {
        let url;
        try {
            url = new URL(value);
        }
        catch {
            throw new RpcResponse.InvalidParamsError({
                message: 'Invalid fee payer URL.',
            });
        }
        const allowUnsafe = options.allowUnsafe === true;
        if (url.protocol !== 'http:' && url.protocol !== 'https:')
            throw new RpcResponse.InvalidParamsError({
                message: 'Invalid fee payer URL protocol.',
            });
        if (!allowUnsafe && url.protocol !== 'https:')
            throw new RpcResponse.InvalidParamsError({
                message: 'Invalid fee payer URL protocol.',
            });
        if (!allowUnsafe && isUnsafeHostname(url.hostname))
            throw new RpcResponse.InvalidParamsError({
                message: 'Invalid fee payer URL host.',
            });
        url.username = '';
        url.password = '';
        url.hash = '';
        return url.href;
    }
    ExternalFeePayerUrl.normalize = normalize;
    function isUnsafeHostname(hostname) {
        const host = normalizeHostname(hostname);
        if (host === 'localhost' || host.endsWith('.localhost'))
            return true;
        const ipv4 = parseIpv4(host);
        if (ipv4)
            return isUnsafeIpv4(ipv4);
        if (!host.includes(':'))
            return false;
        const ipv6 = parseIpv6(host);
        if (!ipv6)
            return true;
        return isUnsafeIpv6(ipv6);
    }
    function normalizeHostname(hostname) {
        return hostname
            .toLowerCase()
            .replace(/^\[|\]$/g, '')
            .split('%')[0];
    }
    function parseIpv4(value) {
        const parts = value.split('.');
        if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part)))
            return undefined;
        const numbers = parts.map((part) => Number(part));
        if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
            return undefined;
        return numbers;
    }
    function isUnsafeIpv4(parts) {
        const [a, b] = parts;
        if (a === 0 || a === 10 || a === 127)
            return true;
        if (a === 100 && b >= 64 && b <= 127)
            return true;
        if (a === 169 && b === 254)
            return true;
        if (a === 172 && b >= 16 && b <= 31)
            return true;
        if (a === 192 && b === 168)
            return true;
        return a >= 224;
    }
    function parseIpv6(value) {
        const halves = value.split('::');
        if (halves.length > 2)
            return undefined;
        const left = halves[0] ? halves[0].split(':') : [];
        const right = halves[1] ? halves[1].split(':') : [];
        const missing = halves.length === 2 ? 8 - left.length - right.length : 0;
        if (missing < 0)
            return undefined;
        const parts = [...left, ...Array(missing).fill('0'), ...right];
        if (parts.length !== 8)
            return undefined;
        const numbers = parts.map((part) => /^[\da-f]{1,4}$/i.test(part) ? Number.parseInt(part, 16) : NaN);
        if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 0xffff))
            return undefined;
        return numbers;
    }
    function isUnsafeIpv6(parts) {
        const [a] = parts;
        if (parts.every((part) => part === 0))
            return true;
        if (parts.slice(0, 7).every((part) => part === 0) && parts[7] === 1)
            return true;
        if ((a & 0xfe00) === 0xfc00)
            return true;
        if ((a & 0xffc0) === 0xfe80)
            return true;
        if ((a & 0xffc0) === 0xfec0)
            return true;
        if ((a & 0xff00) === 0xff00)
            return true;
        const ipv4 = ipv4FromIpv6(parts);
        return ipv4 ? isUnsafeIpv4(ipv4) : false;
    }
    function ipv4FromIpv6(parts) {
        const mapped = parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff;
        const compatible = parts.slice(0, 6).every((part) => part === 0);
        if (!mapped && !compatible)
            return undefined;
        return [parts[6] >> 8, parts[6] & 0xff, parts[7] >> 8, parts[7] & 0xff];
    }
})(ExternalFeePayerUrl || (ExternalFeePayerUrl = {}));
//# sourceMappingURL=feePayer.js.map