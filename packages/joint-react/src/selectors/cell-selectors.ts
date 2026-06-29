import type { CellId, CellRecord, ElementRecord, Computed } from '../types/cell.types';

/**
 * Selector helpers to pass into {@link useCell} / {@link useCells}.
 *
 * Each selector reads a single slice of the resolved record. The store
 * preserves slice reference identity across unrelated cell changes (see
 * `mergeCellRecord`), so `Object.is` short-circuits re-renders when only
 * other slices changed.
 */

// ── Element slice selectors ────────────────────────────────────────────────

/**
 * Reads `element.position`. Stable ref while the element doesn't move.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * const { x, y } = useCell(elementId, selectElementPosition);
 * ```
 */
export function selectElementPosition(element: Computed<ElementRecord>) {
  return element.position;
}

/**
 * Reads `element.size`. Stable ref while the element isn't resized.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * const { width, height } = useCell(elementId, selectElementSize);
 * ```
 */
export function selectElementSize(element: Computed<ElementRecord>) {
  return element.size;
}

/**
 * Reads `element.angle`.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * const angle = useCell(elementId, selectElementAngle);
 * ```
 */
export function selectElementAngle(element: Computed<ElementRecord>): number {
  return element.angle ?? 0;
}

/**
 * Reads `element.data` typed as `ElementData`. Pass the type as an
 * instantiation: `useCell(selectElementData<NodeData>)`, TypeScript
 * propagates `NodeData` through to the hook's `Selected` inference.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * type NodeData = { label: string };
 * const data = useCell(elementId, selectElementData<NodeData>);
 * ```
 */
export function selectElementData<ElementData = unknown>(
  element: Computed<ElementRecord<ElementData>>
): ElementData {
  return element.data as ElementData;
}

// ── Cell-level selectors (work for both elements and links) ───────────────

/**
 * Reads `cell.id`. Note: {@link useCellId}() is cheaper when only the id is needed.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * const id = useCell(selectCellId);
 * ```
 */
export const selectCellId = (cell: Computed<CellRecord>) => cell.id;

/**
 * Reads `cell.type` (e.g. `'element'`, `'link'`, or a built-in JointJS type).
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * const type = useCell(selectCellType);
 * ```
 */
export const selectCellType = (cell: Computed<CellRecord>) => cell.type;

/**
 * Reads the `parent` field, cell id of the embedding parent, or `null` for
 * top-level cells. The field lives on the record's index signature, so we
 * narrow it here for callers. Works for both elements and links, any cell
 * can be embedded.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * const parentId = useCell(cellId, selectCellParent);
 * ```
 */
export const selectCellParent = (cell: Computed<CellRecord>): CellId | null =>
  cell.parent ?? null;

/**
 * Reads the `layer` field, name of the JointJS layer the cell renders into,
 * or `null` when the cell uses the paper's default layer.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * const layer = useCell(cellId, selectCellLayer);
 * ```
 */
export const selectCellLayer = (cell: Computed<CellRecord>): string | null =>
  cell.layer ?? null;

/**
 * Reads the `z` field, JointJS z-index (paint order within a layer).
 * Falls back to `0` when the cell has no explicit z-index.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * const z = useCell(cellId, selectCellZIndex);
 * ```
 */
export const selectCellZIndex = (cell: Computed<CellRecord>): number =>
  cell.z ?? 0;
