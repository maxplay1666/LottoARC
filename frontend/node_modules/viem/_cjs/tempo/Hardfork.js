"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardforks = void 0;
exports.lt = lt;
exports.hardforks = [
    'genesis',
    't0',
    't1',
    't1a',
    't1b',
    't1c',
    't2',
    't3',
    't4',
    't5',
    't6',
    't7',
    't8',
    't9',
    't10',
    't11',
    't12',
    't13',
    't14',
];
function lt(current, target) {
    const index = exports.hardforks.indexOf(current);
    if (index === -1)
        return false;
    return index < exports.hardforks.indexOf(target);
}
//# sourceMappingURL=Hardfork.js.map