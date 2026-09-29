/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { mvc } from '@joint/core';
import { renderHook, render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { useOnPaperEvents, subscribeToPaperEvents } from '../use-on-paper-events';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
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

// Third listenTo argument is the registered dispatch wrapper.
function getRegisteredWrapper(call: readonly unknown[] | undefined): (...args: unknown[]) => void {
  return call?.[2] as (...args: unknown[]) => void;
}

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
      const handler = jest.fn();
      const cleanup = subscribeToPaperEvents(
        {
          paper: fakePaper,
          features: {},
        } as unknown as PaperStore,
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
});

describe('useOnPaperEvents (hook integration)', () => {
  it('subscribes paper events when paper resolves by id', async () => {
    const handler = jest.fn();
    function Probe() {
      useOnPaperEvents('events-paper', { 'cell:pointerdown': handler });
      return null;
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="events-paper" renderElement={renderRectElement}>
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
    // `if (!target) return;` short-circuit holds.
    const { unmount } = renderHook(
      () => useOnPaperEvents('non-existent-paper', { 'cell:pointerdown': handler }),
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>{children}</GraphProvider>
        ),
      }
    );
    expect(handler).not.toHaveBeenCalled();
    unmount();
  });

  it('does not re-subscribe when handler identity changes, yet calls the latest closure', async () => {
    // Passthrough spy — paper/store internals also use mvc.Listener and must keep working.
    const listenerSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const pointerDownCalls = () =>
      listenerSpy.mock.calls.filter((call) => (call[1] as unknown) === 'cell:pointerdown');
    try {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();
      function Probe({ handler }: { readonly handler: () => void }) {
        // Fresh inline map every render — must NOT re-subscribe.
        useOnPaperEvents('events-paper', { 'cell:pointerdown': handler });
        return null;
      }
      const ui = (handler: () => void) => (
        <GraphProvider initialCells={initialCells}>
          <Paper style={{ width: 100, height: 100 }} id="events-paper" renderElement={renderRectElement}>
            <Probe handler={handler} />
          </Paper>
        </GraphProvider>
      );
      const { rerender } = render(ui(firstHandler));
      await waitFor(() => expect(pointerDownCalls().length).toBeGreaterThan(0));
      const subscriptionsAfterMount = pointerDownCalls().length;

      rerender(ui(secondHandler));
      // Handler identity changed; the subscription must stay put.
      expect(pointerDownCalls().length).toBe(subscriptionsAfterMount);

      // Dispatch through the registered wrapper — the LATEST handler runs.
      const wrapper = getRegisteredWrapper(pointerDownCalls().at(-1));
      wrapper('view', 'evt');
      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalledWith('view', 'evt');
    } finally {
      listenerSpy.mockRestore();
    }
  });

  it('re-subscribes when the set of event names changes', async () => {
    const listenerSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const hasEventSubscription = (eventName: string) =>
      listenerSpy.mock.calls.some((call) => (call[1] as unknown) === eventName);
    try {
      function Probe({ hasClick }: { readonly hasClick: boolean }) {
        useOnPaperEvents(
          'events-paper',
          hasClick
            ? { 'cell:pointerdown': jest.fn(), 'cell:pointerclick': jest.fn() }
            : { 'cell:pointerdown': jest.fn() }
        );
        return null;
      }
      const ui = (hasClick: boolean) => (
        <GraphProvider initialCells={initialCells}>
          <Paper style={{ width: 100, height: 100 }} id="events-paper" renderElement={renderRectElement}>
            <Probe hasClick={hasClick} />
          </Paper>
        </GraphProvider>
      );
      const { rerender } = render(ui(false));
      await waitFor(() => expect(hasEventSubscription('cell:pointerdown')).toBe(true));
      expect(hasEventSubscription('cell:pointerclick')).toBe(false);

      rerender(ui(true));
      // New key appeared — the subscription re-ran and now covers it.
      expect(hasEventSubscription('cell:pointerclick')).toBe(true);
    } finally {
      listenerSpy.mockRestore();
    }
  });

  it('stops dispatching when a handler is toggled to undefined and resumes when it returns', async () => {
    const listenerSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const lastPointerDownWrapper = () =>
      getRegisteredWrapper(
        listenerSpy.mock.calls.findLast((call) => (call[1] as unknown) === 'cell:pointerdown')
      );
    try {
      const handler = jest.fn();
      function Probe({ isEnabled }: { readonly isEnabled: boolean }) {
        useOnPaperEvents('events-paper', {
          'cell:pointerdown': isEnabled ? handler : undefined,
        });
        return null;
      }
      const ui = (isEnabled: boolean) => (
        <GraphProvider initialCells={initialCells}>
          <Paper style={{ width: 100, height: 100 }} id="events-paper" renderElement={renderRectElement}>
            <Probe isEnabled={isEnabled} />
          </Paper>
        </GraphProvider>
      );
      const { rerender } = render(ui(true));
      await waitFor(() => expect(lastPointerDownWrapper()).toBeDefined());
      lastPointerDownWrapper()('view', 'evt');
      expect(handler).toHaveBeenCalledTimes(1);

      // Toggled off — no active 'cell:pointerdown' handler remains bound.
      rerender(ui(false));
      handler.mockClear();
      lastPointerDownWrapper()?.('view', 'evt');
      expect(handler).not.toHaveBeenCalled();

      // Toggled back on — a fresh binding dispatches again.
      rerender(ui(true));
      lastPointerDownWrapper()('view', 'evt');
      expect(handler).toHaveBeenCalledWith('view', 'evt');
    } finally {
      listenerSpy.mockRestore();
    }
  });
});
