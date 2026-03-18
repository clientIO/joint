import type { ElementsLayoutSnapshot, GraphStoreInternalSnapshot } from '../store/graph-store';

// ── Element layout selectors ────────────────────────────────────────────────

export const selectAreElementsMeasured = (snapshot: ElementsLayoutSnapshot): boolean =>
  snapshot.count > 0 && snapshot.measuredElements === snapshot.count;

export const selectElementSizes = (snapshot: ElementsLayoutSnapshot) =>
  snapshot.sizes;

// ── Internal selectors ──────────────────────────────────────────────────────

export const selectResetVersion = (snapshot: GraphStoreInternalSnapshot): number =>
  snapshot.resetVersion;

/**
 * Creates a selector for the version of a specific paper.
 * @param id - The paper ID to select the version for.
 */
export function createSelectPaperVersion(id: string) {
  return (snapshot: GraphStoreInternalSnapshot): number | undefined =>
    snapshot.papers[id];
}
