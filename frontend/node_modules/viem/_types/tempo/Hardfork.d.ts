export declare const hardforks: readonly ["genesis", "t0", "t1", "t1a", "t1b", "t1c", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12", "t13", "t14"];
export type Hardfork = (typeof hardforks)[number];
/**
 * Returns `true` if `current` is before `target`.
 *
 * Unknown `current` hardforks are treated as newer than every known hardfork.
 */
export declare function lt(current: string, target: Hardfork): boolean;
//# sourceMappingURL=Hardfork.d.ts.map