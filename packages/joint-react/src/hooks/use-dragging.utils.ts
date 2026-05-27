/**
 * Drag-tracking infrastructure for `useDragging()`.
 *
 * Architecture:
 *   WeakMap<dia.Paper, Atom<DraggingSnapshot>>
 *     — one atom per paper, lazily created on first `useDragging()` call.
 *     — garbage-collected when the paper is disposed (WeakMap).
 *
 *   WeakSet<dia.Paper>
 *     — tracks which papers have drag listeners attached.
 *     — `ensureDragListeners(paper)` is idempotent: first call attaches
 *       `element:pointermove` / `element:pointerup` listeners that write
 *       to the atom. Subsequent calls are no-ops.
 *     — Listeners are cleaned up when `paper.remove()` is called.
 *
 *   `useDragging()` (in use-dragging.ts) reads the atom via
 *   `useSyncExternalStoreWithSelector`. Each element's selector derives
 *   `isDragging = snap.draggingCellId === myCellId`. Only the dragged
 *   element re-renders — non-dragged elements return a frozen IDLE ref.
 *
 * Stencil integration (`@joint/react-plus`):
 *   Stencil calls `getDraggingAtom(dragPaper).set(...)` directly from
 *   its own event listeners. Same atom, same hook, no extra wiring.
 */
import type { dia, g } from '@joint/core';
import { createAtom, type Atom } from '../store/state-container';
import { areArraysShallowEqual } from '../utils/selector-utils';

/**
 * Snapshot of the current drag, stored in an atom per paper.
 * @group Types
 */
export interface DraggingSnapshot {
  readonly draggingCellId: dia.Cell.ID | null;
  readonly isValidDrop: boolean;
  readonly isPreview: boolean;
  readonly dropArea: g.Rect | null;
  /** Cells (elements and links) currently under the dragged cell. */
  readonly cellsUnderDrag: readonly dia.Cell[];
  readonly event: dia.Event | null;
}

/** Shared empty array — avoids allocating a new `[]` on every idle read. */
export const EMPTY_CELLS: readonly dia.Cell[] = [];

/** Snapshot returned when no drag is active. */
export const EMPTY_DRAGGING_SNAPSHOT: DraggingSnapshot = {
  draggingCellId: null,
  isValidDrop: false,
  isPreview: false,
  dropArea: null,
  cellsUnderDrag: EMPTY_CELLS,
  event: null,
};

const draggingAtoms = new WeakMap<dia.Paper, Atom<DraggingSnapshot>>();
const listenersAttached = new WeakSet<dia.Paper>();

/**
 * Returns the dragging atom for a paper. Creates one lazily on first access.
 * Keyed by `dia.Paper` in a `WeakMap` — garbage-collected with the paper.
 * @param paper - The paper instance.
 */
export function getDraggingAtom(paper: dia.Paper): Atom<DraggingSnapshot> {
  let atom = draggingAtoms.get(paper);
  if (!atom) {
    atom = createAtom<DraggingSnapshot>(EMPTY_DRAGGING_SNAPSHOT);
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

  const atom = getDraggingAtom(paper);
  const { model: graph } = paper;
  let previousCells: readonly dia.Cell[] = EMPTY_CELLS;

  paper.on('element:pointermove', (view: dia.ElementView, event: dia.Event) => {
    const { model } = view;
    const dropArea: g.Rect = model.getBBox();
    const found = graph.findCellsUnderElement(model);

    let cellsUnderDrag: readonly dia.Cell[];
    if (found.length === 0) {
      cellsUnderDrag = EMPTY_CELLS;
    } else if (areArraysShallowEqual(found, previousCells)) {
      cellsUnderDrag = previousCells;
    } else {
      cellsUnderDrag = found;
    }
    previousCells = cellsUnderDrag;

    atom.set({
      draggingCellId: model.id,
      isValidDrop: true,
      isPreview: false,
      dropArea,
      cellsUnderDrag,
      event,
    });
  });

  paper.on('element:pointerup', () => {
    previousCells = EMPTY_CELLS;
    atom.set(EMPTY_DRAGGING_SNAPSHOT);
  });
}
