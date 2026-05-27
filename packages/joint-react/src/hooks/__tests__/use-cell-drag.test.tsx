import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { dia, g } from '@joint/core';
import { CellIdContext, PaperStoreContext, GraphStoreContext } from '../../context';
import type { PaperStore } from '../../store';
import { GraphStore } from '../../store/graph-store';
import { useCellDrag, type CellDragState } from '../use-cell-drag';
import {
  getCellDragState,
  ensureDragListeners,
  EMPTY_CELL_DRAG_STATE,
} from '../use-cell-drag.utils';

function createMockGraph(): dia.Graph {
  return new dia.Graph();
}

function createMockPaper(graph?: dia.Graph): dia.Paper {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const model = graph ?? createMockGraph();
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
    getArea: jest.fn().mockReturnValue({
      containsRect: jest.fn().mockReturnValue(true),
    }),
    model,
  } as unknown as dia.Paper;
}

function createWrapper(options: { readonly cellId: string; readonly paper?: dia.Paper }) {
  const graph = options.paper?.model ?? createMockGraph();
  const graphStore = new GraphStore({ graph });
  const paperStore = options.paper ? ({ paper: options.paper } as PaperStore) : null;
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <GraphStoreContext.Provider value={graphStore}>
        <CellIdContext.Provider value={options.cellId}>
          {paperStore ? (
            <PaperStoreContext.Provider value={paperStore}>{children}</PaperStoreContext.Provider>
          ) : (
            children
          )}
        </CellIdContext.Provider>
      </GraphStoreContext.Provider>
    );
  };
}

function makeDragState(
  paper: dia.Paper,
  cellId: dia.Cell.ID,
  overrides: Partial<CellDragState> = {}
): CellDragState {
  return {
    isDragging: true,
    canDrop: true,
    isPreview: false,
    dropArea: new g.Rect(),
    dragEvent: null,
    paper,
    graph: paper.model,
    cellId,
    ...overrides,
  };
}

describe('useCellDrag', () => {
  it('throws without PaperStoreContext', () => {
    expect(() => {
      renderHook(() => useCellDrag(), {
        wrapper: createWrapper({ cellId: 'cell-1' }),
      });
    }).toThrow('usePaperStore must be used within a Paper or RenderElement');
  });

  it('returns idle state with paper but no drag', () => {
    const paper = createMockPaper();
    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('returns isDragging true when atom updated for this cell', async () => {
    const paper = createMockPaper();
    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    const atom = getCellDragState(paper);
    atom.set(
      makeDragState(paper, 'cell-1', {
        dropArea: new g.Rect(10, 10, 50, 50),
      })
    );

    await waitFor(() => {
      expect(result.current.isDragging).toBe(true);
    });
    expect(result.current.canDrop).toBe(true);
    expect(result.current.isPreview).toBe(false);
    expect(result.current.paper).toBe(paper);
  });

  it('returns idle for other cells during drag', async () => {
    const paper = createMockPaper();
    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-2', paper }),
    });

    const atom = getCellDragState(paper);
    atom.set(makeDragState(paper, 'cell-1'));

    await waitFor(() => {
      expect(result.current.isDragging).toBe(false);
    });
  });

  it('clears state on drag end', async () => {
    const paper = createMockPaper();
    const atom = getCellDragState(paper);
    atom.set(makeDragState(paper, 'cell-1'));

    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.isDragging).toBe(true);

    atom.set(EMPTY_CELL_DRAG_STATE);

    await waitFor(() => {
      expect(result.current.isDragging).toBe(false);
    });
  });

  it('reports isPreview for stencil drags', async () => {
    const paper = createMockPaper();
    const atom = getCellDragState(paper);
    atom.set(makeDragState(paper, 'clone-1', { isPreview: true }));

    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'clone-1', paper }),
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.isPreview).toBe(true);
  });

  it('returns reference-stable idle across renders', () => {
    const paper = createMockPaper();
    const { result, rerender } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('reports canDrop true when snapshot canDrop is true', async () => {
    const paper = createMockPaper();
    const atom = getCellDragState(paper);
    atom.set(
      makeDragState(paper, 'cell-1', {
        canDrop: true,
        dropArea: new g.Rect(10, 10, 50, 50),
      })
    );

    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.canDrop).toBe(true);
  });

  it('reports canDrop false when snapshot says canDrop is false', async () => {
    const paper = createMockPaper();
    const atom = getCellDragState(paper);
    atom.set(
      makeDragState(paper, 'cell-1', {
        canDrop: false,
        dropArea: new g.Rect(-100, -100, 50, 50),
      })
    );

    const { result } = renderHook(() => useCellDrag(), {
      wrapper: createWrapper({ cellId: 'cell-1', paper }),
    });

    expect(result.current.canDrop).toBe(false);
  });

  it('does not overwrite stencil preview state on element:pointermove', () => {
    const paper = createMockPaper();
    const atom = getCellDragState(paper);

    atom.set(
      makeDragState(paper, 'clone-1', {
        isPreview: true,
        dropArea: new g.Rect(100, 100, 50, 50),
      })
    );

    ensureDragListeners(paper);
    const mockView = {
      model: { id: 'clone-1', getBBox: () => new g.Rect(-50, -50, 50, 50) },
    } as unknown as dia.ElementView;
    const mockEvent = {} as dia.Event;
    paper.trigger('element:pointermove', mockView, mockEvent);

    const snap = atom.get();
    expect(snap.canDrop).toBe(true);
    expect(snap.isPreview).toBe(true);
  });

  it('does not reset stencil preview state on element:pointerup', () => {
    const paper = createMockPaper();
    const atom = getCellDragState(paper);

    atom.set(makeDragState(paper, 'clone-1', { isPreview: true }));

    ensureDragListeners(paper);
    paper.trigger('element:pointerup');

    const snap = atom.get();
    expect(snap.cellId).toBe('clone-1');
    expect(snap.isPreview).toBe(true);
  });
});
