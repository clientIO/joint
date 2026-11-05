import type { dia, g } from '@joint/core';

/**
 * Projects a `Strict*ElkLayoutOptions` interface onto the string spellings ELK itself
 * documents - the shape every option had before the JointJS spellings were accepted, the
 * shape the reference page linked from each option expresses it in, and the shape options
 * that arrive as data (a saved diagram, a backend's config) already have.
 *
 * Each option is declared once, in the strict interface, so the two spellings cannot drift.
 *
 * The order of the branches is load-bearing:
 *
 * - An array - an option ELK takes a set of enum values for - has a branch of its own, which
 *   ELK takes as one string of the values. It would reach the final `string` without one,
 *   but that branch is the catch-all's alone (see the last point). An array matches none of
 *   the branches between, so where it is tested does not matter.
 * - `dia.Sides` is `number | SidesJSON`, so `number extends dia.Sides` holds. Testing
 *   `dia.Sides` first would route every number-valued option into the `string` branch and
 *   lose its `` `${number}` ``. The reverse is safe: `number | SidesJSON` does not extend
 *   `number`.
 * - The `extends string` branch returns `T[K]` as it is, which is what keeps the enum
 *   unions - and `ElkAlgorithm`'s open `(string & {})` - spelled exactly as authored, with
 *   the same completions and the same error text.
 * - The final `string` is reached only by the catch-all index signature, whose strict type
 *   is the whole union. Without it the index signature falls through to `T[K]` and the
 *   native variant is not native at all.
 *
 * The `?` is what puts `| undefined` back on the mapped index signature, which the optional
 * properties need to stay assignable to it.
 */
export type ToNativeElkOptions<T> = {
    [K in keyof T]?:
        NonNullable<T[K]> extends readonly string[] ? string
            : NonNullable<T[K]> extends boolean ? `${boolean}`
                : NonNullable<T[K]> extends number ? `${number}`
                    : NonNullable<T[K]> extends dia.Sides ? string
                        : NonNullable<T[K]> extends g.PlainPoint ? string
                            : NonNullable<T[K]> extends string ? T[K]
                                : string;
};

/**
 * The options of `T` that take a `dia.Sides` - the ones ELK types as an `ElkPadding` or an
 * `ElkMargin`. `toNativeElkNode()` reads these to know that `10` means every side rather
 * than the number `10`, so deriving them here keeps that list from drifting.
 *
 * `dia.SidesJSON extends NonNullable<T[K]>` is the test: it holds for a `dia.Sides` option
 * and not for a plain `number` one, which `dia.Sides` would otherwise swallow.
 */
export type SidesValuedElkOptionKeys<T> = {
    [K in KnownElkOptionKeys<T>]-?: dia.SidesJSON extends NonNullable<T[K]> ? K : never
}[KnownElkOptionKeys<T>];

/** The options of `T` that take a point - the ones ELK types as a `KVector`. */
export type PointValuedElkOptionKeys<T> = {
    [K in KnownElkOptionKeys<T>]-?: g.PlainPoint extends NonNullable<T[K]> ? K : never
}[KnownElkOptionKeys<T>];

/**
 * The options of `T` that take an array of enum values - the ones ELK types as an `EnumSet`.
 * `toNativeElkNode()` joins these into the one string of space-separated values ELK takes;
 * elkjs throws on an array.
 */
export type SetValuedElkOptionKeys<T> = {
    [K in KnownElkOptionKeys<T>]-?: NonNullable<T[K]> extends readonly string[] ? K : never
}[KnownElkOptionKeys<T>];

// The keys declared on `T`, without the catch-all index signature - which would otherwise
// swallow every key test above and make each of them `string`.
type KnownElkOptionKeys<T> = keyof {
    [K in keyof T as string extends K ? never : K]: T[K]
};
