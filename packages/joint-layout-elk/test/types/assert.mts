// Type-level assertions. Nothing here runs - `yarn test-ts` type-checks this folder, and a
// failed assertion is a compile error.
//
// Everything is exported, so that `noUnusedLocals` (on, as in the package itself) does not
// report the assertions themselves.

/** Fails to compile unless `T` is `true` - i.e. unless the `Equals` below held. */
export type Expect<T extends true> = T;

/**
 * Whether `A` and `B` are the same type, rather than merely assignable to one another.
 *
 * Compares them in an invariant position (the conditional's own type parameter), which is
 * what makes it exact: `extends` would let a widened type pass, and pinning the projection
 * exactly is the whole point.
 */
export type Equals<A, B> =
    (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;
