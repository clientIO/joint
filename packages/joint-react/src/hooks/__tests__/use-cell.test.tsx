import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { CellIdContext } from '../../context';
import { useCell } from '../use-cell';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord } from '../../types/cell.types';

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
    data: { label: 'A' },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 50, y: 0 },
    size: { width: 10, height: 10 },
    data: { label: 'B' },
  } as CellRecord,
  {
    id: 'l',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
  } as CellRecord,
];

function ReadCell({
  onRead,
}: {
  readonly onRead: (cell: CellRecord | undefined) => void;
}) {
  const cell = useCell();
  onRead(cell);
  return null;
}

const NOOP_READ: (cell: CellRecord | undefined) => void = () => {};

interface CaptureState {
  cell: CellRecord | undefined;
}
const captureState: CaptureState = { cell: undefined };
function captureCell(cell: CellRecord | undefined) {
  captureState.cell = cell;
}
function resetCapturedCell() {
  captureState.cell = undefined;
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function plainWrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

describe('useCell', () => {
  it('throws when used outside CellIdContext', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={initialCells}>
          <ReadCell onRead={NOOP_READ} />
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });

  it('returns the cell record when wrapped in CellIdContext', () => {
    resetCapturedCell();
    render(
      <GraphProvider initialCells={initialCells}>
        <CellIdContext.Provider value="a">
          <ReadCell onRead={captureCell} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    expect(captureState.cell?.id).toBe('a');
    expect(captureState.cell?.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('throws when the id is missing from the store', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={initialCells}>
          <CellIdContext.Provider value="does-not-exist">
            <ReadCell onRead={NOOP_READ} />
          </CellIdContext.Provider>
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });
});

describe('useCell (id argument form)', () => {
  it('returns the cell record for an explicit id without needing context', async () => {
    const { result } = renderHook(() => useCell('a'), { wrapper: plainWrapper });
    await act(async () => flush());
    expect(result.current?.id).toBe('a');
  });

  it('selector form returns the selected slice', async () => {
    const { result } = renderHook(() => useCell('a', (cell) => cell.id), {
      wrapper: plainWrapper,
    });
    await act(async () => flush());
    expect(result.current).toBe('a');
  });

  it('throws when the explicit id does not resolve to a cell', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCell('missing'), { wrapper: plainWrapper })).toThrow();
    spy.mockRestore();
  });

  it('subscribes only to the requested id — unrelated cells do not re-render', async () => {
    const renderSpy = jest.fn();
    let storeRef!: ReturnType<typeof useGraphStore>;
    function Probe() {
      storeRef = useGraphStore();
      return null;
    }
    function Consumer() {
      const cell = useCell('a');
      renderSpy(cell?.id);
      return null;
    }
    renderHook(() => null, {
      wrapper: ({ children }) => (
        <GraphProvider initialCells={initialCells}>
          <Probe />
          <Consumer />
          {children}
        </GraphProvider>
      ),
    });
    await act(async () => flush());
    const before = renderSpy.mock.calls.length;
    await act(async () => {
      storeRef.graph.getCell('b')?.set('position', { x: 99, y: 99 });
      await flush();
    });
    expect(renderSpy.mock.calls.length).toBe(before);
  });

  it('selector form does not infinite-loop when returning a fresh reference', async () => {
    const { result } = renderHook(
      () =>
        useCell('a', (cell) => ({
          id: cell.id,
        })),
      { wrapper: plainWrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual({ id: 'a' });
  });
});

describe('useCell (context form with selector)', () => {
  it('selector receives the current cell from CellIdContext', () => {
    let captured: unknown;
    function Probe() {
      captured = useCell((cell) => cell.id);
      return null;
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <CellIdContext.Provider value="a">
          <Probe />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    expect(captured).toBe('a');
  });
});
