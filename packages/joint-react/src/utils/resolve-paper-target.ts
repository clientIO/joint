import { dia } from '@joint/core';
import type { PaperTarget } from '../types';
import { isRef, isString } from './is';

/**
 * Narrows an unknown value to a {@link PaperTarget} — a paper id string, a
 * `dia.Paper` instance, or a `RefObject<dia.Paper>`. Used to discriminate
 * overloaded hook arguments (target vs handlers/options).
 * @param value - Candidate value.
 * @returns True when `value` is a paper target.
 */
export function isPaperTarget(value: unknown): value is PaperTarget {
  return isString(value) || value instanceof dia.Paper || isRef(value);
}

/**
 * Resolves a `dia.Paper` instance from a {@link PaperTarget}. String ids cannot
 * be resolved here (no access to the paper store) and return `null`.
 * @param target - The paper target to resolve.
 * @returns The resolved paper, or `null`.
 */
export function resolvePaper(target: PaperTarget): dia.Paper | null {
  if (isString(target)) {
    // ID form is not supported here since we don't have access to the paper store.
    return null;
  }
  if (target instanceof dia.Paper) {
    return target;
  }
  // Remaining union member: RefObject<dia.Paper | null>.
  return target.current;
}

/**
 * Extracts the paper id from a {@link PaperTarget}.
 * @param target - The paper target to extract the id from.
 * @returns The paper id string, or `null`.
 */
export function resolvePaperId(target?: PaperTarget): string | null {
  if (!target) {
    return null;
  }
  if (isString(target)) {
    // A string target is already the id.
    return target;
  }
  return resolvePaper(target)?.id ?? null;
}
