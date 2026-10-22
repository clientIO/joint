import type { CellsTarget } from './use-cells.types';

/**
 * A stable stand-in for a target in a dependency list: ids passed inline are a
 * new array on every render. Serialised rather than joined, so that `[1]`,
 * `['1']` and the single id `'1'` stay apart.
 * @param target - The target of a cells hook.
 * @returns The serialised ids of an ids target, otherwise the target itself.
 * @internal
 */
export function toTargetKey(target: CellsTarget): unknown {
  return Array.isArray(target) ? JSON.stringify(target) : target;
}
