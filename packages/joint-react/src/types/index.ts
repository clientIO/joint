/** Strips the index signature from `T`, leaving only explicitly declared keys. */
type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

/** Like `Omit`, but first removes any index signature from `T`. */
export type OmitWithoutIndexSignature<T, K extends keyof T> = Omit<RemoveIndexSignature<T>, K>;

/** Removes `readonly` modifiers from every property of `T`. */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export * from './paper.types';
