import { dia } from '@joint/core';
import { isString } from '../utils/is';

// eslint-disable-next-line sonarjs/no-useless-intersection
export type LiteralUnion<T extends string> = T | (string & {});

export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

export type OmitWithoutIndexSignature<T, K extends keyof T> = Omit<RemoveIndexSignature<T>, K>;

export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * A type that makes all properties of T nullable.
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/**
 * Pass `{ optional: true }` to hooks like `usePaper` or `usePaperStore`
 * so they return `null` instead of throwing when context is missing.
 */
export interface Optional {
  readonly optional: true;
}

export type PaperTarget = string | React.RefObject<dia.Paper | null> | dia.Paper | Optional;

/**
 * Resolves a Paper instance from a PaperTarget.
 * @param target - The paper target to resolve.
 * @returns The resolved Paper instance, or null.
 */
export function resolvePaper(target: PaperTarget): dia.Paper | null {
  if (isString(target)) {
    // ID form is not supported here since we don't have access to the paper store.
    return null;
  }
  if (target instanceof dia.Paper) {
    return target;
  }
  if ('current' in target) {
    return target.current;
  }
  return null;
}

/**
 * Extracts the paper ID from a PaperTarget.
 * @param target - The paper target to extract the ID from.
 * @returns The paper ID string, or null.
 */
export function resolvePaperId(target?: PaperTarget): string | null {
  if (!target) {
    return null;
  }
  if (isString(target)) {
    // Is already an ID.
    return target;
  }
  return resolvePaper(target)?.id ?? null;
}

export * from './event.types';
