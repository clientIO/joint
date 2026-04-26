import type {
  CellId,
  ResolvedCellRecord,
  ResolvedElementRecord,
} from '../types/cell.types';

/**
 * Selector helpers to pass into `useElement` / `useCell`.
 *
 * Each selector reads a single slice of the resolved record. The store
 * preserves slice reference identity across unrelated cell changes (see
 * `mergeCellRecord`), so `Object.is` short-circuits re-renders when only
 * other slices changed.
 */

// ── Element slice selectors ────────────────────────────────────────────────

/** Reads `element.position`. Stable ref while the element doesn't move. */
export const selectElementPosition = (element: ResolvedElementRecord) => element.position;

/** Reads `element.size`. Stable ref while the element isn't resized. */
export const selectElementSize = (element: ResolvedElementRecord) => element.size;

/** Reads `element.angle`. */
export const selectElementAngle = (element: ResolvedElementRecord) => element.angle;

/**
 * Reads `element.data` typed as `ElementData`. Pass the type as an
 * instantiation: `useElement(selectElementData<NodeData>)` — TypeScript
 * propagates `NodeData` through to the hook's `Selected` inference.
 */
export function selectElementData<ElementData = unknown>(
  element: ResolvedElementRecord<ElementData>
): ElementData {
  return element.data;
}

// ── Cell-level selectors (work for both elements and links) ───────────────

/** Reads `cell.id`. Note: `useCellId()` is cheaper when only the id is needed. */
export const selectCellId = (cell: ResolvedCellRecord) => cell.id;

/** Reads `cell.type` (e.g. `'element'`, `'link'`, or a built-in JointJS type). */
export const selectCellType = (cell: ResolvedCellRecord) => cell.type;

/**
 * Reads the `parent` field (cell id of the embedding parent, or undefined
 * for top-level cells). The field lives on the record's index signature,
 * so we narrow it here for callers. Works for both elements and links —
 * any cell can be embedded.
 */
export const selectCellParent = (cell: ResolvedCellRecord): CellId | undefined =>
  cell.parent as CellId | undefined;
