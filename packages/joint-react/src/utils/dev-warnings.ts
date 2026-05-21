const WARNED = new Set<string>();

/**
 * Warns once per hook instance when a selector returns an unstable reference
 * that could have been avoided. Dev-only — tree-shaken in production.
 * Call after the equality check fails (new value will be emitted). Pass the
 * previous and next values; the helper inspects whether the difference is
 * only due to new object references with identical shallow content.
 * @param hookName - Hook identifier for the warning message (e.g. "useCells").
 * @param previous - Cached selector result.
 * @param next - New selector result that failed the equality check.
 * @param hasCustomIsEqual - True when the caller supplied a custom `isEqual`.
 */
export function warnUnstableSelector(
  hookName: string,
  previous: unknown,
  next: unknown,
  hasCustomIsEqual: boolean
): void {
  if (process.env.NODE_ENV === 'production') return;
  if (hasCustomIsEqual) return;
  if (!Array.isArray(previous) || !Array.isArray(next)) return;
  if (previous.length !== next.length) return;
  if (previous.length === 0) return;

  const [firstNext] = next;
  if (firstNext === null || typeof firstNext !== 'object') return;

  const [firstPrevious] = previous;
  if (firstPrevious === firstNext) return;
  if (firstPrevious === null || typeof firstPrevious !== 'object') return;

  const previousKeys = Object.keys(firstPrevious as Record<string, unknown>);
  const nextKeys = Object.keys(firstNext as Record<string, unknown>);
  if (previousKeys.length !== nextKeys.length) return;

  const previousRecord = firstPrevious as Record<string, unknown>;
  const nextRecord = firstNext as Record<string, unknown>;
  for (const key of previousKeys) {
    if (previousRecord[key] !== nextRecord[key]) return;
  }

  const deduplicationKey = `${hookName}:${previousKeys.toSorted((a, b) => a.localeCompare(b)).join(',')}`;
  if (WARNED.has(deduplicationKey)) return;
  WARNED.add(deduplicationKey);

  console.warn(
    `[${hookName}] Selector returns a new array of objects on every call, ` +
      'causing unnecessary re-renders. Each element is a new object reference ' +
      'with identical values.\n\n' +
      'Options to fix:\n' +
      '  1. Return primitives: (cells) => cells.map(c => c.id)\n' +
      '  2. Return cell records directly: (cells) => cells.filter(predicate)\n' +
      '  3. Provide a custom isEqual: useCells(input, selector, shallowEqual)\n'
  );
}
