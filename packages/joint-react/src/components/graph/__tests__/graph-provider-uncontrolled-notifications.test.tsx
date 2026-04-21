import React, { useCallback, useRef } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { useGraph } from '../../../hooks';
import type { ElementRecord } from '../../../types/data-types';

const INITIAL_ELEMENTS: Record<string, ElementRecord> = {
  e1: { size: { width: 10, height: 10 } },
};

describe('GraphProvider uncontrolled notifications', () => {
  it('fires onElementsChange in uncontrolled mode without React→graph push', async () => {
    const elementSnapshots: Array<Record<string, ElementRecord>> = [];

    let graphRef!: ReturnType<typeof useGraph>;
    function Probe() {
      graphRef = useGraph();
      return null;
    }

    function App() {
      const snapshotsRef = useRef(elementSnapshots);
      const handleElementsChange = useCallback(
        (els: Record<string, ElementRecord>) => {
          snapshotsRef.current.push(els);
        },
        []
      );

      return (
        <GraphProvider initialElements={INITIAL_ELEMENTS} onElementsChange={handleElementsChange}>
          <Probe />
        </GraphProvider>
      );
    }

    render(<App />);

    // Wait for graphRef to be populated
    await waitFor(() => expect(graphRef).toBeDefined());

    const snapshotCountBefore = elementSnapshots.length;

    act(() => {
      graphRef.graph.addCell({
        id: 'e2',
        type: 'standard.Rectangle',
        position: { x: 30, y: 30 },
        size: { width: 20, height: 20 },
      });
    });

    await waitFor(() => {
      expect(elementSnapshots.length).toBeGreaterThan(snapshotCountBefore);
      const last = elementSnapshots.at(-1);
      expect(last && Object.keys(last)).toContain('e2');
    });
  });
});
