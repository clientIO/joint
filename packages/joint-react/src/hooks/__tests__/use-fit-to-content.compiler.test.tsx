/* eslint-disable unicorn/consistent-function-scoping */
import { renderHook, waitFor, act } from '@testing-library/react';
import { dia, g } from '@joint/core';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
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

// The React Compiler auto-memoizes the hook's render-phase work. These cases
// re-run the trigger wiring under it to prove the memoization does not stop a
// fit from being scheduled.
describe('fitToContent prop (react-compiler)', () => {
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

  it('fits after the first measurement pass', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-initial-compiler', true) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
  });

  it('refit "once" ignores later measurement passes', async () => {
    let bump: () => void = () => {};
    function Probe() {
      const { measureState } = useGraphStore();
      bump = () => measureState.set(incrementMeasureState);
      return null;
    }
    renderHook(() => Probe(), {
      wrapper: makeWrapper('fit-once-compiler', { refit: 'once' }),
    });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    await act(async () => {
      bump();
      await flush();
    });
    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('refit "resize" fits again when the host resizes', async () => {
    renderHook(() => null, { wrapper: makeWrapper('fit-resize-compiler', true) });
    await waitFor(() => expect(transformSpy).toHaveBeenCalled());
    transformSpy.mockClear();
    await act(async () => {
      triggerResize();
      await flush();
    });
    expect(transformSpy).toHaveBeenCalled();
  });
});
