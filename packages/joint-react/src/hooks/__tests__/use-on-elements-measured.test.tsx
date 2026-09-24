/* eslint-disable unicorn/consistent-function-scoping */
import { renderHook, waitFor, act } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useOnElementsMeasured } from '../use-on-elements-measured';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { useGraphStore } from '../use-graph-store';
import type { CellRecord } from '../../types/cell.types';
import type { ElementsMeasuredParams } from '../use-on-elements-measured';
import type { dia } from '@joint/core';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const wrapper = paperRenderElementWrapper({
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
  paperProps: {
    id: 'measured-effect-paper',
    renderElement: () => <rect />,
  },
});

/**
 * Wrapper with zero-size elements (ElementModel defaults).
 * Simulates the flowchart scenario where elements rely on
 * ResizeObserver to set their real size via `fromMeasure`.
 */
const zeroSizeWrapper = paperRenderElementWrapper({
  graphProviderProps: {
    initialCells: [
      {
        id: 'zero-el',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
      } as CellRecord,
    ],
  },
  paperProps: {
    id: 'zero-size-paper',
    renderElement: () => <rect />,
  },
});

const incrementMeasureState = (previous: number) => previous + 1;

type MeasureStateRef = ReturnType<typeof useGraphStore>['measureState'];

const bumpMeasureFor = (measureState: MeasureStateRef) => () =>
  measureState.set(incrementMeasureState);

describe('useOnElementsMeasured', () => {
  it('fires callback with isInitial=true after seed cells are measured', async () => {
    const callback = jest.fn();
    renderHook(() => useOnElementsMeasured('measured-effect-paper', callback), { wrapper });

    await waitFor(() => expect(callback).toHaveBeenCalled());
    const initialCalls = callback.mock.calls.filter(([event]) => event.isInitial === true);
    expect(initialCalls.length).toBeGreaterThan(0);
  });

  it('subsequent measurement bumps fire callback with isInitial=false', async () => {
    const callback = jest.fn();
    let bumpMeasure: () => void = () => {};
    function Probe() {
      const { measureState } = useGraphStore();
      bumpMeasure = bumpMeasureFor(measureState);
      useOnElementsMeasured('measured-effect-paper', callback);
      return null;
    }
    renderHook(() => Probe(), { wrapper });

    await waitFor(() =>
      expect(callback.mock.calls.some(([event]) => event.isInitial === true)).toBe(true)
    );
    callback.mockClear();
    act(() => {
      bumpMeasure();
    });
    await flush();
    expect(callback).toHaveBeenCalled();
    for (const [event] of callback.mock.calls) {
      expect((event as ElementsMeasuredParams).isInitial).toBe(false);
    }
  });

  // Regression: ElementModel defaults to size {0,0}. The ResizeObserver
  // pipeline sets the real size via `cell.set('size', ..., {fromMeasure: true})`.
  // Previously, the `change:size` listener in graph-changes.ts skipped
  // `fromMeasure` writes, so the measured-size never reached the tracking
  // logic and `useOnElementsMeasured` never fired for elements that relied
  // on DOM measurement (e.g. the flowchart demo).
  it('fires callback when elements start at zero size and get measured via fromMeasure', async () => {
    const callback = jest.fn();
    let graphRef: dia.Graph | undefined;

    function Probe() {
      const store = useGraphStore();
      graphRef = store.graph;
      useOnElementsMeasured('zero-size-paper', callback);
      return null;
    }

    renderHook(() => Probe(), { wrapper: zeroSizeWrapper });

    // Wait for render to complete and graph to be available.
    await waitFor(() => expect(graphRef).toBeDefined());
    await flush();

    // Initial size is {0,0} — callback should NOT have fired yet
    // (measureState only bumps when elementsMeasured.size > 0).
    expect(callback).not.toHaveBeenCalled();

    // Simulate ResizeObserver setting the real measured size.
    act(() => {
      const cell = graphRef!.getCell('zero-el') as dia.Element;
      cell.set('size', { width: 100, height: 60 }, { fromMeasure: true } as object);
    });

    await waitFor(() => expect(callback).toHaveBeenCalled());
    expect(callback.mock.calls[0][0].isInitial).toBe(true);
  });

  // Regression (#3514): the store's `change:size` listener dropped the event
  // options, so an application's own resize bumped `measureState` like a
  // measurement write and woke every subscriber.
  describe('application resizes vs measurement writes', () => {
    function renderMeasuredProbe(callback: jest.Mock) {
      let graphRef: dia.Graph | undefined;
      function Probe() {
        const store = useGraphStore();
        graphRef = store.graph;
        useOnElementsMeasured('measured-effect-paper', callback);
        return null;
      }
      renderHook(() => Probe(), { wrapper });
      return () => graphRef!.getCell('a') as dia.Element;
    }

    it('does not fire when the application resizes an element', async () => {
      const callback = jest.fn();
      const getElement = renderMeasuredProbe(callback);
      await waitFor(() => expect(callback).toHaveBeenCalled());
      callback.mockClear();

      act(() => {
        getElement().resize(80, 80);
      });
      await act(async () => flush());
      await act(async () => flush());

      expect(callback).not.toHaveBeenCalled();
    });

    it('fires with isInitial=false for a measurement write', async () => {
      const callback = jest.fn();
      const getElement = renderMeasuredProbe(callback);
      await waitFor(() => expect(callback).toHaveBeenCalled());
      callback.mockClear();

      act(() => {
        getElement().set('size', { width: 80, height: 80 }, { autoSize: true });
      });

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0].isInitial).toBe(false);
    });
  });
});
