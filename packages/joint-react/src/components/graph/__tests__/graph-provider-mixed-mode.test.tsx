import React, { useContext, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { GraphStoreContext } from '../../../context';
import type { GraphStore } from '../../../store';
import type { CellRecord } from '../../../types/cell.types';

type Cells = ReadonlyArray<CellRecord<Record<string, unknown>, Record<string, unknown>>>;
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import { LINK_MODEL_TYPE } from '../../../models/link-model';

const INITIAL_CONTROLLED_CELLS: Cells = [
  {
    id: 'e1',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
];

const INITIAL_UNCONTROLLED_CELLS: Cells = [
  {
    id: 'e1',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
  {
    id: 'e2',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 50, y: 50 },
    size: { width: 10, height: 10 },
  } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
];

function replaceCells(setCells: React.Dispatch<React.SetStateAction<Cells>>, next: Cells) {
  setCells(next);
}

describe('GraphProvider controlled / uncontrolled', () => {
  let storeRef!: GraphStore;
  function Probe() {
    const store = useContext(GraphStoreContext);
    if (store) storeRef = store as GraphStore;
    return null;
  }

  it('controlled: pushing a new cells array replaces the graph state', async () => {
    let externalSetCells!: (next: Cells) => void;
    function App() {
      const [cells, setCells] = useState<Cells>(INITIAL_CONTROLLED_CELLS);
      externalSetCells = (next) => replaceCells(setCells, next);
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
    await waitFor(() => expect(storeRef.graphView.cells.getSize()).toBe(1));

    act(() => {
      externalSetCells([
        {
          id: 'e1',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
        {
          id: 'e2',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 50, y: 50 },
          size: { width: 10, height: 10 },
        } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
        {
          id: 'l1',
          type: LINK_MODEL_TYPE,
          source: { id: 'e1' },
          target: { id: 'e2' },
        } as CellRecord<Record<string, unknown>, Record<string, unknown>>,
      ]);
    });

    await waitFor(() => expect(storeRef.graphView.cells.getSize()).toBe(3));
    expect(storeRef.graphView.cells.has('l1')).toBe(true);
  });

  it('uncontrolled: initialCells seed the graph but subsequent state does not re-sync from React', async () => {
    render(
      <GraphProvider initialCells={INITIAL_UNCONTROLLED_CELLS}>
        <Probe />
      </GraphProvider>
    );

    await waitFor(() => expect(storeRef).toBeDefined());
    await waitFor(() => expect(storeRef.graphView.cells.getSize()).toBe(2));
  });
});
