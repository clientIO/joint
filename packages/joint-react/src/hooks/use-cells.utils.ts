import type { CellsTarget } from './use-cells.types';

/**
 * A stable stand-in for a target in a dependency list: ids passed inline are a
 * new array on every render. Serialised rather than joined, so that `[1]`
 * and `['1']` stay apart. Both arrays and scalar strings are tagged, so a
 * literal id containing serialized ids or either prefix cannot alias an array.
 * @param target - The target of a cells hook.
 * @returns A tagged key for string/array targets, otherwise the target itself.
 * @internal
 */
export function toTargetKey(target: CellsTarget): unknown {
  if (Array.isArray(target)) return `ids:${JSON.stringify(target)}`;
  return typeof target === 'string' ? `id:${target}` : target;
}
