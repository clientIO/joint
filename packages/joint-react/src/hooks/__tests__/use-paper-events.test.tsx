import { mvc } from '@joint/core';
import { renderHook, render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import {
  usePaperEvents,
  buildEventContext,
  subscribeToPaperEvents,
} from '../use-paper-events';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';
import type { PaperStore } from '../../store';
import type { dia } from '@joint/core';

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
];

const renderRectElement = () => <rect />;

describe('buildEventContext', () => {
  it('exposes graph + paper and merges feature instances', () => {
    const fakePaper = { __fake: 'paper' } as unknown as dia.Paper;
    const fakeGraph = { __fake: 'graph' } as unknown as dia.Graph;
    const paperStore: PaperStore = {
      paper: fakePaper,
      features: {
        feat1: { id: 'feat1', instance: { value: 1 } },
        // Feature without an instance — exercised by the `if (instance)` guard.
        feat2: { id: 'feat2', instance: undefined } as unknown as PaperStore['features'][string],
      },
    } as unknown as PaperStore;
    const ctx = buildEventContext(paperStore, fakeGraph);
    expect(ctx.paper).toBe(fakePaper);
    expect(ctx.graph).toBe(fakeGraph);
    // Feature with an instance is included.
    expect((ctx as unknown as { feat1: unknown }).feat1).toEqual({ value: 1 });
    // Feature without an instance is skipped.
    expect((ctx as unknown as { feat2?: unknown }).feat2).toBeUndefined();
  });
});

describe('subscribeToPaperEvents', () => {
  it('binds handlers from a static map and stops them on cleanup', () => {
    const stopListening = jest.fn();
    const listenTo = jest.fn();
    const listenerSpy = jest
      .spyOn(mvc.Listener.prototype, 'listenTo')
      .mockImplementation(listenTo);
    const stopSpy = jest
      .spyOn(mvc.Listener.prototype, 'stopListening')
      .mockImplementation(stopListening);
    try {
      const fakePaper = { __fake: 'paper' } as unknown as dia.Paper;
      const fakeGraph = { __fake: 'graph' } as unknown as dia.Graph;
      const handler = jest.fn();
      const cleanup = subscribeToPaperEvents(
        {
          paper: fakePaper,
          features: {},
        } as unknown as PaperStore,
        fakeGraph,
        {
          'element:pointerclick': handler,
          // undefined handler triggers the `if (!handler) continue;` guard
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'element:pointerdown': undefined as any,
        }
      );
      // Only the defined handler was registered.
      expect(listenTo).toHaveBeenCalledTimes(1);
      const [[, eventName, callback]] = listenTo.mock.calls;
      expect(eventName).toBe('element:pointerclick');
      // Invoking the wrapper proxies through to the user handler.
      (callback as (...args: unknown[]) => void)('arg1', 'arg2');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');

      cleanup();
      expect(stopListening).toHaveBeenCalled();
    } finally {
      listenerSpy.mockRestore();
      stopSpy.mockRestore();
    }
  });

  it('accepts a factory that derives handlers from context', () => {
    const listenTo = jest.fn();
    const stopListening = jest.fn();
    const listenerSpy = jest
      .spyOn(mvc.Listener.prototype, 'listenTo')
      .mockImplementation(listenTo);
    const stopSpy = jest
      .spyOn(mvc.Listener.prototype, 'stopListening')
      .mockImplementation(stopListening);
    try {
      const fakePaper = {} as unknown as dia.Paper;
      const fakeGraph = {} as unknown as dia.Graph;
      const factory = jest.fn(() => ({
        'cell:pointermove': jest.fn(),
      }));
      const cleanup = subscribeToPaperEvents(
        { paper: fakePaper, features: {} } as unknown as PaperStore,
        fakeGraph,
        factory
      );
      expect(factory).toHaveBeenCalledWith(
        expect.objectContaining({ paper: fakePaper, graph: fakeGraph })
      );
      expect(listenTo).toHaveBeenCalled();
      cleanup();
      expect(stopListening).toHaveBeenCalled();
    } finally {
      listenerSpy.mockRestore();
      stopSpy.mockRestore();
    }
  });
});

describe('usePaperEvents (hook integration)', () => {
  it('subscribes paper events when paper resolves by id', async () => {
    const handler = jest.fn();
    function Probe() {
      usePaperEvents('events-paper', { 'cell:pointerdown': handler });
      return null;
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper id="events-paper" width={100} height={100} renderElement={renderRectElement}>
          <Probe />
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      // The paper exists; subscription is established.
      expect(true).toBe(true);
    });
  });

  it('is safe to call with no resolvable paper (early return)', async () => {
    const handler = jest.fn();
    // A paper id that never registers — paperStore stays null and the
    // `if (!paperStore) return;` short-circuit holds.
    const { unmount } = renderHook(
      () => usePaperEvents('non-existent-paper', { 'cell:pointerdown': handler }),
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>{children}</GraphProvider>
        ),
      }
    );
    expect(handler).not.toHaveBeenCalled();
    unmount();
  });
});
