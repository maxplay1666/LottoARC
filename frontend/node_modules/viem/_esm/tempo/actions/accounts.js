import { AccountConfig, AccountOperation } from 'ox/tempo';
import { readContract } from '../../actions/public/readContract.js';
import { writeContract } from '../../actions/wallet/writeContract.js';
import { writeContractSync } from '../../actions/wallet/writeContractSync.js';
import { parseEventLogs } from '../../utils/abi/parseEventLogs.js';
import * as Abis from '../Abis.js';
import { fromConfig } from '../Account.js';
import * as Addresses from '../Addresses.js';
import { withExecutionError } from '../internal/errors.js';
import { defineCall } from '../internal/utils.js';
/**
 * Derives a configurable account address from an initial config with the
 * configurable account precompile.
 *
 * The precompile validates the config and derives the address with the chain's
 * recovery factory. To derive the address locally, use
 * `AccountConfig.getAddress` or `Account.fromConfig({ address: 'infer' })`.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: tempo,
 *   transport: http(),
 * })
 *
 * const address = await Actions.accounts.deriveAccount(client, {
 *   owners: [{ owner: '0x...', weight: 1 }],
 *   threshold: 1,
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The configurable account address.
 */
export async function deriveAccount(client, parameters) {
    const { owners, salt, threshold, ...rest } = parameters;
    return withExecutionError(readContract)(client, {
        ...rest,
        ...deriveAccount.call({ owners, salt, threshold }),
    });
}
(function (deriveAccount) {
    /**
     * Defines a call to the `deriveAccount` function.
     *
     * Can be passed to [`multicall`](https://viem.sh/docs/contract/multicall).
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args) {
        const { owners, salt, threshold } = AccountConfig.from(args);
        return defineCall({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [salt, threshold, owners],
            functionName: 'deriveAccount',
        });
    }
    deriveAccount.call = call;
})(deriveAccount || (deriveAccount = {}));
/**
 * Gets the current cached config for a configurable account.
 *
 * The coordinator reads the account's current onchain commitment and returns
 * the matching config from its store. It returns `null` when the config is not
 * cached.
 *
 * @example
 * ```ts
 * const config = await client.accounts.getConfig({
 *   address: '0x...',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The config, or `null` when it is unknown.
 */
export async function getConfig(client, parameters) {
    const config = await client.request({
        method: 'account_getConfig',
        params: [{ address: parameters.address }],
    });
    return config ? AccountConfig.fromRpc(config) : null;
}
/**
 * Gets the current configuration commitment for a configurable account.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: tempo,
 *   transport: http(),
 * })
 *
 * const commitment = await Actions.accounts.getConfigCommitment(client, {
 *   account: '0x...',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The current configuration commitment, or zero when no config has
 * been committed.
 */
export async function getConfigCommitment(client, parameters) {
    const { account, ...rest } = parameters;
    return withExecutionError(readContract)(client, {
        ...rest,
        ...getConfigCommitment.call({ account }),
    });
}
(function (getConfigCommitment) {
    /**
     * Defines a call to the `getConfigCommitment` function.
     *
     * Can be passed to [`multicall`](https://viem.sh/docs/contract/multicall).
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args) {
        return defineCall({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [args.account],
            functionName: 'getConfigCommitment',
        });
    }
    getConfigCommitment.call = call;
})(getConfigCommitment || (getConfigCommitment = {}));
/**
 * Gets a coordinated account operation by its hash.
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The operation, or `null` when it is unknown.
 */
export async function getOperation(client, parameters) {
    const operation = await client.request({
        method: 'account_getOperation',
        params: [parameters.hash],
    });
    return operation ? AccountOperation.fromRpc(operation) : null;
}
/**
 * Replaces the current configuration for a configurable account.
 *
 * The transaction must be authorized directly by the account's current owner
 * quorum. Local owner-signing flows can include {@link updateConfig.call} in a
 * prepared transaction before collecting approvals.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { sendTransactionSync } from 'viem/actions'
 * import { tempoLocalnet } from 'viem/chains'
 * import { Account, Actions } from 'viem/tempo'
 *
 * const owner = Account.fromSecp256k1(
 *   '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
 * )
 * const account = Account.fromConfig({
 *   address: 'infer',
 *   owners: [owner],
 * })
 * const client = createClient({
 *   chain: tempoLocalnet,
 *   transport: http(),
 * })
 *
 * await sendTransactionSync(client, {
 *   account,
 *   to: account.address,
 * })
 *
 * const hash = await Actions.accounts.updateConfig(client, {
 *   account,
 *   nextConfig: {
 *     owners: [{ owner: owner.address, weight: 1 }],
 *     threshold: 1,
 *   },
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The transaction hash.
 */
export async function updateConfig(client, parameters) {
    return updateConfig.inner(writeContract, client, parameters);
}
(function (updateConfig) {
    /** @internal */
    async function inner(action, client, parameters) {
        const { account: account_, currentConfig: currentConfig_, nextConfig, ...rest } = parameters;
        const accountValue = account_ ?? client.account;
        const account = (() => {
            if (typeof accountValue === 'object' &&
                accountValue.source === 'configurable')
                return accountValue;
            return undefined;
        })();
        const config = (() => {
            if (currentConfig_)
                return currentConfig_;
            if (account?.config)
                return account.config;
            return undefined;
        })();
        const address = (() => {
            if (account)
                return account.address;
            if (typeof accountValue === 'string')
                return accountValue;
            if (accountValue)
                return accountValue.address;
            return undefined;
        })();
        const currentConfig = await (async () => {
            if (config)
                return AccountConfig.from(config);
            if (!address)
                throw new Error('A configurable account address or current config is required.');
            const cachedConfig = await getConfig(client, { address });
            if (!cachedConfig)
                throw new Error(`No current account config is cached for account ${address}. Provide the current config.`);
            return cachedConfig;
        })();
        const resolvedAccount = (() => {
            if (account)
                return { ...account, config: currentConfig };
            if (typeof accountValue === 'object')
                return accountValue;
            if (address)
                return fromConfig({ address, ...currentConfig });
            return undefined;
        })();
        return (await withExecutionError(action)(client, {
            ...rest,
            ...(resolvedAccount ? { account: resolvedAccount } : {}),
            ...updateConfig.call({ currentConfig, nextConfig }),
        }));
    }
    updateConfig.inner = inner;
    /**
     * Defines a call to the `updateConfig` function.
     *
     * Can be passed as a parameter to:
     * - [`estimateContractGas`](https://viem.sh/docs/contract/estimateContractGas): estimate gas
     * - [`simulateContract`](https://viem.sh/docs/contract/simulateContract): simulate the update
     * - [`sendCalls`](https://viem.sh/docs/actions/wallet/sendCalls): include the update in a call batch
     *
     * @example
     * ```ts
     * import { Actions, type AccountConfig } from 'viem/tempo'
     *
     * declare const currentConfig: AccountConfig.Config
     *
     * const call = Actions.accounts.updateConfig.call({
     *   currentConfig,
     *   nextConfig: {
     *     owners: [{ owner: '0x...', weight: 1 }],
     *     threshold: 1,
     *   },
     * })
     * ```
     *
     * @param args - Current and replacement account configurations.
     * @returns The call.
     */
    function call(args) {
        const currentConfig = AccountConfig.from(args.currentConfig);
        const nextConfig = AccountConfig.update(currentConfig, args.nextConfig);
        return defineCall({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [currentConfig, nextConfig.threshold, nextConfig.owners],
            functionName: 'updateConfig',
        });
    }
    updateConfig.call = call;
    /**
     * Extracts the `ConfigurableAccountConfigUpdated` event from logs.
     *
     * @param logs - Transaction logs.
     * @returns The configuration update event.
     */
    function extractEvent(logs) {
        const [log] = parseEventLogs({
            abi: Abis.configurableAccount,
            logs,
            eventName: 'ConfigurableAccountConfigUpdated',
            strict: true,
        });
        if (!log)
            throw new Error('`ConfigurableAccountConfigUpdated` event not found.');
        return log;
    }
    updateConfig.extractEvent = extractEvent;
})(updateConfig || (updateConfig = {}));
/**
 * Replaces a configurable account configuration and waits for confirmation.
 *
 * @example
 * ```ts
 * import { createWalletClient, custom, type EIP1193Provider } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions, type AccountConfig } from 'viem/tempo'
 *
 * declare const provider: EIP1193Provider
 * declare const currentConfig: AccountConfig.Config
 *
 * const client = createWalletClient({
 *   account: '0x...',
 *   chain: tempo,
 *   transport: custom(provider),
 * })
 *
 * const { receipt } = await Actions.accounts.updateConfigSync(client, {
 *   currentConfig,
 *   nextConfig: {
 *     owners: [{ owner: '0x...', weight: 1 }],
 *     threshold: 1,
 *   },
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The updated configuration event and transaction receipt.
 */
export async function updateConfigSync(client, parameters) {
    const { throwOnReceiptRevert = true, ...rest } = parameters;
    const receipt = await updateConfig.inner(writeContractSync, client, {
        ...rest,
        throwOnReceiptRevert,
    });
    if (receipt.status === 'pending')
        return { receipt };
    const { args } = updateConfig.extractEvent(receipt.logs);
    return {
        account: args.account,
        config: AccountConfig.from({
            owners: args.owners,
            salt: args.salt,
            threshold: args.threshold,
            version: args.version,
        }),
        receipt,
    };
}
/**
 * Upgrades an existing account to a configurable account in place
 * ([TIP-1113](https://tips.sh/1113)).
 *
 * The account keeps its address and installs `owners` and `threshold`. The
 * root key must sign the upgrade, which is sent as the transaction's only
 * call. After the upgrade, the root key can no longer sign for the account.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempoLocalnet } from 'viem/chains'
 * import { Account, Actions } from 'viem/tempo'
 *
 * const root = Account.fromSecp256k1('0x...')
 * const client = createClient({
 *   chain: tempoLocalnet,
 *   transport: http(),
 * })
 *
 * const hash = await Actions.accounts.upgrade(client, {
 *   account: root,
 *   owners: [{ owner: '0x...', weight: 1 }],
 *   threshold: 1,
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The transaction hash.
 */
export async function upgrade(client, parameters) {
    return upgrade.inner(writeContract, client, parameters);
}
(function (upgrade) {
    /** @internal */
    async function inner(action, client, parameters) {
        const { owners, threshold, ...rest } = parameters;
        for (const key of [
            'authorizationList',
            'calls',
            'data',
            'keyAuthorization',
            'to',
        ])
            if (rest[key] !== undefined)
                throw new Error(`\`${key}\` is not supported: the upgrade must be the only call, without authorizations.`);
        const account = rest.account ?? client.account;
        if (typeof account === 'object') {
            if (account.source === 'configurable')
                throw new Error('The account is already a configurable account.');
            if (account.source === 'accessKey')
                throw new Error('The root key must sign the upgrade, not an access key.');
        }
        // Always send a Tempo envelope, so relays recognize and cache the upgrade.
        return (await withExecutionError(action)(client, {
            ...rest,
            ...upgrade.call({ owners, threshold }),
            type: 'tempo',
        }));
    }
    upgrade.inner = inner;
    /**
     * Defines a call to the `upgradeAccount` function.
     *
     * The call must be the only call in a transaction signed by the account's
     * root key.
     *
     * @example
     * ```ts
     * import { Actions } from 'viem/tempo'
     *
     * const call = Actions.accounts.upgrade.call({
     *   owners: [{ owner: '0x...', weight: 1 }],
     *   threshold: 1,
     * })
     * ```
     *
     * @param args - Owners and threshold to install.
     * @returns The call.
     */
    function call(args) {
        const { owners, threshold } = AccountConfig.from(args);
        return defineCall({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [threshold, owners],
            functionName: 'upgradeAccount',
        });
    }
    upgrade.call = call;
    /**
     * Extracts the `AccountUpgraded` event from logs.
     *
     * @param logs - Transaction logs.
     * @returns The account upgrade event.
     */
    function extractEvent(logs) {
        const [log] = parseEventLogs({
            abi: Abis.configurableAccount,
            logs,
            eventName: 'AccountUpgraded',
            strict: true,
        });
        if (!log)
            throw new Error('`AccountUpgraded` event not found.');
        return log;
    }
    upgrade.extractEvent = extractEvent;
})(upgrade || (upgrade = {}));
/**
 * Upgrades an existing account to a configurable account in place
 * ([TIP-1113](https://tips.sh/1113)) and waits for confirmation.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempoLocalnet } from 'viem/chains'
 * import { Account, Actions } from 'viem/tempo'
 *
 * const root = Account.fromSecp256k1('0x...')
 * const client = createClient({
 *   chain: tempoLocalnet,
 *   transport: http(),
 * })
 *
 * const { config } = await Actions.accounts.upgradeSync(client, {
 *   account: root,
 *   owners: [{ owner: '0x...', weight: 1 }],
 *   threshold: 1,
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The installed configuration, its commitment, and the transaction receipt.
 */
export async function upgradeSync(client, parameters) {
    const { throwOnReceiptRevert = true, ...rest } = parameters;
    const receipt = await upgrade.inner(writeContractSync, client, {
        ...rest,
        throwOnReceiptRevert,
    });
    // Pending and (with `throwOnReceiptRevert: false`) reverted receipts carry no upgrade event.
    if (receipt.status !== 'success')
        return { receipt };
    const { args } = upgrade.extractEvent(receipt.logs);
    return {
        account: args.account,
        commitment: args.commitment,
        config: AccountConfig.from({
            owners: args.owners,
            salt: args.salt,
            threshold: args.threshold,
            version: 1n,
        }),
        receipt,
    };
}
/**
 * Verifies a configurable account signature against the account's current
 * configuration with the signature verifier precompile.
 *
 * Returns `false` when the signature is for another account or a config that
 * is not the account's current config. Throws when the signature is malformed
 * or its approvals do not reach quorum.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: tempo,
 *   transport: http(),
 * })
 *
 * const valid = await Actions.accounts.verifyHash(client, {
 *   account: '0x...',
 *   hash: '0x...',
 *   signature: '0x...',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns Whether the signature is valid for the account.
 */
export async function verifyHash(client, parameters) {
    const { account, hash, signature, ...rest } = parameters;
    return withExecutionError(readContract)(client, {
        ...rest,
        ...verifyHash.call({ account, hash, signature }),
    });
}
(function (verifyHash) {
    /**
     * Defines a call to the `verifyConfigurableAccount` function on the
     * signature verifier precompile.
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args) {
        const { account, hash, signature } = args;
        return defineCall({
            address: Addresses.signatureVerifier,
            abi: Abis.signatureVerifier,
            args: [account, hash, signature],
            functionName: 'verifyConfigurableAccount',
        });
    }
    verifyHash.call = call;
})(verifyHash || (verifyHash = {}));
//# sourceMappingURL=accounts.js.map