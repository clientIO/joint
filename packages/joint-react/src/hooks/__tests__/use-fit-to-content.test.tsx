/* eslint-disable unicorn/consistent-function-scoping */
import { render, renderHook, waitFor, act } from '@testing-library/react';
import { dia, g } from '@joint/core';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';
import type { PaperProps } from '../../components/paper/paper.types';
import { useGraphStore } from '../use-graph-store';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/** Fires every live ResizeObserver, which the global jest mock cannot do. */
const resizeTriggers = new Set<() => void>();

beforeEach(() => {
  resizeTriggers.clear();
  globalThis.ResizeObserver = class MockResizeObserver implements ResizeObserver {
    public constructor(private readonly callback: ResizeObserverCallback) {
      resizeTriggers.add(() => this.callback([], this));
    }
    public observe(): void {}
    public unobserve(): void {}
    public disconnect(): void {}
  };
});

const incrementMeasureState = (previous: number) => previous + 1;

const renderRect = () => <rect />;
const ZOOM_PRESET: PaperProps['fitToContent'] = { padding: 24 };
const ZOOM_PRESET_PADDED: PaperProps['fitToContent'] = { padding: 60 };
/** Distinct object, identical content — what an inline prop produces each render. */
const ZOOM_PRESET_EQUAL: PaperProps['fitToContent'] = { padding: 24 };
const RESIZE_PRESET: PaperProps['fitToContent'] = { mode: 'resize', padding: 24 };

const triggerResize = () => {
  for (const trigger of resizeTriggers) trigger();
};

function makeWrapper(id: string, fitToContent?: PaperProps['fitToContent']) {
  return paperRenderElementWrapper({
    graphProviderProps: {
      initialCells: [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
        } as CellRecord,
      ],
    },
    paperProps: { id, fitToContent, renderElement: () => <rect /> },
  });
}

