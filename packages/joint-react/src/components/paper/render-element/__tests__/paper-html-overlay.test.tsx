/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { act, render, waitFor } from '@testing-library/react';
import { useGraph } from '../../../../hooks/use-graph';
import { GraphProvider } from '../../../graph/graph-provider';
import { Paper } from '../../paper';
import { ELEMENT_MODEL_TYPE } from '../../../../mvc/element-model';
import type { CellRecord } from '../../../../types/cell.types';

const OVERLAY_LAYERS = [{ id: 'notes', visible: false }];
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
        <Paper style={{ width: 300, height: 300 }}
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
      expect(wrappers).toHaveLength(2);
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
        <Paper style={{ width: 200, height: 200 }}
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


describe('HTML overlay layer visibility', () => {
  it('hides and restores HTML content without unmounting or rendering it again', async () => {
    let api: ReturnType<typeof useGraph> | undefined;
    const renderContent = jest.fn(() => <button data-testid="overlay-button">Layer content</button>);
    function CaptureGraph() {
      api = useGraph();
      return null;
    }
    const { container } = render(
      <GraphProvider initialCells={HTML_CELLS}>
        <CaptureGraph />
        <Paper useHTMLOverlay renderElement={renderContent} />
      </GraphProvider>
    );
    await waitFor(() => expect(container.querySelector('div[model-id="a"]')).toBeTruthy());
    const wrapper = container.querySelector('div[model-id="a"]') as HTMLDivElement;
    const button = wrapper.querySelector('button');
    const renders = renderContent.mock.calls.length;
    act(() => api?.setLayer('cells', { visible: false }));
    expect(wrapper.style.visibility).toBe('hidden');
    expect(wrapper.querySelector('button')).toBe(button);
    expect(wrapper.style.width).toBe('60px');
    expect(renderContent).toHaveBeenCalledTimes(renders);
    act(() => api?.setLayer('cells', { visible: true }));
    expect(wrapper.style.visibility).not.toBe('hidden');
    expect(wrapper.querySelector('button')).toBe(button);
    expect(renderContent).toHaveBeenCalledTimes(renders);
  });

  it('tracks layer moves and a changed default layer, and ignores unrelated layer edits', async () => {
    let api: ReturnType<typeof useGraph> | undefined;
    const renderContent = jest.fn(() => <span>Content</span>);
    function CaptureGraph() {
      api = useGraph();
      return null;
    }
    const { container } = render(
      <GraphProvider initialCells={HTML_CELLS} initialLayers={OVERLAY_LAYERS}>
        <CaptureGraph />
        <Paper useHTMLOverlay renderElement={renderContent} />
      </GraphProvider>
    );
    await waitFor(() => expect(container.querySelector('div[model-id="a"]')).toBeTruthy());
    const wrapper = container.querySelector('div[model-id="a"]') as HTMLDivElement;
    const initialRenders = renderContent.mock.calls.length;
    act(() => api?.setLayer('notes', { name: 'Annotations' }));
    expect(wrapper.style.visibility).not.toBe('hidden');
    expect(renderContent).toHaveBeenCalledTimes(initialRenders);

    await act(async () => { api?.graph.getCell('a').layer('notes'); });
    expect(wrapper.style.visibility).toBe('hidden');
    await act(async () => { api?.graph.getCell('a').layer(null); });
    expect(wrapper.style.visibility).not.toBe('hidden');
    await act(async () => { api?.graph.setDefaultLayer('notes'); });
    expect(wrapper.style.visibility).toBe('hidden');
    expect(container.querySelector('div[model-id="a"]')).toBe(wrapper);
  });

});
