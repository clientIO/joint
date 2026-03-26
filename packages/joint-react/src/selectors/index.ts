import type { GraphStoreInternalSnapshot } from '../store/graph-store';
import type { ElementLayout } from '../types/cell-data';

// ── Element layout selectors ────────────────────────────────────────────────

// ── Internal selectors ──────────────────────────────────────────────────────

export const selectResetVersion = (state: GraphStoreInternalSnapshot): number => state.resetVersion;

/**
 * Creates a selector for the version of a specific paper.
 * @param id - The paper ID to select the version for.
 */
export function createSelectPaperVersion(id: string) {
  return (snapshot: GraphStoreInternalSnapshot) => snapshot.papers[id]?.version;
}

/**
 * Selects the graph features version from the internal snapshot.
 * Used to trigger re-renders when graph-level features change.
 * @param state
 */
export const selectGraphFeaturesVersion = (state: GraphStoreInternalSnapshot): number =>
  state.graphFeaturesVersion;
