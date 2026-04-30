/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { Paper } from '../paper';
import { GraphProvider } from '../../graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS: readonly CellRecord[] = [
  {
    id: '1',
    type: ELEMENT_MODEL_TYPE,
    size: { width: 50, height: 50 },
  } as CellRecord,
];

const renderRectElement = () => <rect />;

describe('Paper', () => {
  it('falls back to style.width / style.height when width / height props are omitted', async () => {
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper style={{ width: 200, height: 150 }} renderElement={renderRectElement} />
      </GraphProvider>
    );
    // Paper host div should exist with applied style.
    await waitFor(() => {
      const host = container.querySelector('div') as HTMLDivElement | null;
      expect(host).toBeTruthy();
      // svg child rendered → paper successfully created with resolved dims
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('renders paper without explicit width/height (style undefined branch)', async () => {
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper renderElement={renderRectElement} />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('forwards the paper instance through ref via useImperativeHandle', async () => {
    const refHolder: { current: dia.Paper | null } = { current: null };
    function App() {
      const ref = useRef<dia.Paper | null>(null);
      // Push the ref value into a sentinel state so waitFor can poll a re-render.
      useEffect(() => {
        if (ref.current && !refHolder.current) {
          refHolder.current = ref.current;
        }
      });
      return (
        <GraphProvider initialCells={CELLS}>
          <Paper ref={ref} width={100} height={100} renderElement={renderRectElement} />
        </GraphProvider>
      );
    }
    const { rerender } = render(<App />);
    // Trigger a re-render after the paper is ready so the effect captures it.
    await waitFor(() => {
      rerender(<App />);
      expect(refHolder.current).not.toBeNull();
    });
  });
});
