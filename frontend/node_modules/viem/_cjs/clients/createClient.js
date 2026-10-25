"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.bindActionDecorators = bindActionDecorators;
exports.rpcSchema = rpcSchema;
const parseAccount_js_1 = require("../accounts/utils/parseAccount.js");
const uid_js_1 = require("../utils/uid.js");
function createClient(parameters) {
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
        ? (0, parseAccount_js_1.parseAccount)(parameters.account)
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
        uid: (0, uid_js_1.uid)(),
        ...(experimental_blockTag ? { experimental_blockTag } : {}),
    };
    return decorate(client);
}
const scopes_builtin = new WeakSet();
let scopeId = 0;
function decorate(client) {
    function extend(base, extensions) {
        return (extendFn) => {
            const extended = extendFn(base);
            for (const key in client)
                if (key !== 'scope')
                    delete extended[key];
            const combined = { ...base, ...extended };
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
        const scopes = new WeakMap();
        const fn = (options = {}) => {
            const cached = options.signal && scopes.get(options.signal);
            if (cached)
                return cached;
            const id = `scope.${scopeId++}`;
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
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function bindActionDecorators(client, action) {
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
function rpcSchema() {
    return null;
}
//# sourceMappingURL=createClient.js.map