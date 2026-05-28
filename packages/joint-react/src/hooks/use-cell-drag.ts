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

/**
 * Per-cell drag state returned by {@link useCellDrag}.
 * @group Types
 */
export interface CellDragState {
  /** True when THIS cell is being dragged. */
  readonly isDragging: boolean;
  /** True when the drop area is within the paper area. */
  readonly canDrop: boolean;
  /** True when cell is a clone preview. */
  readonly isPreview: boolean;
  /** Bounding rect of dragged cell in paper coords. */
  readonly dropArea: g.Rect;
  /** Latest pointer event during drag. */
  readonly dragEvent: dia.Event | null;
  /** Paper instance this cell belongs to (`null` when idle or context missing). */
  readonly paper?: dia.Paper;
  /** Graph model of the paper (`null` when idle or context missing). */
  readonly graph: dia.Graph;
  readonly cellId?: dia.Cell.ID;
}

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
    a.dragEvent === b.dragEvent &&
    a.paper === b.paper &&
    a.graph === b.graph;
  return is;
}

const NOOP_SNAPSHOT = () => EMPTY_CELL_DRAG_STATE;

/**
 * Returns reactive drag state for the current cell. Self-contained — lazily
 * attaches paper event listeners on first subscription per paper.
 *
 * Only the dragged element re-renders — all other elements receive a frozen
 * idle reference. O(1) re-renders per drag event.
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
    return getCellDragState(paper);
  }, [paper]);

  useLayoutEffect(() => {
    if (!paper) return;
    return ensureCellDragListeners(paper);
  }, [paper]);

  const getSnapshot = useMemo(() => {
    if (!paper) return NOOP_SNAPSHOT;
    return atomState!.getSnapshot;
  }, [atomState, paper]);

  const data = useSyncExternalStoreWithSelector(
    atomState.subscribe,
    getSnapshot,
    getSnapshot,
    (snap) => select(snap, cellId),
    equal
  );
  return data;
}
