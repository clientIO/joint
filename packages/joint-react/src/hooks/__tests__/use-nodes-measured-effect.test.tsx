/* eslint-disable unicorn/consistent-function-scoping */
import { renderHook, waitFor, act } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useNodesMeasuredEffect } from '../use-nodes-measured-effect';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { useGraphStore } from '../use-graph-store';
import type { CellRecord } from '../../types/cell.types';
import type { ElementsMeasuredEvent } from '../../types/event.types';

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

const incrementMeasureState = (previous: number) => previous + 1;

type MeasureStateRef = ReturnType<typeof useGraphStore>['measureState'];

const bumpMeasureFor = (measureState: MeasureStateRef) => () =>
  measureState.set(incrementMeasureState);

describe('useNodesMeasuredEffect', () => {
  it('fires callback with isInitial=true after seed cells are measured', async () => {
    const callback = jest.fn();
    renderHook(() => useNodesMeasuredEffect('measured-effect-paper', callback), { wrapper });

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
      useNodesMeasuredEffect('measured-effect-paper', callback);
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
      expect((event as ElementsMeasuredEvent).isInitial).toBe(false);
    }
  });

  it('with { once: true }, only fires once and unsubscribes', async () => {
    const callback = jest.fn();
    let bumpMeasure: () => void = () => {};
    const onceOptions = { once: true } as const;
    const noDeps: readonly unknown[] = [];
    function Probe() {
      const { measureState } = useGraphStore();
      bumpMeasure = bumpMeasureFor(measureState);
      useNodesMeasuredEffect('measured-effect-paper', callback, noDeps, onceOptions);
      return null;
    }
    renderHook(() => Probe(), { wrapper });

    await waitFor(() => expect(callback).toHaveBeenCalled());
    const callsAfterMount = callback.mock.calls.length;

    act(() => {
      bumpMeasure();
      bumpMeasure();
      bumpMeasure();
    });
    await flush();
    // With { once: true } no further fires after the initial measurement.
    expect(callback).toHaveBeenCalledTimes(callsAfterMount);
  });
});
