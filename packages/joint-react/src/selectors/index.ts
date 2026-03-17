import type { ElementsLayoutSnapshot, GraphStoreInternalSnapshot } from '../store/graph-store';

// ── Element layout selectors ────────────────────────────────────────────────

export const selectAreElementsSized = (snapshot: ElementsLayoutSnapshot): boolean => {
  if (snapshot.count === 0) {
    return false;
  }

  let sizedElements = 0;
  for (const { width, height } of Object.values(snapshot.sizes)) {
    if (width > 1 && height > 1) {
      sizedElements += 1;
    }
  }

  return sizedElements === snapshot.count;
};

export const selectAreElementsMeasured = (snapshot: ElementsLayoutSnapshot): boolean =>
  snapshot.count > 0 &&
  (snapshot.observedElements === 0 ||
    snapshot.observedElements === snapshot.measuredObservedElements);

export const selectElementSizes = (snapshot: ElementsLayoutSnapshot) => snapshot.sizes;

// ── Internal selectors ──────────────────────────────────────────────────────

export const selectResetVersion = (snapshot: GraphStoreInternalSnapshot): number =>
  snapshot.resetVersion;

/**
 * Creates a selector for the version of a specific paper.
 * @param id - The paper ID to select the version for.
 */
export function createSelectPaperVersion(id: string) {
  return (snapshot: GraphStoreInternalSnapshot): number | undefined => snapshot.papers[id];
}
