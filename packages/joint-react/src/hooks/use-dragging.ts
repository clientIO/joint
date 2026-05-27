import { useContext, useMemo } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { dia, g } from '@joint/core';
import { useCellId } from './use-cell-id';
import { PaperStoreContext } from '../context';
import {
  getDraggingAtom,
  ensureDragListeners,
  EMPTY_CELLS,
  EMPTY_DRAGGING_SNAPSHOT,
  type DraggingSnapshot,
} from './use-dragging.utils';

/**
 * Per-cell drag state returned by {@link useDragging}.
 * @group Types
 */
export interface DraggingState {
  /** True when THIS cell is being dragged. */
  readonly isDragging: boolean;
  /** True when drag is over a valid drop area. */
  readonly isValidDrop: boolean;
  /** True when drag originates from a stencil (clone preview). */
  readonly isPreview: boolean;
  /** Bounding rect of dragged cell in paper coords. */
  readonly dropArea: g.Rect | null;
  /** Cells (elements and links) currently under the dragged cell. */
  readonly cellsUnderDrag: readonly dia.Cell[];
  /** Latest pointer event during drag. */
  readonly event: dia.Event | null;
}

const IDLE: DraggingState = {
  isDragging: false,
  isValidDrop: false,
  isPreview: false,
  dropArea: null,
  cellsUnderDrag: EMPTY_CELLS,
  event: null,
};

function select(snap: DraggingSnapshot, cellId: dia.Cell.ID): DraggingState {
  if (snap.draggingCellId !== cellId) return IDLE;
  return {
    isDragging: true,
    isValidDrop: snap.isValidDrop,
    isPreview: snap.isPreview,
    dropArea: snap.dropArea,
    cellsUnderDrag: snap.cellsUnderDrag,
    event: snap.event,
  };
}

function equal(a: DraggingState, b: DraggingState): boolean {
  return (
    a.isDragging === b.isDragging &&
    a.isValidDrop === b.isValidDrop &&
    a.isPreview === b.isPreview &&
    a.dropArea === b.dropArea &&
    a.cellsUnderDrag === b.cellsUnderDrag &&
    a.event === b.event
  );
}

const NOOP_UNSUBSCRIBE = () => {};
const NOOP_SUBSCRIBE = (_cb: () => void) => NOOP_UNSUBSCRIBE;
const NOOP_SNAPSHOT = () => EMPTY_DRAGGING_SNAPSHOT;

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
 *   const { isDragging, cellsUnderDrag } = useDragging();
 *   return (
 *     <div style={{ opacity: isDragging ? 0.5 : 1 }}>
 *       {label}
 *       {cellsUnderDrag.length > 0 && <span>Overlap</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDragging(): DraggingState {
  const cellId = useCellId();
  const paperStore = useContext(PaperStoreContext);
  const paper = paperStore?.paper ?? null;

  const subscribe = useMemo(() => {
    if (!paper) return NOOP_SUBSCRIBE;
    ensureDragListeners(paper);
    const atom = getDraggingAtom(paper);
    return atom.subscribe;
  }, [paper]);

  const getSnapshot = useMemo(() => {
    if (!paper) return NOOP_SNAPSHOT;
    return getDraggingAtom(paper).getSnapshot;
  }, [paper]);

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    (snap) => select(snap, cellId),
    equal
  );
}
