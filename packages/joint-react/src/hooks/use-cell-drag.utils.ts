/**
 * Drag-tracking infrastructure for {@link useCellDrag}().
 *
 * Architecture:
 *   WeakMap<dia.Paper, Atom<CellDragState>>
 *   , one atom per paper, lazily created on first {@link useCellDrag}() call.
 *   , garbage-collected when the paper is disposed (WeakMap).
 *
 *   WeakSet<dia.Paper>
 *   , tracks which papers have drag listeners attached.
 *   , `ensureCellDragListeners(paper)` is idempotent: first call attaches
 *       `element:pointermove` / `element:pointerup` listeners that write
 *       to the atom. Subsequent calls are no-ops.
 *   , Listeners are cleaned up when `paper.remove()` is called.
 *
 *   {@link useCellDrag}() (in use-dragging.ts) reads the atom via
 *   `useSyncExternalStoreWithSelector`. Each element's selector derives
 *   `isDragging = snap.draggingCellId === myCellId`. Only the dragged
 *   element re-renders, non-dragged elements return a frozen IDLE ref.
 *
 */
import { mvc } from '@joint/core';
import type { dia } from '@joint/core';
import { createAtom, type Atom } from '../store/state-container';
import type { CellDragState } from './use-cell-drag';
import { CLEANUP_EVENT_NAME, type PaperView } from '../mvc/paper';

/** Snapshot returned when no drag is active. */
export const EMPTY_CELL_DRAG_STATE: CellDragState = {
  isDragging: false,
  canDrop: true,
  isPreview: false,
};
export const EMPTY_CELL_DRAG_PREVIEW_STATE: CellDragState = {
  ...EMPTY_CELL_DRAG_STATE,
  isPreview: true,
};
const cellDragAtoms = new WeakMap<dia.Paper, Atom<CellDragState>>();
const listenersAttached = new WeakSet<dia.Paper>();

/**
 * Returns the dragging atom for a paper. Creates one lazily on first access.
 * Keyed by `dia.Paper` in a `WeakMap`, garbage-collected with the paper.
 * @param paper - The paper instance.
 */
export function getCellDragState(paper: dia.Paper): Atom<CellDragState> {
  let atom = cellDragAtoms.get(paper);
  if (!atom) {
    atom = createAtom<CellDragState>(EMPTY_CELL_DRAG_STATE);
    cellDragAtoms.set(paper, atom);
  }
  return atom;
}

/**
 * Attaches drag event listeners to a paper. Idempotent, only the first
 * call per paper sets up listeners. Cleanup happens when paper is disposed.
 * @param paper - The paper instance.
 */
export function ensureCellDragListeners(paper: PaperView): void {
  if (listenersAttached.has(paper)) return;
  listenersAttached.add(paper);

  const atom = getCellDragState(paper);
  const listener = new mvc.Listener();

  listener.listenTo(paper, 'element:pointermove', (view: dia.ElementView, event: dia.Event) => {
    const { model } = view;
    const dropArea = model.getBBox();
    atom.set({
      cellId: model.id,
      canDrop: true,
      isPreview: false,
      dropArea,
      event,
      graph: paper.model,
      paper,
      isDragging: true,
    });
  });

  listener.listenTo(paper, 'element:pointerup', () => {
    atom.set(EMPTY_CELL_DRAG_STATE);
  });

  listener.listenTo(paper, CLEANUP_EVENT_NAME, () => {
    listener.stopListening();
    listenersAttached.delete(paper);
    cellDragAtoms.delete(paper);
  });
}
