/* eslint-disable unicorn/consistent-function-scoping */
import { renderHook, waitFor, act } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useOnElementsMeasured } from '../use-on-elements-measured';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { AUTO_SIZE_OPTION } from '../../store/measurement';
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
 * ResizeObserver to set their real size via an `autoSize` write.
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

/**
 * Mounts the hook for `paperId` through `hookWrapper` and returns a getter of
 * the live graph. The wrappers mount their children inside `renderElement`, so
 * there is one hook instance per rendered element.
 */
function renderMeasuredProbe(
  callback: jest.Mock,
  hookWrapper: typeof wrapper = wrapper,
  paperId = 'measured-effect-paper'
) {
  let graphRef: dia.Graph | undefined;
  function Probe() {
    graphRef = useGraphStore().graph;
    useOnElementsMeasured(paperId, callback);
    return null;
  }
  renderHook(() => Probe(), { wrapper: hookWrapper });
  return () => graphRef as dia.Graph;
}

describe('useOnElementsMeasured', () => {
  it('fires callback with isInitial=true after seed cells are measured', async () => {
    const callback = jest.fn();
    renderHook(() => useOnElementsMeasured('measured-effect-paper', callback), { wrapper });

    await waitFor(() => expect(callback).toHaveBeenCalled());
    const initialCalls = callback.mock.calls.filter(([event]) => event.isInitial === true);
    expect(initialCalls.length).toBeGreaterThan(0);
  });

  it('later settled changes fire the callback with isInitial=false', async () => {
    const callback = jest.fn();
    const getGraph = renderMeasuredProbe(callback);

    await waitFor(() =>
      expect(callback.mock.calls.some(([event]) => event.isInitial === true)).toBe(true)
    );
    callback.mockClear();
    act(() => {
      (getGraph().getCell('a') as dia.Element).set('size', { width: 70, height: 70 }, {
        [AUTO_SIZE_OPTION]: true,
      } as object);
    });
    await waitFor(() => expect(callback).toHaveBeenCalled());
    for (const [event] of callback.mock.calls) {
      expect((event as ElementsMeasuredParams).isInitial).toBe(false);
    }
  });

  // An element nothing measures is settled once the paper rendered it, whatever
  // its size: zero is a legal size. A later measurement is one more change.
  it('fires for a zero-sized element once it is rendered, then for its measurement', async () => {
    const callback = jest.fn();
    const getGraph = renderMeasuredProbe(callback, zeroSizeWrapper, 'zero-size-paper');

    await waitFor(() => expect(callback).toHaveBeenCalled());
    expect(callback.mock.calls[0][0].isInitial).toBe(true);
    callback.mockClear();

    act(() => {
      const cell = getGraph().getCell('zero-el') as dia.Element;
      cell.set('size', { width: 100, height: 60 }, { [AUTO_SIZE_OPTION]: true } as object);
    });

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].isInitial).toBe(false);
  });

  it('reports isInitial again for the first event after a graph reset', async () => {
    const callback = jest.fn();
    const getGraph = renderMeasuredProbe(callback);
    await waitFor(() => expect(callback).toHaveBeenCalled());
    callback.mockClear();

    act(() => {
      getGraph().resetCells([
        {
          id: 'x',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 9, height: 9 },
        },
      ]);
    });

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].isInitial).toBe(true);
  });

  // Regression (#3514): the store's `change:size` listener dropped the event
  // options, so an application's own resize bumped `measureState` like a
  // measurement write and woke every subscriber.
  describe('application resizes vs measurement writes', () => {
    it('does not fire when the application resizes an element', async () => {
      const callback = jest.fn();
      const getGraph = renderMeasuredProbe(callback);
      const getElement = () => getGraph().getCell('a') as dia.Element;
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
      const getGraph = renderMeasuredProbe(callback);
      const getElement = () => getGraph().getCell('a') as dia.Element;
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
