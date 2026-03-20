import type {
  ElementsLayoutState,
  GraphStoreInternalSnapshot,
  PaperStoreState,
} from '../state/state.types';

// ── Element layout selectors ────────────────────────────────────────────────

export const selectAreElementsMeasured = (state: ElementsLayoutState): boolean => {
  if (state.autoSizedElementIds.size > 0) {
    return state.observedElements > 0 && state.observedElements === state.measuredObservedElements;
  }
  return state.count > 0;
};

export const selectElementSizes = (state: ElementsLayoutState) => state.sizes;

// ── Internal selectors ──────────────────────────────────────────────────────

export const selectResetVersion = (state: GraphStoreInternalSnapshot): number => state.resetVersion;

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
export const selectGraphFeaturesVersion = (state: GraphStoreInternalSnapshot): number =>
  state.graphFeaturesVersion;
