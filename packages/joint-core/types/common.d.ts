/**
 * Shared utility types used across multiple namespace modules.
 */

export type NativeEvent = Event;

/**
 * Accepts any known literal from `T` while still allowing arbitrary strings.
 * Preserves IDE autocomplete for the known literals.
 */
export type LiteralUnion<T extends string> = T | (string & {});

/**
 * Strips the index signature from a type, keeping only explicitly declared keys.
 */
export type ExcludeIndexSignature<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
};

type _DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object ? _DeepRequired<T[P]> : T[P];
};

type _DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? _DeepPartial<T[P]> : T[P];
};

export type DeepPartial<T> = _DeepPartial<_DeepRequired<T>>;

/**
 * A type that makes all properties of T nullable.
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

// We use `DOMElement` to avoid conflicts with the `dia.Element` type.
export type DOMElement = Element;
