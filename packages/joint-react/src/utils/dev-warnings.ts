import type { dia } from '@joint/core';
import { DEFAULT_PAPER_ID } from '../mvc/paper';
import type { CellId } from '../types/cell.types';

const WARNED = new Set<string>();

/**
 * Emits a dev-only warning once per `key`; later calls with the same key are
 * silent until {@link forgetWarning} clears it. The message is built lazily so
 * a suppressed call does no string work.
 * @param key - Deduplication key.
 * @param buildMessage - Produces the warning text.
 */
function warnOnce(key: string, buildMessage: () => string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (WARNED.has(key)) return;
  WARNED.add(key);
  console.warn(buildMessage());
}

/**
 * Re-arms a {@link warnOnce} key so the next occurrence warns afresh.
 * @param key - The key to clear.
 */
function forgetWarning(key: string): void {
  WARNED.delete(key);
}

/**
 * Warns (dev-only, tree-shaken in production) when a cell setter is called for
 * a target that cannot be resolved, a nullish id, or an id with no matching
 * cell on the graph. The setter then no-ops instead of throwing, so a transient
 * nullish selection (e.g. nothing selected yet) does not crash the app.
 * @param setterName - Setter identifier for the message (e.g. "setCell").
 * @param id - The id that failed to resolve (may be `null` / `undefined`).
 */
export function warnMissingSetterCell(setterName: string, id: CellId | null | undefined): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(
    `[${setterName}] Skipped: no cell to update for id "${String(id)}". ` +
      'Pass an existing cell id (and value), or add the cell first with ' +
      '`setCell({ id, type, ... })`.'
  );
}

/**
 * Warns once per hook instance when a selector returns an unstable reference
 * that could have been avoided. Dev-only, tree-shaken in production.
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

/**
 * Warns once per element when an auto-sized element (rendered without
 * `useModelGeometry`, so its size is measured from the React content) is
 * resized externally, by a tool such as FreeTransform / Halo, or a direct
 * `cell.resize()`. The measurement pipeline overwrites that size, so the
 * resize has no effect. Dev-only, tree-shaken in production.
 * @param cellId - The id of the resized auto-sized element.
 */
export function warnResizeOnAutoSizedElement(cellId: dia.Cell.ID): void {
  if (process.env.NODE_ENV === 'production') return;
  const key = `resize-auto-sized:${cellId}`;
  if (WARNED.has(key)) return;
  WARNED.add(key);

  console.warn(
    `[auto-size] Element "${cellId}" was resized while rendering in auto-size mode ` +
      '(no `useModelGeometry` on its HTMLBox/HTMLHost). The measured content size ' +
      'overrides the resize, so it has no effect. Pass `useModelGeometry` to honor an ' +
      'explicit size (e.g. from FreeTransform / Halo).'
  );
}

/**
 * Warns once per layer when a `layers` array drops a layer that still holds
 * cells. The layer is kept rather than removed: joint-core refuses to remove a
 * non-empty layer, and moving its cells would rewrite user data. Keyed by
 * layer id so a controlled commit stream (every drag frame) warns once, not
 * per frame; {@link forgetLayerNotEmptyWarning} re-arms it once the layer is
 * gone. The cell ids are listed only when the warning actually prints. Dev-only.
 * @param layerId - The layer the array no longer declares.
 * @param getCellIds - Lazily lists the cells still assigned to it.
 */
export function warnLayerNotEmpty(layerId: string, getCellIds: () => readonly dia.Cell.ID[]): void {
  warnOnce(`layer-not-empty:${layerId}`, () => {
    const cellIds = getCellIds();
    return (
      `[GraphProvider] Layer "${layerId}" was dropped from \`layers\` but still holds ` +
      `${cellIds.length} cell(s): ${cellIds.map(String).join(', ')}. ` +
      'It is kept until they are moved or removed.\n\n' +
      'Fix: reassign them first — setCell({ id, layer: \'other\' }) — or remove them.'
    );
  });
}

/**
 * Re-arms {@link warnLayerNotEmpty} for a layer id, called once the layer is
 * actually removed so a later re-declaration warns afresh.
 * @param layerId - The removed layer.
 */
export function forgetLayerNotEmptyWarning(layerId: string): void {
  forgetWarning(`layer-not-empty:${layerId}`);
}
