"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveAccount = deriveAccount;
exports.getConfig = getConfig;
exports.getConfigCommitment = getConfigCommitment;
exports.getOperation = getOperation;
exports.updateConfig = updateConfig;
exports.updateConfigSync = updateConfigSync;
exports.upgrade = upgrade;
exports.upgradeSync = upgradeSync;
exports.verifyHash = verifyHash;
const tempo_1 = require("ox/tempo");
const readContract_js_1 = require("../../actions/public/readContract.js");
const writeContract_js_1 = require("../../actions/wallet/writeContract.js");
const writeContractSync_js_1 = require("../../actions/wallet/writeContractSync.js");
const parseEventLogs_js_1 = require("../../utils/abi/parseEventLogs.js");
const Abis = require("../Abis.js");
const Account_js_1 = require("../Account.js");
const Addresses = require("../Addresses.js");
const errors_js_1 = require("../internal/errors.js");
const utils_js_1 = require("../internal/utils.js");
async function deriveAccount(client, parameters) {
    const { owners, salt, threshold, ...rest } = parameters;
    return (0, errors_js_1.withExecutionError)(readContract_js_1.readContract)(client, {
        ...rest,
        ...deriveAccount.call({ owners, salt, threshold }),
    });
}
(function (deriveAccount) {
    function call(args) {
        const { owners, salt, threshold } = tempo_1.AccountConfig.from(args);
        return (0, utils_js_1.defineCall)({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [salt, threshold, owners],
            functionName: 'deriveAccount',
        });
    }
    deriveAccount.call = call;
})(deriveAccount || (exports.deriveAccount = deriveAccount = {}));
async function getConfig(client, parameters) {
    const config = await client.request({
        method: 'account_getConfig',
        params: [{ address: parameters.address }],
    });
    return config ? tempo_1.AccountConfig.fromRpc(config) : null;
}
async function getConfigCommitment(client, parameters) {
    const { account, ...rest } = parameters;
    return (0, errors_js_1.withExecutionError)(readContract_js_1.readContract)(client, {
        ...rest,
        ...getConfigCommitment.call({ account }),
    });
}
(function (getConfigCommitment) {
    function call(args) {
        return (0, utils_js_1.defineCall)({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [args.account],
            functionName: 'getConfigCommitment',
        });
    }
    getConfigCommitment.call = call;
})(getConfigCommitment || (exports.getConfigCommitment = getConfigCommitment = {}));
async function getOperation(client, parameters) {
    const operation = await client.request({
        method: 'account_getOperation',
        params: [parameters.hash],
    });
    return operation ? tempo_1.AccountOperation.fromRpc(operation) : null;
}
async function updateConfig(client, parameters) {
    return updateConfig.inner(writeContract_js_1.writeContract, client, parameters);
}
(function (updateConfig) {
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
                return tempo_1.AccountConfig.from(config);
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
                return (0, Account_js_1.fromConfig)({ address, ...currentConfig });
            return undefined;
        })();
        return (await (0, errors_js_1.withExecutionError)(action)(client, {
            ...rest,
            ...(resolvedAccount ? { account: resolvedAccount } : {}),
            ...updateConfig.call({ currentConfig, nextConfig }),
        }));
    }
    updateConfig.inner = inner;
    function call(args) {
        const currentConfig = tempo_1.AccountConfig.from(args.currentConfig);
        const nextConfig = tempo_1.AccountConfig.update(currentConfig, args.nextConfig);
        return (0, utils_js_1.defineCall)({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [currentConfig, nextConfig.threshold, nextConfig.owners],
            functionName: 'updateConfig',
        });
    }
    updateConfig.call = call;
    function extractEvent(logs) {
        const [log] = (0, parseEventLogs_js_1.parseEventLogs)({
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
})(updateConfig || (exports.updateConfig = updateConfig = {}));
async function updateConfigSync(client, parameters) {
    const { throwOnReceiptRevert = true, ...rest } = parameters;
    const receipt = await updateConfig.inner(writeContractSync_js_1.writeContractSync, client, {
        ...rest,
        throwOnReceiptRevert,
    });
    if (receipt.status === 'pending')
        return { receipt };
    const { args } = updateConfig.extractEvent(receipt.logs);
    return {
        account: args.account,
        config: tempo_1.AccountConfig.from({
            owners: args.owners,
            salt: args.salt,
            threshold: args.threshold,
            version: args.version,
        }),
        receipt,
    };
}
async function upgrade(client, parameters) {
    return upgrade.inner(writeContract_js_1.writeContract, client, parameters);
}
(function (upgrade) {
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
        return (await (0, errors_js_1.withExecutionError)(action)(client, {
            ...rest,
            ...upgrade.call({ owners, threshold }),
            type: 'tempo',
        }));
    }
    upgrade.inner = inner;
    function call(args) {
        const { owners, threshold } = tempo_1.AccountConfig.from(args);
        return (0, utils_js_1.defineCall)({
            address: Addresses.configurableAccount,
            abi: Abis.configurableAccount,
            args: [threshold, owners],
            functionName: 'upgradeAccount',
        });
    }
    upgrade.call = call;
    function extractEvent(logs) {
        const [log] = (0, parseEventLogs_js_1.parseEventLogs)({
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
})(upgrade || (exports.upgrade = upgrade = {}));
async function upgradeSync(client, parameters) {
    const { throwOnReceiptRevert = true, ...rest } = parameters;
    const receipt = await upgrade.inner(writeContractSync_js_1.writeContractSync, client, {
        ...rest,
        throwOnReceiptRevert,
    });
    if (receipt.status !== 'success')
        return { receipt };
    const { args } = upgrade.extractEvent(receipt.logs);
    return {
        account: args.account,
        commitment: args.commitment,
        config: tempo_1.AccountConfig.from({
            owners: args.owners,
            salt: args.salt,
            threshold: args.threshold,
            version: 1n,
        }),
        receipt,
    };
}
async function verifyHash(client, parameters) {
    const { account, hash, signature, ...rest } = parameters;
    return (0, errors_js_1.withExecutionError)(readContract_js_1.readContract)(client, {
        ...rest,
        ...verifyHash.call({ account, hash, signature }),
    });
}
(function (verifyHash) {
    function call(args) {
        const { account, hash, signature } = args;
        return (0, utils_js_1.defineCall)({
            address: Addresses.signatureVerifier,
            abi: Abis.signatureVerifier,
            args: [account, hash, signature],
            functionName: 'verifyConfigurableAccount',
        });
    }
    verifyHash.call = call;
})(verifyHash || (exports.verifyHash = verifyHash = {}));
//# sourceMappingURL=accounts.js.map