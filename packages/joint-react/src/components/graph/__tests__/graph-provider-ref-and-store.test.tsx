 
import { useRef, useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { GraphProvider } from '../graph-provider';
import { GraphStore } from '../../../store';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    size: { width: 10, height: 10 },
  } as CellRecord,
];

describe('GraphProvider — ref + store integration', () => {
  it('forwards the underlying dia.Graph instance via the ref prop (instanceSelector branch)', async () => {
    const refHolder: { current: dia.Graph | null } = { current: null };
    function App() {
      const ref = useRef<dia.Graph | null>(null);
      useEffect(() => {
        if (ref.current) refHolder.current = ref.current;
      });
      return <GraphProvider initialCells={CELLS} ref={ref} />;
    }
    render(<App />);
    await waitFor(() => {
      expect(refHolder.current).not.toBeNull();
      expect(refHolder.current?.getCells().length).toBe(1);
    });
  });

  it('does not destroy the store on unmount when an external store is supplied (cleanup early-return branch)', async () => {
    const externalStore = new GraphStore({});
    const destroySpy = jest.spyOn(externalStore, 'destroy');
    const { unmount } = render(
      <GraphProvider store={externalStore}>
        <span>child</span>
      </GraphProvider>
    );
    await waitFor(() => {
      // ensure we mounted
      expect(externalStore.graph).toBeDefined();
    });
    unmount();
    expect(destroySpy).not.toHaveBeenCalled();
    // Clean up the external store ourselves
    externalStore.destroy(false);
  });
});
