export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

export type OmitWithoutIndexSignature<T, K extends keyof T> = Omit<RemoveIndexSignature<T>, K>;

export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Pass `{ isNullable: true }` to hooks like `usePaper` or `usePaperStore`
 * so they return `null` instead of throwing when context is missing.
 */
export interface Nullable {
  readonly isNullable: true;
}

/**
 * A string type that preserves intellisense for known literal unions.
 * Use instead of `| string` or `[key: string]` to keep autocomplete working.
 */
// eslint-disable-next-line sonarjs/no-useless-intersection
export type AnyString = string & {};

export * from './event.types';
export * from './port.types';
