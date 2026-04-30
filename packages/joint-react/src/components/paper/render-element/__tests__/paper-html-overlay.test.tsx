/* eslint-disable react-perf/jsx-no-new-function-as-prop */
 
import { render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../../../graph/graph-provider';
import { Paper } from '../../paper';
import { ELEMENT_MODEL_TYPE } from '../../../../models/element-model';
import type { CellRecord } from '../../../../types/cell.types';

const HTML_CELLS: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 10, y: 20 },
    size: { width: 60, height: 40 },
    data: { label: 'A' },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 80, y: 90 },
    size: { width: 50, height: 30 },
    data: { label: 'B' },
  } as CellRecord,
];

describe('Paper with useHTMLOverlay', () => {
  it('renders elements through the HTML overlay container with positioned wrappers', async () => {
    const { container } = render(
      <GraphProvider initialCells={HTML_CELLS}>
        <Paper
          width={300}
          height={300}
          useHTMLOverlay
          renderElement={({ label }: { label: string }) => (
            <div data-testid={`label-${label}`}>{label}</div>
          )}
        />
      </GraphProvider>
    );

    // The HTML container portal renders div wrappers with `model-id` attribute.
    await waitFor(() => {
      const wrappers = container.querySelectorAll('div[model-id]');
      expect(wrappers.length).toBe(2);
    });
    // Each wrapper has absolute positioning + transform applied.
    const wrapperA = container.querySelector('div[model-id="a"]') as HTMLDivElement | null;
    expect(wrapperA).toBeTruthy();
    expect(wrapperA?.style.position).toBe('absolute');
    expect(wrapperA?.style.transform).toContain('translate(10px, 20px)');
    expect(wrapperA?.style.width).toBe('60px');
    expect(wrapperA?.style.height).toBe('40px');

    // Hit-area rectangles still render in SVG mode for pointer events.
    const hitRects = container.querySelectorAll('rect[fill="transparent"]');
    expect(hitRects.length).toBeGreaterThanOrEqual(2);

    // The user element content was rendered inside the wrapper.
    expect(container.querySelector('[data-testid="label-A"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="label-B"]')).toBeTruthy();
  });

  it('keeps the HTML overlay positioned correctly while paper is mounted', async () => {
    const { container } = render(
      <GraphProvider initialCells={HTML_CELLS}>
        <Paper
          width={200}
          height={200}
          useHTMLOverlay
          renderElement={() => <span>x</span>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      // The container div itself has been mounted with the paper transform.
      const overlays = container.querySelectorAll('div[style*="position: absolute"]');
      expect(overlays.length).toBeGreaterThan(0);
    });
  });
});
