import type { ElementsLayoutState, GraphStoreInternalSnapshot, PaperStoreState } from '../state/state.types';

// ── Element layout selectors ────────────────────────────────────────────────

export const selectAreElementsSized = (snapshot: ElementsLayoutState): boolean => {
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

export const selectAreElementsMeasured = (snapshot: ElementsLayoutState): boolean =>
  snapshot.count > 0 &&
  (snapshot.observedElements === 0 ||
    snapshot.observedElements === snapshot.measuredObservedElements);

export const selectElementSizes = (snapshot: ElementsLayoutState) => snapshot.sizes;

// ── Internal selectors ──────────────────────────────────────────────────────

export const selectResetVersion = (snapshot: GraphStoreInternalSnapshot): number =>
  snapshot.resetVersion;

/**
 * Creates a selector for the version of a specific paper.
 * @param id - The paper ID to select the version for.
 */
export function createSelectPaperVersion(id: string) {
  return (snapshot: GraphStoreInternalSnapshot): PaperStoreState | undefined => snapshot.papers[id];
}
