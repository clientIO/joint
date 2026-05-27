import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { dia } from '@joint/core';
import { CellIdContext, PaperStoreContext } from '../../context';
import type { PaperStore } from '../../store';
import { useDragging } from '../use-dragging';
import { getDraggingAtom, EMPTY_DRAGGING_SNAPSHOT, EMPTY_CELLS } from '../use-dragging.utils';

function createMockPaper(): dia.Paper {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  return {
    on(event: string, callback: (...args: unknown[]) => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },
    off(event: string, callback: (...args: unknown[]) => void) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    },
    trigger(event: string, ...args: unknown[]) {
      for (const cb of listeners[event] ?? []) cb(...args);
    },
    model: {
      findCellsUnderElement: jest.fn().mockReturnValue([]),
    },
  } as unknown as dia.Paper;
}

function createWrapper(options: { readonly cellId: string; readonly paper?: dia.Paper }) {
  const paperStore = options.paper ? ({ paper: options.paper } as PaperStore) : null;
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <CellIdContext.Provider value={options.cellId}>
        {paperStore ? (
          <PaperStoreContext.Provider value={paperStore}>{children}</PaperStoreContext.Provider>
        ) : (
          children
        )}
      </CellIdContext.Provider>
    );
  };
}

describe('useDragging', () => {
  it('returns idle state without PaperStoreContext', () => {
    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-1' }),
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.isValidDrop).toBe(false);
    expect(result.current.isPreview).toBe(false);
    expect(result.current.dropArea).toBeNull();
    expect(result.current.cellsUnderDrag).toHaveLength(0);
    expect(result.current.event).toBeNull();
  });

  it('returns idle state with paper but no drag', () => {
    const paper = createMockPaper();
    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('returns isDragging true when atom updated for this cell', async () => {
    const paper = createMockPaper();
    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    const atom = getDraggingAtom(paper);
    atom.set({
      draggingCellId: 'cell-1',
      isValidDrop: true,
      isPreview: false,
      dropArea: null,
      cellsUnderDrag: EMPTY_CELLS,
      event: null,
    });

    await waitFor(() => {
      expect(result.current.isDragging).toBe(true);
    });
    expect(result.current.isValidDrop).toBe(true);
    expect(result.current.isPreview).toBe(false);
  });

  it('returns idle for other cells during drag', async () => {
    const paper = createMockPaper();
    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-2', paper }),
    });

    const atom = getDraggingAtom(paper);
    atom.set({
      draggingCellId: 'cell-1',
      isValidDrop: true,
      isPreview: false,
      dropArea: null,
      cellsUnderDrag: EMPTY_CELLS,
      event: null,
    });

    await waitFor(() => {
      expect(result.current.isDragging).toBe(false);
    });
  });

  it('clears state on drag end', async () => {
    const paper = createMockPaper();
    const atom = getDraggingAtom(paper);
    atom.set({
      draggingCellId: 'cell-1',
      isValidDrop: true,
      isPreview: false,
      dropArea: null,
      cellsUnderDrag: EMPTY_CELLS,
      event: null,
    });

    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.isDragging).toBe(true);

    atom.set(EMPTY_DRAGGING_SNAPSHOT);

    await waitFor(() => {
      expect(result.current.isDragging).toBe(false);
    });
  });

  it('reports isPreview for stencil drags', async () => {
    const paper = createMockPaper();
    const atom = getDraggingAtom(paper);
    atom.set({
      draggingCellId: 'clone-1',
      isValidDrop: true,
      isPreview: true,
      dropArea: null,
      cellsUnderDrag: EMPTY_CELLS,
      event: null,
    });

    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'clone-1', paper }),
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.isPreview).toBe(true);
  });

  it('returns reference-stable idle across renders', () => {
    const paper = createMockPaper();
    const { result, rerender } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('reports cellsUnderDrag', async () => {
    const paper = createMockPaper();
    const mockCell = { id: 'other' } as dia.Cell;
    const atom = getDraggingAtom(paper);
    atom.set({
      draggingCellId: 'cell-1',
      isValidDrop: true,
      isPreview: false,
      dropArea: null,
      cellsUnderDrag: [mockCell],
      event: null,
    });

    const { result } = renderHook(() => useDragging(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.cellsUnderDrag).toHaveLength(1);
    expect(result.current.cellsUnderDrag[0]).toBe(mockCell);
  });
});
