import { dia } from '@joint/core';
import { isString } from '../utils/is';

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

export type PaperReference = string | React.RefObject<dia.Paper | null> | dia.Paper | Nullable;

/**
 * Resolves a Paper instance from a PaperReference.
 * @param ref - The paper reference to resolve.
 * @returns The resolved Paper instance, or null.
 */
export function getPaperFromReference(ref: PaperReference): dia.Paper | null {
  if (isString(ref)) {
    // ID form is not supported here since we don't have access to the paper store.
    return null;
  }
  if (ref instanceof dia.Paper) {
    return ref;
  }
  if ('current' in ref) {
    return ref.current;
  }
  return null;
}

/**
 * Extracts the paper ID from a PaperReference.
 * @param ref - The paper reference to extract the ID from.
 * @returns The paper ID string, or null.
 */
export function getPaperIdFromReference(ref?: PaperReference): string | null {
  if (!ref) {
    return null;
  }
  if (isString(ref)) {
    return ref;
  }
  const paper = getPaperFromReference(ref);
  return paper ? (paper.id ?? null) : null;
}

export * from './event.types';
export * from './port.types';
