/**
 * Union of known string literals plus arbitrary strings while preserving
 * intellisense for the known members.
 */
export type LiteralUnion<T extends string> = T | (string & Record<never, never>);

/** Strips the index signature from `T`, leaving only explicitly declared keys. */
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

/** Like `Omit`, but first removes any index signature from `T`. */
export type OmitWithoutIndexSignature<T, K extends keyof T> = Omit<RemoveIndexSignature<T>, K>;

/** Removes `readonly` modifiers from every property of `T`. */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * A type that makes all properties of T nullable.
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

export * from './paper.types';
