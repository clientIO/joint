import { DEFAULT_PAPER_ID } from '../mvc/paper';

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

/**
 * Warns when multiple `<Paper>` components register with the same default ID.
 * This typically means two Papers were rendered without explicit `id` props.
 * @param paperId - The paper ID being registered.
 * @param existingPaperIds - Set of already-registered paper IDs.
 */
export function warnDuplicatePapers(paperId: string, existingPaperIds: Iterable<string>): void {
  if (process.env.NODE_ENV === 'production') return;
  if (paperId !== DEFAULT_PAPER_ID) return;

  for (const existingId of existingPaperIds) {
    if (existingId === DEFAULT_PAPER_ID) {
      const key = 'duplicate-default-paper';
      if (WARNED.has(key)) return;
      WARNED.add(key);

      console.warn(
        '[Paper] Multiple <Paper> components rendered without an explicit `id` prop. ' +
          `They share the default ID "${DEFAULT_PAPER_ID}", which causes conflicts.\n\n` +
          'Fix: give each Paper a unique `id` prop:\n' +
          '  <Paper id="primary" ... />\n' +
          '  <Paper id="secondary" ... />\n'
      );
      return;
    }
  }
}
