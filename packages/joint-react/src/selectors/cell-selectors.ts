import type { CellId, CellRecord, ElementRecord, Computed } from '../types/cell.types';

/**
 * Ready-made selectors to pass into {@link useCell} / {@link useCells}.
 *
 * Each one picks a single field off the resolved cell record so a component
 * re-renders only when that field changes, not on every unrelated cell update.
 * Reach for them when you want to subscribe to just the position, size, data,
 * or another slice of a cell.
 */

// ── Element slice selectors ────────────────────────────────────────────────

/**
 * Selects an element's top-left position `{ x, y }`. A subscribed component
 * re-renders only when the element moves.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * import { useCell, selectElementPosition } from '@joint/react';
 *
 * const { x, y } = useCell(elementId, selectElementPosition);
 * ```
 */
export function selectElementPosition(element: Computed<ElementRecord>) {
  return element.position;
}

/**
 * Selects an element's bounding-box size `{ width, height }`. A subscribed
 * component re-renders only when the element is resized.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * import { useCell, selectElementSize } from '@joint/react';
 *
 * const { width, height } = useCell(elementId, selectElementSize);
 * ```
 */
export function selectElementSize(element: Computed<ElementRecord>) {
  return element.size;
}

/**
 * Selects an element's rotation in degrees, falling back to `0` when the
 * element has no explicit angle.
 * @group Selectors
 * @param element - the resolved element record
 * @example
 * ```tsx
 * import { useCell, selectElementAngle } from '@joint/react';
 *
 * const angle = useCell(elementId, selectElementAngle);
 * ```
 */
export function selectElementAngle(element: Computed<ElementRecord>): number {
  return element.angle ?? 0;
}

/**
 * Selects an element's custom `data` payload, typed as `ElementData`. Supply
 * the type when you call it (`selectElementData<NodeData>`) and TypeScript
 * carries `NodeData` through to the value {@link useCell} returns.
 * @group Selectors
 * @template ElementData - shape of the custom `data` payload carried on the element
 * @param element - the resolved element record
 * @example
 * ```tsx
 * import { useCell, selectElementData } from '@joint/react';
 *
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
 * Selects a cell's id. Prefer {@link useCellId} when the id is all you need —
 * it skips the selector machinery.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * import { useCell, selectCellId } from '@joint/react';
 *
 * const id = useCell(cellId, selectCellId);
 * ```
 */
export const selectCellId = (cell: Computed<CellRecord>) => cell.id;

/**
 * Selects a cell's `type` discriminator — `'element'` for React elements or
 * `'link'` for React links. Handy for branching on the kind of cell.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * import { useCell, selectCellType } from '@joint/react';
 *
 * const type = useCell(cellId, selectCellType);
 * ```
 */
export const selectCellType = (cell: Computed<CellRecord>) => cell.type;

/**
 * Selects the id of the cell this one is embedded in, or `null` for a
 * top-level cell. Works for elements and links alike, since any cell can be
 * embedded.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * import { useCell, selectCellParent } from '@joint/react';
 *
 * const parentId = useCell(cellId, selectCellParent);
 * ```
 */
export const selectCellParent = (cell: Computed<CellRecord>): CellId | null =>
  cell.parent ?? null;

/**
 * Selects the name of the paper layer the cell renders into, or `null` when it
 * sits on the paper's default layer.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * import { useCell, selectCellLayer } from '@joint/react';
 *
 * const layer = useCell(cellId, selectCellLayer);
 * ```
 */
export const selectCellLayer = (cell: Computed<CellRecord>): string | null =>
  cell.layer ?? null;

/**
 * Selects a cell's z-index — its paint order within a layer, where higher
 * values draw on top. Falls back to `0` when the cell has no explicit z-index.
 * @group Selectors
 * @param cell - the resolved cell record
 * @example
 * ```tsx
 * import { useCell, selectCellZIndex } from '@joint/react';
 *
 * const z = useCell(cellId, selectCellZIndex);
 * ```
 */
export const selectCellZIndex = (cell: Computed<CellRecord>): number =>
  cell.z ?? 0;
