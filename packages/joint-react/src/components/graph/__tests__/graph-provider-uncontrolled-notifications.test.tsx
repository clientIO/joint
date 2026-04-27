import React, { useContext, useRef } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { GraphStoreContext } from '../../../context';
import type { GraphStore } from '../../../store';
import type { Cells, CellRecord } from '../../../types/cell.types';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';

const initialCells: Cells = [
  {
    id: 'e1',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord,
];

describe('GraphProvider uncontrolled notifications', () => {
  it('fires onCellsChange in uncontrolled mode without React→graph push', async () => {
    const snapshots: Array<readonly CellRecord[]> = [];

    let storeRef!: GraphStore;
    function Probe() {
      const store = useContext(GraphStoreContext);
      if (store) storeRef = store as GraphStore;
      return null;
    }

    function App() {
      const snapshotsRef = useRef(snapshots);
      const onCellsChange = React.useCallback((cells: Cells) => {
        snapshotsRef.current.push([...cells] as CellRecord[]);
      }, []);

      return (
        <GraphProvider initialCells={initialCells} onCellsChange={onCellsChange}>
          <Probe />
        </GraphProvider>
      );
    }

    render(<App />);
    await waitFor(() => expect(storeRef).toBeDefined());

    const before = snapshots.length;
    act(() => {
      storeRef.graph.addCell({
        id: 'e2',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 30, y: 30 },
        size: { width: 20, height: 20 },
      });
    });

    await waitFor(() => {
      expect(snapshots.length).toBeGreaterThan(before);
      const last = snapshots.at(-1)!;
      expect(last.some((c) => c.id === 'e2')).toBe(true);
    });
  });
});