describe('fitToContent prop', () => {
  let transformSpy: jest.SpyInstance;
  let resizeSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on the prototype: the first fit can land before a test could reach
    // the instance.
    transformSpy = jest
      .spyOn(dia.Paper.prototype, 'transformToFitContent')
      .mockImplementation(() => {});
    // `paper.fitToContent` returns the applied area, so the stub must too.
    resizeSpy = jest
      .spyOn(dia.Paper.prototype, 'fitToContent')
      .mockImplementation(() => new g.Rect(0, 0, 50, 50));
  });

  afterEach(() => {
    transformSpy.mockRestore();
    resizeSpy.mockRestore();
  });

  it('fits after the first measurement pass', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-initial', true) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
  });

  it('does not fit when the prop is absent', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-off') });
    await flush();
    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('refit "once" ignores later measurement passes', async () => {
    let bump: () => void = () => {};
    function Probe() {
      const { measureState } = useGraphStore();
      bump = () => measureState.set(incrementMeasureState);
      return null;
    }
    renderHook(() => Probe(), { wrapper: makeWrapper('fit-once', { refit: 'once' }) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    await act(async () => {
      bump();
      await flush();
    });
    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('refit "resize" fits again when the host resizes', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-resize', true) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    await act(async () => {
      triggerResize();
      await flush();
    });
    expect(transformSpy).toHaveBeenCalled();
  });

  it('refit "once" does not fit on a host resize', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-once-resize', { refit: 'once' }) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    await act(async () => {
      triggerResize();
      await flush();
    });
    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('refit "always" fits again when a cell is added', async () => {
    let addCell: () => void = () => {};
    function Probe() {
      const { graph } = useGraphStore();
      // Plain attributes, so the graph builds the cell through its namespace and
      // gets joint-react's ElementModel (a raw `dia.Element` has no markup).
      addCell = () =>
        graph.addCell({
          type: ELEMENT_MODEL_TYPE,
          position: { x: 400, y: 400 },
          size: { width: 20, height: 20 },
        });
      return null;
    }
    renderHook(() => Probe(), { wrapper: makeWrapper('fit-always', { refit: 'always' }) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    await act(async () => {
      addCell();
      await flush();
    });
    expect(transformSpy).toHaveBeenCalled();
  });

  it('resize mode calls paper.fitToContent instead', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-mode-resize', { mode: 'resize' }) });
    await waitFor(() => expect(resizeSpy).toHaveBeenCalled());
    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('resize mode ignores the ResizeObserver echo of its own fit', async () => {
    // A `mode: 'resize'` fit changes the host's size, which feeds the observer.
    // The guard compares sizes, so a callback reporting the size we just fitted
    // at is dropped; jsdom reports a constant size, which is exactly that case.
    renderHook(() => null, {
      wrapper: makeWrapper('fit-resize-echo', { mode: 'resize' }),
    });
    await waitFor(() => expect(resizeSpy).toHaveBeenCalled());
    resizeSpy.mockClear();
    await act(async () => {
      triggerResize();
      await flush();
    });
    expect(resizeSpy).not.toHaveBeenCalled();
  });

  it('warns and skips when transform is set too', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() => null, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: {
          initialCells: [
            { id: 'a', type: ELEMENT_MODEL_TYPE, size: { width: 50, height: 50 } } as CellRecord,
          ],
        },
        paperProps: {
          id: 'fit-vs-transform',
          fitToContent: true,
          transform: 'scale(0.5)',
          renderElement: () => <rect />,
        },
      }),
    });
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(transformSpy).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

// Regression: the refit effects were keyed on `refit` alone, so changing any
// other fit option (switching `mode` with `refit` unchanged) re-ran nothing and
// the prop silently kept the previous framing until an unrelated trigger fired.
describe('fitToContent reacts to prop changes', () => {
  let transformSpy: jest.SpyInstance;
  let resizeSpy: jest.SpyInstance;

  beforeEach(() => {
    transformSpy = jest
      .spyOn(dia.Paper.prototype, 'transformToFitContent')
      .mockImplementation(() => {});
    resizeSpy = jest
      .spyOn(dia.Paper.prototype, 'fitToContent')
      .mockImplementation(() => new g.Rect(0, 0, 50, 50));
  });

  afterEach(() => {
    transformSpy.mockRestore();
    resizeSpy.mockRestore();
  });

  const cells = [
    {
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
    } as CellRecord,
  ];

  function Diagram({ fitToContent }: Readonly<{ fitToContent: PaperProps['fitToContent'] }>) {
    return (
      <GraphProvider initialCells={cells}>
        <Paper id="fit-prop-change" fitToContent={fitToContent} renderElement={renderRect} />
      </GraphProvider>
    );
  }

  it('re-fits when mode changes while refit stays the same', async () => {
    const { rerender } = render(<Diagram fitToContent={ZOOM_PRESET} />);
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    resizeSpy.mockClear();

    // `refit` is 'resize' in both presets — only `mode` differs.
    rerender(<Diagram fitToContent={RESIZE_PRESET} />);
    await act(async () => flush());
    expect(resizeSpy).toHaveBeenCalled();
  });

  it('re-fits when a fit option changes while mode and refit stay the same', async () => {
    const { rerender } = render(<Diagram fitToContent={ZOOM_PRESET} />);
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();

    rerender(<Diagram fitToContent={ZOOM_PRESET_PADDED} />);
    await act(async () => flush());
    expect(transformSpy).toHaveBeenCalled();
  });

  it('does not re-fit when an equal options object is passed again', async () => {
    const { rerender } = render(<Diagram fitToContent={ZOOM_PRESET} />);
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();

    // A different object with the same content — the common inline-prop case.
    rerender(<Diagram fitToContent={ZOOM_PRESET_EQUAL} />);
    await act(async () => flush());
    expect(transformSpy).not.toHaveBeenCalled();
  });
});
