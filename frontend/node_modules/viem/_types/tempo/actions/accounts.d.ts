import type { Address } from 'abitype';
import type * as Hex from 'ox/Hex';
import { AccountConfig, AccountOperation } from 'ox/tempo';
import type { Account } from '../../accounts/types.js';
import type { ReadContractReturnType } from '../../actions/public/readContract.js';
import type { WriteContractReturnType } from '../../actions/wallet/writeContract.js';
import { writeContract } from '../../actions/wallet/writeContract.js';
import { writeContractSync } from '../../actions/wallet/writeContractSync.js';
import type { Client } from '../../clients/createClient.js';
import type { Transport } from '../../clients/transports/createTransport.js';
import type { BaseErrorType } from '../../errors/base.js';
import type { Chain } from '../../types/chain.js';
import type { Log } from '../../types/log.js';
import type { Compute, OneOf, UnionOmit } from '../../types/utils.js';
import * as Abis from '../Abis.js';
import type * as Errors from '../errors.js';
import type { ReadParameters, WriteParameters } from '../internal/types.js';
import type * as Transaction from '../Transaction.js';
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
export declare function deriveAccount<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: deriveAccount.Parameters): Promise<deriveAccount.ReturnValue>;
export declare namespace deriveAccount {
    type Parameters = ReadParameters & Args;
    type Args = {
        /** Weighted owners. Normalized into canonical address order. */
        owners: AccountConfig.Config['owners'];
        /** Caller-chosen 32-byte salt. Defaults to the zero salt. */
        salt?: Hex.Hex | undefined;
        /** Minimum total owner weight required for authorization. */
        threshold: number;
    };
    type ReturnValue = ReadContractReturnType<typeof Abis.configurableAccount, 'deriveAccount', never>;
    /**
     * Defines a call to the `deriveAccount` function.
     *
     * Can be passed to [`multicall`](https://viem.sh/docs/contract/multicall).
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args: Args): {
        abi: [{
            readonly name: "deriveAccount";
            readonly type: "function";
            readonly stateMutability: "pure";
            readonly inputs: readonly [{
                readonly type: "bytes32";
                readonly name: "salt";
            }, {
                readonly type: "uint8";
                readonly name: "threshold";
            }, {
                readonly type: "tuple[]";
                readonly name: "owners";
                readonly components: readonly [{
                    readonly type: "address";
                    readonly name: "owner";
                }, {
                    readonly type: "uint8";
                    readonly name: "weight";
                }];
            }];
            readonly outputs: readonly [{
                readonly type: "address";
                readonly name: "account";
            }];
        }];
        functionName: "deriveAccount";
    } & {
        args: readonly [salt: `0x${string}`, threshold: number, owners: readonly {
            owner: `0x${string}`;
            weight: number;
        }[]];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
    type ErrorType = Errors.ExecutionErrorType | BaseErrorType;
}
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
export declare function getConfig(client: Client, parameters: getConfig.Parameters): Promise<getConfig.ReturnValue>;
export declare namespace getConfig {
    /** Parameters for {@link getConfig}. */
    type Parameters = {
        /** Configurable account address. */
        address: Address;
    };
    /** Return value for {@link getConfig}. */
    type ReturnValue = AccountConfig.Config | null;
    /** Error type for {@link getConfig}. */
    type ErrorType = BaseErrorType;
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
export declare function getConfigCommitment<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: getConfigCommitment.Parameters): Promise<getConfigCommitment.ReturnValue>;
export declare namespace getConfigCommitment {
    type Parameters = ReadParameters & Args;
    type Args = {
        /** Initialized configurable account address. */
        account: Address;
    };
    type ReturnValue = ReadContractReturnType<typeof Abis.configurableAccount, 'getConfigCommitment', never>;
    /**
     * Defines a call to the `getConfigCommitment` function.
     *
     * Can be passed to [`multicall`](https://viem.sh/docs/contract/multicall).
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args: Args): {
        abi: [{
            readonly name: "getConfigCommitment";
            readonly type: "function";
            readonly stateMutability: "view";
            readonly inputs: readonly [{
                readonly type: "address";
                readonly name: "account";
            }];
            readonly outputs: readonly [{
                readonly type: "bytes32";
                readonly name: "commitment";
            }];
        }];
        functionName: "getConfigCommitment";
    } & {
        args: readonly [account: `0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
    type ErrorType = Errors.ExecutionErrorType | BaseErrorType;
}
/**
 * Gets a coordinated account operation by its hash.
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The operation, or `null` when it is unknown.
 */
export declare function getOperation(client: Client, parameters: getOperation.Parameters): Promise<getOperation.ReturnValue>;
export declare namespace getOperation {
    /** Parameters for {@link getOperation}. */
    type Parameters = {
        /** Account operation hash. */
        hash: Hex.Hex;
    };
    /** Return value for {@link getOperation}. */
    type ReturnValue = AccountOperation.Operation | null;
    /** Error type for {@link getOperation}. */
    type ErrorType = BaseErrorType;
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
export declare function updateConfig<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: updateConfig.Parameters<chain, account>): Promise<updateConfig.ReturnValue>;
export declare namespace updateConfig {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = WriteParameters<chain, account> & {
        /** Complete current config. Inferred from the account or coordinator when omitted. */
        currentConfig?: AccountConfig.Config | undefined;
        /** Replacement owners and threshold. */
        nextConfig: Pick<AccountConfig.Config, 'owners' | 'threshold'>;
    };
    type Args = {
        /** Complete current config. */
        currentConfig: AccountConfig.Config;
        /** Replacement owners and threshold. */
        nextConfig: Pick<AccountConfig.Config, 'owners' | 'threshold'>;
    };
    type ReturnValue = WriteContractReturnType;
    type ErrorType = Errors.ExecutionErrorType | BaseErrorType;
    /** @internal */
    function inner<action extends typeof writeContract | typeof writeContractSync, chain extends Chain | undefined, account extends Account | undefined>(action: action, client: Client<Transport, chain, account>, parameters: Parameters<chain, account>): Promise<ReturnType<action>>;
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
    function call(args: Args): {
        abi: [{
            readonly name: "updateConfig";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "tuple";
                readonly name: "current";
                readonly components: readonly [{
                    readonly type: "bytes32";
                    readonly name: "salt";
                }, {
                    readonly type: "uint64";
                    readonly name: "version";
                }, {
                    readonly type: "uint8";
                    readonly name: "threshold";
                }, {
                    readonly type: "tuple[]";
                    readonly name: "owners";
                    readonly components: readonly [{
                        readonly type: "address";
                        readonly name: "owner";
                    }, {
                        readonly type: "uint8";
                        readonly name: "weight";
                    }];
                }];
            }, {
                readonly type: "uint8";
                readonly name: "threshold";
            }, {
                readonly type: "tuple[]";
                readonly name: "owners";
                readonly components: readonly [{
                    readonly type: "address";
                    readonly name: "owner";
                }, {
                    readonly type: "uint8";
                    readonly name: "weight";
                }];
            }];
            readonly outputs: readonly [];
        }];
        functionName: "updateConfig";
    } & {
        args: readonly [{
            salt: `0x${string}`;
            version: bigint;
            threshold: number;
            owners: readonly {
                owner: `0x${string}`;
                weight: number;
            }[];
        }, threshold: number, owners: readonly {
            owner: `0x${string}`;
            weight: number;
        }[]];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
    /**
     * Extracts the `ConfigurableAccountConfigUpdated` event from logs.
     *
     * @param logs - Transaction logs.
     * @returns The configuration update event.
     */
    function extractEvent(logs: Log[]): Log<bigint, number, false, undefined, true, readonly [{
        readonly name: "deriveAccount";
        readonly type: "function";
        readonly stateMutability: "pure";
        readonly inputs: readonly [{
            readonly type: "bytes32";
            readonly name: "salt";
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
        readonly outputs: readonly [{
            readonly type: "address";
            readonly name: "account";
        }];
    }, {
        readonly name: "getConfigCommitment";
        readonly type: "function";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "account";
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32";
            readonly name: "commitment";
        }];
    }, {
        readonly name: "updateConfig";
        readonly type: "function";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly type: "tuple";
            readonly name: "current";
            readonly components: readonly [{
                readonly type: "bytes32";
                readonly name: "salt";
            }, {
                readonly type: "uint64";
                readonly name: "version";
            }, {
                readonly type: "uint8";
                readonly name: "threshold";
            }, {
                readonly type: "tuple[]";
                readonly name: "owners";
                readonly components: readonly [{
                    readonly type: "address";
                    readonly name: "owner";
                }, {
                    readonly type: "uint8";
                    readonly name: "weight";
                }];
            }];
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
        readonly outputs: readonly [];
    }, {
        readonly name: "upgradeAccount";
        readonly type: "function";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32";
            readonly name: "commitment";
        }];
    }, {
        readonly name: "ConfigurableAccountConfigUpdated";
        readonly type: "event";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "account";
            readonly indexed: true;
        }, {
            readonly type: "bytes32";
            readonly name: "salt";
        }, {
            readonly type: "uint64";
            readonly name: "version";
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
    }, {
        readonly name: "AccountUpgraded";
        readonly type: "event";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "account";
            readonly indexed: true;
        }, {
            readonly type: "bytes32";
            readonly name: "commitment";
            readonly indexed: true;
        }, {
            readonly type: "bytes32";
            readonly name: "salt";
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
    }, {
        readonly name: "InvalidAccount";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidConfig";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidThreshold";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidConfigurableAccountOwner";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidWeight";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "TooManyOwners";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "DuplicateOwner";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidOwnerOrder";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "UnauthorizedConfigurableAccountCaller";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "PrimitiveRootRequired";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "UpgradeMustBeOnlyCall";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "AccountAlreadyConfigurable";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "AccountHasCode";
        readonly type: "error";
        readonly inputs: readonly [];
    }], "ConfigurableAccountConfigUpdated">;
}
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
export declare function updateConfigSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: updateConfigSync.Parameters<chain, account>): Promise<updateConfigSync.ReturnValue>;
export declare namespace updateConfigSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = updateConfig.Parameters<chain, account>;
    type Args = updateConfig.Args;
    type ReturnValue = Compute<{
        account: Address;
        config: AccountConfig.Config;
        receipt: Transaction.TransactionReceipt;
    }>;
    type ErrorType = updateConfig.ErrorType;
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
export declare function upgrade<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: upgrade.Parameters<chain, account>): Promise<upgrade.ReturnValue>;
export declare namespace upgrade {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = UnionOmit<WriteParameters<chain, account>, 'keyAuthorization' | 'owner'> & Args;
    type Args = Pick<AccountConfig.Config, 'owners' | 'threshold'>;
    type ReturnValue = WriteContractReturnType;
    type ErrorType = Errors.ExecutionErrorType | BaseErrorType;
    /** @internal */
    function inner<action extends typeof writeContract | typeof writeContractSync, chain extends Chain | undefined, account extends Account | undefined>(action: action, client: Client<Transport, chain, account>, parameters: Parameters<chain, account>): Promise<ReturnType<action>>;
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
    function call(args: Args): {
        abi: [{
            readonly name: "upgradeAccount";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "uint8";
                readonly name: "threshold";
            }, {
                readonly type: "tuple[]";
                readonly name: "owners";
                readonly components: readonly [{
                    readonly type: "address";
                    readonly name: "owner";
                }, {
                    readonly type: "uint8";
                    readonly name: "weight";
                }];
            }];
            readonly outputs: readonly [{
                readonly type: "bytes32";
                readonly name: "commitment";
            }];
        }];
        functionName: "upgradeAccount";
    } & {
        args: readonly [threshold: number, owners: readonly {
            owner: `0x${string}`;
            weight: number;
        }[]];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
    /**
     * Extracts the `AccountUpgraded` event from logs.
     *
     * @param logs - Transaction logs.
     * @returns The account upgrade event.
     */
    function extractEvent(logs: Log[]): Log<bigint, number, false, undefined, true, readonly [{
        readonly name: "deriveAccount";
        readonly type: "function";
        readonly stateMutability: "pure";
        readonly inputs: readonly [{
            readonly type: "bytes32";
            readonly name: "salt";
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
        readonly outputs: readonly [{
            readonly type: "address";
            readonly name: "account";
        }];
    }, {
        readonly name: "getConfigCommitment";
        readonly type: "function";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "account";
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32";
            readonly name: "commitment";
        }];
    }, {
        readonly name: "updateConfig";
        readonly type: "function";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly type: "tuple";
            readonly name: "current";
            readonly components: readonly [{
                readonly type: "bytes32";
                readonly name: "salt";
            }, {
                readonly type: "uint64";
                readonly name: "version";
            }, {
                readonly type: "uint8";
                readonly name: "threshold";
            }, {
                readonly type: "tuple[]";
                readonly name: "owners";
                readonly components: readonly [{
                    readonly type: "address";
                    readonly name: "owner";
                }, {
                    readonly type: "uint8";
                    readonly name: "weight";
                }];
            }];
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
        readonly outputs: readonly [];
    }, {
        readonly name: "upgradeAccount";
        readonly type: "function";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
        readonly outputs: readonly [{
            readonly type: "bytes32";
            readonly name: "commitment";
        }];
    }, {
        readonly name: "ConfigurableAccountConfigUpdated";
        readonly type: "event";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "account";
            readonly indexed: true;
        }, {
            readonly type: "bytes32";
            readonly name: "salt";
        }, {
            readonly type: "uint64";
            readonly name: "version";
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
    }, {
        readonly name: "AccountUpgraded";
        readonly type: "event";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "account";
            readonly indexed: true;
        }, {
            readonly type: "bytes32";
            readonly name: "commitment";
            readonly indexed: true;
        }, {
            readonly type: "bytes32";
            readonly name: "salt";
        }, {
            readonly type: "uint8";
            readonly name: "threshold";
        }, {
            readonly type: "tuple[]";
            readonly name: "owners";
            readonly components: readonly [{
                readonly type: "address";
                readonly name: "owner";
            }, {
                readonly type: "uint8";
                readonly name: "weight";
            }];
        }];
    }, {
        readonly name: "InvalidAccount";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidConfig";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidThreshold";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidConfigurableAccountOwner";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidWeight";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "TooManyOwners";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "DuplicateOwner";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "InvalidOwnerOrder";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "UnauthorizedConfigurableAccountCaller";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "PrimitiveRootRequired";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "UpgradeMustBeOnlyCall";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "AccountAlreadyConfigurable";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "AccountHasCode";
        readonly type: "error";
        readonly inputs: readonly [];
    }], "AccountUpgraded">;
}
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
export declare function upgradeSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: upgradeSync.Parameters<chain, account>): Promise<upgradeSync.ReturnValue>;
export declare namespace upgradeSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = upgrade.Parameters<chain, account>;
    type Args = upgrade.Args;
    /** Pending and reverted receipts carry no installed configuration. */
    type ReturnValue = OneOf<{
        account: Address;
        commitment: Hex.Hex;
        config: AccountConfig.Config;
        receipt: Transaction.TransactionReceipt;
    } | {
        receipt: Transaction.TransactionReceipt;
    }>;
    type ErrorType = upgrade.ErrorType;
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
export declare function verifyHash<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: verifyHash.Parameters): Promise<verifyHash.ReturnValue>;
export declare namespace verifyHash {
    type Parameters = ReadParameters & Args;
    type Args = {
        /** Configurable account address the signature is expected to belong to. */
        account: Address;
        /** Original message hash that was signed. */
        hash: Hex.Hex;
        /** Configurable account signature envelope. */
        signature: Hex.Hex;
    };
    type ReturnValue = ReadContractReturnType<typeof Abis.signatureVerifier, 'verifyConfigurableAccount', never>;
    /**
     * Defines a call to the `verifyConfigurableAccount` function on the
     * signature verifier precompile.
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args: Args): {
        abi: [{
            readonly name: "verifyConfigurableAccount";
            readonly type: "function";
            readonly stateMutability: "view";
            readonly inputs: readonly [{
                readonly type: "address";
                readonly name: "account";
            }, {
                readonly type: "bytes32";
                readonly name: "hash";
            }, {
                readonly type: "bytes";
                readonly name: "signature";
            }];
            readonly outputs: readonly [{
                readonly type: "bool";
            }];
        }];
        functionName: "verifyConfigurableAccount";
    } & {
        args: readonly [account: `0x${string}`, hash: `0x${string}`, signature: `0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
    type ErrorType = Errors.ExecutionErrorType | BaseErrorType;
}
//# sourceMappingURL=accounts.d.ts.map