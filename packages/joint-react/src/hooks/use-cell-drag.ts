import { useLayoutEffect, useMemo } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { dia } from '@joint/core';
import type { g } from '@joint/core';
import { useCellId } from './use-cell-id';
import {
  getCellDragState,
  ensureCellDragListeners,
  EMPTY_CELL_DRAG_STATE,
  EMPTY_CELL_DRAG_PREVIEW_STATE,
} from './use-cell-drag.utils';
import { usePaper } from './use-paper';

interface CellDragStateBase {
  /** True when cell is being dragged. */
  readonly isDragging: boolean;
  /** True when the drop area is within the paper area. */
  readonly canDrop: boolean;
  /** True when cell is a preview. */
  readonly isPreview: boolean;
  /** Bounding rect of dragged cell in coords. */
  readonly dropArea?: g.Rect;
  /** Latest event during drag. */
  readonly event?: dia.Event;
  /** Paper instance for dragging cell */
  readonly paper?: dia.Paper;
  /** Graph model for dragging cell */
  readonly graph?: dia.Graph;
  /** ID of the dragged cell */
  readonly cellId?: dia.Cell.ID;
}

interface CellDragStateDragging extends Required<CellDragStateBase> {
  isDragging: true;
}
interface CellDragStateIdle extends CellDragStateBase {
  isDragging: false;
}
/**
 * Drag state for the current cell. When `isDragging` is `true`, the active
 * fields (`event`, `dropArea`, `canDrop`, `paper`, `graph`) carry the
 * in-progress drag; when `false`, those fields are present but inert.
 * @group Types
 */
export type CellDragState = CellDragStateDragging | CellDragStateIdle;

function select(snap: CellDragState, cellId: dia.Cell.ID): CellDragState {
  if (snap.cellId === cellId) {
    return snap;
  }
  return snap.isPreview ? EMPTY_CELL_DRAG_PREVIEW_STATE : EMPTY_CELL_DRAG_STATE;
}

function equal(a: CellDragState, b: CellDragState): boolean {
  const is =
    a.isDragging === b.isDragging &&
    a.canDrop === b.canDrop &&
    a.isPreview === b.isPreview &&
    a.dropArea === b.dropArea &&
    a.event === b.event &&
    a.paper === b.paper &&
    a.graph === b.graph;
  return is;
}

const NOOP_SNAPSHOT = () => EMPTY_CELL_DRAG_STATE;
const NOOP_CLEANUP = () => {};
const NOOP_SUBSCRIBE = () => NOOP_CLEANUP;

/**
 * Returns reactive drag state for the current cell. Self-contained, lazily
 * attaches paper event listeners on first subscription per paper.
 *
 * Only the dragged element re-renders, all other elements receive a frozen
 * idle reference.
 * Used inside `renderElement`.
 * @group Hooks
 * @returns Drag state scoped to the current cell.
 * @example
 * ```tsx
 * function MyElement({ label }: { label: string }) {
 *   const { isDragging } = useCellDrag();
 *   return (
 *     <div style={{ opacity: isDragging ? 0.5 : 1 }}>
 *       {label}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCellDrag(): CellDragState {
  const cellId = useCellId();
  const { paper } = usePaper();
  const atomState = useMemo(() => {
    if (!paper) return;
    return getCellDragState(paper);
  }, [paper]);

  useLayoutEffect(() => {
    if (!paper) return;
    return ensureCellDragListeners(paper);
  }, [paper]);

  const subscribe = useMemo(() => atomState?.subscribe ?? NOOP_SUBSCRIBE, [atomState]);
  const getSnapshot = useMemo(() => atomState?.getSnapshot ?? NOOP_SNAPSHOT, [atomState]);

  const data = useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    (snap) => select(snap, cellId),
    equal
  );
  return data;
}
