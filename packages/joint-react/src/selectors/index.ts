import type { CellId } from '../types/cell-id';
import type { ElementsLayoutSnapshot, GraphStoreInternalSnapshot } from '../store/graph-store';

const EMPTY_VIEW_ID_RECORD: Record<CellId, true> = {};

// ── Element layout selectors ────────────────────────────────────────────────

export const selectAreElementsMeasured = (snapshot: ElementsLayoutSnapshot): boolean =>
  snapshot.count > 0 && snapshot.measuredElements === snapshot.count;

export const selectElementSizes = (snapshot: ElementsLayoutSnapshot) =>
  snapshot.sizes;

// ── Internal selectors ──────────────────────────────────────────────────────

export const selectResetVersion = (snapshot: GraphStoreInternalSnapshot): number =>
  snapshot.resetVersion;

/**
 * Creates a selector for element view IDs of a specific paper.
 * @param id - The paper ID to select element view IDs for.
 */
export function createSelectPaperElementViewIds(id: string) {
  return (snapshot: GraphStoreInternalSnapshot): Record<CellId, true> =>
    snapshot.papers[id]?.elementViewIds ?? EMPTY_VIEW_ID_RECORD;
}

/**
 * Creates a selector for link view IDs of a specific paper.
 * @param id - The paper ID to select link view IDs for.
 */
export function createSelectPaperLinkViewIds(id: string) {
  return (snapshot: GraphStoreInternalSnapshot): Record<CellId, true> =>
    snapshot.papers[id]?.linkViewIds ?? EMPTY_VIEW_ID_RECORD;
}

/**
 * Creates a selector for the version of a specific paper.
 * @param id - The paper ID to select the version for.
 */
export function createSelectPaperVersion(id: string) {
  return (snapshot: GraphStoreInternalSnapshot): number | undefined =>
    snapshot.papers[id]?.version;
}
