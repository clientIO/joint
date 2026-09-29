import React, { useContext, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { GraphStoreContext } from '../../../context';
import type { GraphStore } from '../../../store';
import type { CellRecord } from '../../../types/cell.types';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../../mvc/link-model';

type Cells = ReadonlyArray<CellRecord<Record<string, unknown>, Record<string, unknown>>>;

const INITIAL_CELLS: Cells = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 60, y: 60 },
    data: { label: 'A' },
  } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 240, y: 60 },
    data: { label: 'B' },
  } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
  {
    id: 'a-b',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
  } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
];

describe('controlled GraphProvider: reset preserves measured size', () => {
  let storeRef!: GraphStore;
  function Probe() {
    const store = useContext(GraphStoreContext);
    if (store) storeRef = store as GraphStore;
    return null;
  }

  it('does not collapse element size to 0x0 when reset cells omit size', async () => {
    let externalSetCells!: (next: Cells) => void;

    function App() {
      const [cells, setCells] = useState<Cells>(INITIAL_CELLS);
      externalSetCells = setCells;
      return (
        <GraphProvider
          cells={cells}
          onCellsChange={setCells as React.Dispatch<React.SetStateAction<Cells>>}
        >
          <Probe />
        </GraphProvider>
      );
    }

    render(<App />);
    await waitFor(() => expect(storeRef).toBeDefined());
    await waitFor(() => expect(storeRef.graphProjection.cells.getSnapshot().length).toBe(3));

    const elementA = storeRef.graph.getCell('a');
    expect(elementA?.isElement()).toBe(true);
    act(() => {
      (elementA as { set: (key: string, value: unknown) => void }).set('size', {
        width: 100,
        height: 40,
      });
    });

    expect((elementA as { size: () => { width: number; height: number } }).size()).toEqual({
      width: 100,
      height: 40,
    });

    act(() => {
      externalSetCells([
        ...INITIAL_CELLS,
        {
          id: 'task-1',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 140, y: 200 },
          data: { label: 'Task 1' },
        } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
      ]);
    });
    await waitFor(() => expect(storeRef.graphProjection.cells.getSnapshot().length).toBe(4));

    act(() => {
      externalSetCells(INITIAL_CELLS);
    });
    await waitFor(() => expect(storeRef.graphProjection.cells.getSnapshot().length).toBe(3));
    expect(storeRef.graph.getCell('task-1')).toBeUndefined();

    const sizeAfterReset = (
      elementA as { size: () => { width: number; height: number } }
    ).size();
    expect(sizeAfterReset).toEqual({ width: 100, height: 40 });
  });

  it('removes every cell that disappears from the controlled snapshot in a single update', async () => {
    let externalSetCells!: (next: Cells) => void;

    function App() {
      const [cells, setCells] = useState<Cells>([
        ...INITIAL_CELLS,
        {
          id: 'task-1',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 140, y: 200 },
          data: { label: 'Task 1' },
        } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
        {
          id: 'task-2',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 220, y: 200 },
          data: { label: 'Task 2' },
        } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
      ]);
      externalSetCells = setCells;
      return (
        <GraphProvider
          cells={cells}
          onCellsChange={setCells as React.Dispatch<React.SetStateAction<Cells>>}
        >
          <Probe />
        </GraphProvider>
      );
    }

    render(<App />);
    await waitFor(() => expect(storeRef).toBeDefined());
    await waitFor(() => expect(storeRef.graphProjection.cells.getSnapshot().length).toBe(5));

    act(() => {
      externalSetCells(INITIAL_CELLS);
    });
    await waitFor(() => expect(storeRef.graph.getCell('task-1')).toBeUndefined());
    await waitFor(() => expect(storeRef.graph.getCell('task-2')).toBeUndefined());
    expect(storeRef.graphProjection.cells.getSnapshot().length).toBe(3);
    expect(storeRef.graphProjection.cells.has('task-1')).toBe(false);
    expect(storeRef.graphProjection.cells.has('task-2')).toBe(false);
  });
});
