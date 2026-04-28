import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type {
  CellId,
  ResolvedCellRecord,
  ResolvedElementRecord,
} from '../types/cell.types';

/**
 * Selector helpers to pass into `useCell` / `useCells`.
 *
 * Each selector reads a single slice of the resolved record. The store
 * preserves slice reference identity across unrelated cell changes (see
 * `mergeCellRecord`), so `Object.is` short-circuits re-renders when only
 * other slices changed.
 */

/**
 * Runtime guard for element-only selectors. The TS signatures already
 * restrict the input to `ResolvedElementRecord`, but a caller can still
 * widen the cell type generic and slip a non-element record through. In
 * that case the slice would silently be `undefined` — surface that as a
 * loud programmer-error instead.
 */
function assertElementCell(
  cell: ResolvedElementRecord,
  selectorName: string
): asserts cell is ResolvedElementRecord {
  if (cell.type !== ELEMENT_MODEL_TYPE) {
    throw new Error(
      `${selectorName}: expected element cell (type === "${ELEMENT_MODEL_TYPE}"), got type "${String(cell.type)}" (id "${String(cell.id)}").`
    );
  }
}

// ── Element slice selectors ────────────────────────────────────────────────

/** Reads `element.position`. Stable ref while the element doesn't move. */
export function selectElementPosition(element: ResolvedElementRecord) {
  assertElementCell(element, 'selectElementPosition');
  return element.position;
}

/** Reads `element.size`. Stable ref while the element isn't resized. */
export function selectElementSize(element: ResolvedElementRecord) {
  assertElementCell(element, 'selectElementSize');
  return element.size;
}

/** Reads `element.angle`. */
export function selectElementAngle(element: ResolvedElementRecord) {
  assertElementCell(element, 'selectElementAngle');
  return element.angle;
}

/**
 * Reads `element.data` typed as `ElementData`. Pass the type as an
 * instantiation: `useCell(selectElementData<NodeData>)` — TypeScript
 * propagates `NodeData` through to the hook's `Selected` inference.
 */
export function selectElementData<ElementData = unknown>(
  element: ResolvedElementRecord<ElementData>
): ElementData {
  assertElementCell(element, 'selectElementData');
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
