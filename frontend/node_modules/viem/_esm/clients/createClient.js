import { parseAccount, } from '../accounts/utils/parseAccount.js';
import { uid } from '../utils/uid.js';
export function createClient(parameters) {
    const { batch, chain, ccipRead, dataSuffix, key = 'base', name = 'Base Client', tokens, type = 'base', } = parameters;
    const experimental_blockTag = parameters.experimental_blockTag ??
        (typeof chain?.experimental_preconfirmationTime === 'number'
            ? 'pending'
            : undefined);
    const blockTime = chain?.blockTime ?? 12_000;
    const defaultPollingInterval = Math.min(Math.max(Math.floor(blockTime / 2), 500), 4_000);
    const pollingInterval = parameters.pollingInterval ?? defaultPollingInterval;
    const cacheTime = parameters.cacheTime ?? Math.min(pollingInterval, Math.floor(blockTime / 2));
    const account = parameters.account
        ? parseAccount(parameters.account)
        : undefined;
    const { config, request, value } = parameters.transport({
        account,
        chain,
        pollingInterval,
    });
    const transport = { ...config, ...value };
    const client = {
        account,
        batch,
        cacheTime,
        ccipRead,
        chain,
        dataSuffix,
        key,
        name,
        pollingInterval,
        request,
        tokens,
        transport,
        type,
        uid: uid(),
        ...(experimental_blockTag ? { experimental_blockTag } : {}),
    };
    return decorate(client);
}
/** Built-in `scope` functions, which an extension named `scope` takes precedence over. */
const scopes_builtin = new WeakSet();
let scopeId = 0;
/**
 * Attaches `extend` and `scope` to a base Client. Base keys other than
 * `scope` are reserved, so extensions cannot override them.
 */
function decorate(client) {
    function extend(base, extensions) {
        return (extendFn) => {
            const extended = extendFn(base);
            for (const key in client)
                if (key !== 'scope')
                    delete extended[key];
            const combined = { ...base, ...extended };
            // For keys that exist on both the base client and the extension and
            // resolve to plain objects (e.g. namespaces like `token`), shallow-merge
            // their members instead of overwriting. This lets decorators contribute
            // to the same namespace (e.g. `publicActions` adds read actions and
            // `walletActions` adds write actions to `client.token`).
            for (const key in extended) {
                const a = base[key];
                const b = extended[key];
                if (isPlainObject(a) && isPlainObject(b))
                    combined[key] = { ...a, ...b };
            }
            const next = [...extensions, extendFn];
            const { scope: scope_combined } = combined;
            return Object.assign(combined, {
                extend: extend(combined, next),
                scope: typeof scope_combined === 'function' &&
                    scopes_builtin.has(scope_combined)
                    ? scope(next)
                    : scope_combined,
            });
        };
    }
    function scope(extensions) {
        // Memoized by signal, so callers sharing one signal share one scope.
        const scopes = new WeakMap();
        const fn = (options = {}) => {
            const cached = options.signal && scopes.get(options.signal);
            if (cached)
                return cached;
            const id = `scope.${scopeId++}`;
            // A scope-owned signal keys transport queues, such as HTTP batches, to the scope.
            const controller = new AbortController();
            const { signal } = options;
            if (signal?.aborted)
                controller.abort(signal.reason);
            else
                signal?.addEventListener('abort', () => controller.abort(signal.reason), {
                    once: true,
                });
            const request = (args, options_request) => client.request(args, {
                ...options_request,
                signal: options_request?.signal ?? controller.signal,
                // The request `uid` keys in-flight request deduplication.
                uid: options_request?.uid ?? id,
            });
            const scoped = extensions.reduce((base, extendFn) => base.extend(extendFn), decorate({ ...client, request, uid: id }));
            if (signal)
                scopes.set(signal, scoped);
            return scoped;
        };
        scopes_builtin.add(fn);
        return fn;
    }
    return Object.assign(client, {
        extend: extend(client, []),
        scope: scope([]),
    });
}
/** Whether `value` is a plain object (`{}`), as opposed to a function, array,
 * or class instance. Used to decide which extension namespaces to merge. */
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
/**
 * Binds an action function to a `client`, returning a parameter-only version
 * along with any helpers the action exposes. Helpers that need a client
 * (`.call`, `.calls`, `.callWithPeriod`, `.estimateGas`, `.prepare`,
 * `.prepareRecipient`, `.predict`, `.simulate`) are bound to `client`;
 * pure helpers (`.extractEvent`, `.extractEvents`) are copied as-is. Used
 * by decorators that attach namespaced actions to a Client.
 * @internal
 */
export function bindActionDecorators(client, action) {
    const wrapped = (parameters = {}) => action(client, parameters);
    for (const key of [
        'call',
        'calls',
        'callWithPeriod',
        'estimateGas',
        'prepare',
        'prepareRecipient',
        'predict',
        'simulate',
    ])
        if (Object.hasOwn(action, key)) {
            const helper = action[key];
            wrapped[key] = (args = {}) => {
                // Single-parameter helpers are client-less (e.g. `dex.buy.call(args)`).
                // Everything else is called with `(client, args)`: two-parameter
                // helpers, rest-parameter helpers that accept `(client, args)` or
                // `(args)` (`length === 0`, e.g. `token.transfer.call`), and
                // zero-argument helpers, which ignore the extra arguments.
                if (helper.length === 1)
                    return helper(args);
                return helper(client, args);
            };
        }
    for (const key of ['extractEvent', 'extractEvents'])
        if (Object.hasOwn(action, key))
            wrapped[key] = action[key];
    return wrapped;
}
/**
 * Defines a typed JSON-RPC schema for the client.
 * Note: This is a runtime noop function.
 */
export function rpcSchema() {
    return null;
}
//# sourceMappingURL=createClient.js.map