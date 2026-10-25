export const hardforks = [
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
/**
 * Returns `true` if `current` is before `target`.
 *
 * Unknown `current` hardforks are treated as newer than every known hardfork.
 */
export function lt(current, target) {
    const index = hardforks.indexOf(current);
    if (index === -1)
        return false;
    return index < hardforks.indexOf(target);
}
//# sourceMappingURL=Hardfork.js.map