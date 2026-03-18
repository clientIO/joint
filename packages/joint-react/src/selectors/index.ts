import type {
  ElementsLayoutState,
  GraphStoreInternalSnapshot,
  PaperStoreState,
} from '../state/state.types';

// ── Element layout selectors ────────────────────────────────────────────────

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

/**
 * Selects the graph features version from the internal snapshot.
 * Used to trigger re-renders when graph-level features change.
 */
export const selectGraphFeaturesVersion = (snapshot: GraphStoreInternalSnapshot): number =>
  snapshot.graphFeaturesVersion;
