/**
 * Drag-tracking infrastructure for `useCellDrag()`.
 *
 * Architecture:
 *   WeakMap<dia.Paper, Atom<CellDragState>>
 *     — one atom per paper, lazily created on first `useCellDrag()` call.
 *     — garbage-collected when the paper is disposed (WeakMap).
 *
 *   WeakSet<dia.Paper>
 *     — tracks which papers have drag listeners attached.
 *     — `ensureDragListeners(paper)` is idempotent: first call attaches
 *       `element:pointermove` / `element:pointerup` listeners that write
 *       to the atom. Subsequent calls are no-ops.
 *     — Listeners are cleaned up when `paper.remove()` is called.
 *
 *   `useCellDrag()` (in use-dragging.ts) reads the atom via
 *   `useSyncExternalStoreWithSelector`. Each element's selector derives
 *   `isDragging = snap.draggingCellId === myCellId`. Only the dragged
 *   element re-renders — non-dragged elements return a frozen IDLE ref.
 *
 * Stencil integration (`@joint/react-plus`):
 *   Stencil calls `getDraggingAtom(dragPaper).set(...)` directly from
 *   its own event listeners. Same atom, same hook, no extra wiring.
 */
import { mvc } from '@joint/core';
import type { dia } from '@joint/core';
import { g } from '@joint/core';
import { createAtom, type Atom } from '../store/state-container';
import type { CellDragState } from './use-cell-drag';

/** Snapshot returned when no drag is active. */
export const EMPTY_CELL_DRAG_STATE: CellDragState = {
  isDragging: false,
  canDrop: false,
  isPreview: false,
  dropArea: new g.Rect(),
  dragEvent: null,
  paper: undefined,
  graph: undefined!,
};
export const EMPTY_CELL_DRAG_PREVIEW_STATE: CellDragState = {
  ...EMPTY_CELL_DRAG_STATE,
  isPreview: true,
};
const draggingAtoms = new WeakMap<dia.Paper, Atom<CellDragState>>();
const listenersAttached = new WeakSet<dia.Paper>();

/**
 * Returns the dragging atom for a paper. Creates one lazily on first access.
 * Keyed by `dia.Paper` in a `WeakMap` — garbage-collected with the paper.
 * @param paper - The paper instance.
 */
export function getDraggingAtomState(paper: dia.Paper): Atom<CellDragState> {
  let atom = draggingAtoms.get(paper);
  if (!atom) {
    atom = createAtom<CellDragState>(EMPTY_CELL_DRAG_STATE);
    draggingAtoms.set(paper, atom);
  }
  return atom;
}

/**
 * Attaches drag event listeners to a paper. Idempotent — only the first
 * call per paper sets up listeners. Cleanup happens when paper is disposed.
 * @param paper - The paper instance.
 */
export function ensureDragListeners(paper: dia.Paper): void {
  if (listenersAttached.has(paper)) return;
  listenersAttached.add(paper);

  const atom = getDraggingAtomState(paper);
  const listener = new mvc.Listener();

  listener.listenTo(paper, 'element:pointermove', (view: dia.ElementView, event: dia.Event) => {
    // When isPreview is true the stencil owns this atom — don't overwrite.
    if (atom.get().isPreview) return;
    const { model } = view;
    const dropArea: g.Rect = model.getBBox();
    atom.set({
      cellId: model.id,
      canDrop: paper.getArea().containsRect(dropArea),
      isPreview: false,
      dropArea,
      dragEvent: event,
      graph: paper.model,
      paper,
      isDragging: true,
    });
  });

  listener.listenTo(paper, 'element:pointerup', () => {
    if (atom.get().isPreview) return;
    atom.set(EMPTY_CELL_DRAG_STATE);
  });

  listener.listenTo(paper, 'remove', () => {
    listener.stopListening();
    listenersAttached.delete(paper);
    draggingAtoms.delete(paper);
  });
}
