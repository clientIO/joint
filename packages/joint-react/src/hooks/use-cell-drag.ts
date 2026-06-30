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
  /** Reserved drop-validity flag; currently always `true` (not yet computed). */
  readonly canDrop: boolean;
  /** True when cell is a preview. */
  readonly isPreview: boolean;
  /** Bounding box of the dragged cell, in paper coordinates. */
  readonly dropArea?: g.Rect;
  /** Pointer event for this drag frame. */
  readonly event?: dia.Event;
  /** The paper the cell is being dragged on. */
  readonly paper?: dia.Paper;
  /** Convenience alias for `paper.model`. */
  readonly graph?: dia.Graph;
  /** ID of the cell being dragged. */
  readonly cellId?: dia.Cell.ID;
}

interface CellDragStateDragging extends Required<CellDragStateBase> {
  isDragging: true;
}
interface CellDragStateIdle extends CellDragStateBase {
  isDragging: false;
}
/**
 * Drag state for the current cell, returned by {@link useCellDrag}. While a
 * drag is in progress (`isDragging` is `true`), the active fields (`event`,
 * `dropArea`, `paper`, `graph`, `cellId`) carry the live drag; when `false`
 * they are `undefined`. `isPreview` and `canDrop` are always present.
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
 * Tracks the live drag state of the current cell while the user drags it
 * across the paper. Read `isDragging` to dim the element, or `canDrop` /
 * `dropArea` to render a drop indicator. Use it inside a `renderElement`
 * callback.
 *
 * Only the cell being dragged re-renders; every other cell receives a shared,
 * frozen idle reference, so large diagrams stay cheap to render.
 * @group Hooks
 * @returns the {@link CellDragState} scoped to the current cell
 * @example
 * ```tsx
 * import { Paper, useCellDrag } from '@joint/react';
 *
 * function MyElement({ label }: { label: string }) {
 *   const { isDragging } = useCellDrag();
 *   return (
 *     <div style={{ opacity: isDragging ? 0.5 : 1 }}>
 *       {label}
 *     </div>
 *   );
 * }
 *
 * <Paper renderElement={(el) => <MyElement label={String(el.id)} />} />;
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
