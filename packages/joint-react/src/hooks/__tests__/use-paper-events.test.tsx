/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { mvc, type dia } from '@joint/core';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import {
  StrictMode,
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { GraphProvider, Paper } from '../../components';
import { usePaperEvents } from '../use-paper-events';
import { usePaper } from '../use-paper';
import type { EventMap, PaperEventHandlers, PaperEventType } from '../../types/event.types';
import { PAPER_ELEMENTS_MEASURED } from '../../types/event.types';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createGraphWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
      {children}
    </GraphProvider>
  );
}

const CELL_VIEW = {} as dia.CellView;
const ELEMENT_VIEW = {} as dia.ElementView;
const LINK_VIEW = {} as dia.LinkView;
const JOINT_EVENT = { type: 'pointerevent' } as dia.Event;
const SVG_NODE = {} as SVGElement;
const HIGHLIGHT_OPTIONS = {} as dia.CellView.EventHighlightOptions;
const HIGHLIGHTER = {} as dia.HighlighterView;
const LINK_END = 'target' as dia.LinkEnd;
const UPDATE_STATS = {} as dia.Paper.UpdateStats;
const IDLE_OPTIONS = {} as dia.Paper.UpdateViewsAsyncOptions;
const MATRIX = {} as SVGMatrix;
const PAPER = {} as dia.Paper;
const GRAPH = {} as dia.Graph;

const PAPER_EVENT_ARGS: {
  readonly [EventName in PaperEventType]: Parameters<EventMap[EventName]>;
} = {
  'paper:mouseenter': [JOINT_EVENT],
  'paper:mouseleave': [JOINT_EVENT],
  'cell:pointerclick': [CELL_VIEW, JOINT_EVENT, 10, 20],
  'element:pointerclick': [ELEMENT_VIEW, JOINT_EVENT, 10, 20],
  'link:pointerclick': [LINK_VIEW, JOINT_EVENT, 10, 20],
  'blank:pointerclick': [JOINT_EVENT, 10, 20],
  'cell:pointerdblclick': [CELL_VIEW, JOINT_EVENT, 10, 20],
  'element:pointerdblclick': [ELEMENT_VIEW, JOINT_EVENT, 10, 20],
  'link:pointerdblclick': [LINK_VIEW, JOINT_EVENT, 10, 20],
  'blank:pointerdblclick': [JOINT_EVENT, 10, 20],
  'cell:contextmenu': [CELL_VIEW, JOINT_EVENT, 10, 20],
  'element:contextmenu': [ELEMENT_VIEW, JOINT_EVENT, 10, 20],
  'link:contextmenu': [LINK_VIEW, JOINT_EVENT, 10, 20],
  'blank:contextmenu': [JOINT_EVENT, 10, 20],
  'cell:pointerdown': [CELL_VIEW, JOINT_EVENT, 10, 20],
  'element:pointerdown': [ELEMENT_VIEW, JOINT_EVENT, 10, 20],
  'link:pointerdown': [LINK_VIEW, JOINT_EVENT, 10, 20],
  'blank:pointerdown': [JOINT_EVENT, 10, 20],
  'cell:pointermove': [CELL_VIEW, JOINT_EVENT, 10, 20],
  'element:pointermove': [ELEMENT_VIEW, JOINT_EVENT, 10, 20],
  'link:pointermove': [LINK_VIEW, JOINT_EVENT, 10, 20],
  'blank:pointermove': [JOINT_EVENT, 10, 20],
  'cell:pointerup': [CELL_VIEW, JOINT_EVENT, 10, 20],
  'element:pointerup': [ELEMENT_VIEW, JOINT_EVENT, 10, 20],
  'link:pointerup': [LINK_VIEW, JOINT_EVENT, 10, 20],
  'blank:pointerup': [JOINT_EVENT, 10, 20],
  'cell:mouseover': [CELL_VIEW, JOINT_EVENT],
  'element:mouseover': [ELEMENT_VIEW, JOINT_EVENT],
  'link:mouseover': [LINK_VIEW, JOINT_EVENT],
  'blank:mouseover': [JOINT_EVENT],
  'cell:mouseout': [CELL_VIEW, JOINT_EVENT],
  'element:mouseout': [ELEMENT_VIEW, JOINT_EVENT],
  'link:mouseout': [LINK_VIEW, JOINT_EVENT],
  'blank:mouseout': [JOINT_EVENT],
  'cell:mouseenter': [CELL_VIEW, JOINT_EVENT],
  'element:mouseenter': [ELEMENT_VIEW, JOINT_EVENT],
  'link:mouseenter': [LINK_VIEW, JOINT_EVENT],
  'blank:mouseenter': [JOINT_EVENT],
  'cell:mouseleave': [CELL_VIEW, JOINT_EVENT],
  'element:mouseleave': [ELEMENT_VIEW, JOINT_EVENT],
  'link:mouseleave': [LINK_VIEW, JOINT_EVENT],
  'blank:mouseleave': [JOINT_EVENT],
  'cell:mousewheel': [CELL_VIEW, JOINT_EVENT, 10, 20, 1],
  'element:mousewheel': [ELEMENT_VIEW, JOINT_EVENT, 10, 20, 1],
  'link:mousewheel': [LINK_VIEW, JOINT_EVENT, 10, 20, 1],
  'blank:mousewheel': [JOINT_EVENT, 10, 20, 1],
  'paper:pan': [JOINT_EVENT, 10, 20],
  'paper:pinch': [JOINT_EVENT, 10, 20, 2],
  'element:magnet:pointerclick': [ELEMENT_VIEW, JOINT_EVENT, SVG_NODE, 10, 20],
  'element:magnet:pointerdblclick': [ELEMENT_VIEW, JOINT_EVENT, SVG_NODE, 10, 20],
  'element:magnet:contextmenu': [ELEMENT_VIEW, JOINT_EVENT, SVG_NODE, 10, 20],
  'cell:highlight': [CELL_VIEW, SVG_NODE, HIGHLIGHT_OPTIONS],
  'cell:unhighlight': [CELL_VIEW, SVG_NODE, HIGHLIGHT_OPTIONS],
  'cell:highlight:invalid': [CELL_VIEW, 'highlighter-id', HIGHLIGHTER],
  'link:connect': [LINK_VIEW, JOINT_EVENT, CELL_VIEW, SVG_NODE, LINK_END],
  'link:disconnect': [LINK_VIEW, JOINT_EVENT, CELL_VIEW, SVG_NODE, LINK_END],
  'link:snap:connect': [LINK_VIEW, JOINT_EVENT, CELL_VIEW, SVG_NODE, LINK_END],
  'link:snap:disconnect': [LINK_VIEW, JOINT_EVENT, CELL_VIEW, SVG_NODE, LINK_END],
  'render:done': [UPDATE_STATS, { source: 'render-done' }],
  'render:idle': [IDLE_OPTIONS],
  [PAPER_ELEMENTS_MEASURED]: [{ isInitial: true, paper: PAPER, graph: GRAPH }],
  translate: [10, 20, { source: 'translate' }],
  scale: [2, 2, { source: 'scale' }],
  resize: [100, 200, { source: 'resize' }],
  transform: [MATRIX, { source: 'transform' }],
};

function createPaperWrapper(paperId: string, ref?: RefObject<dia.Paper | null>) {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
      <Paper id={paperId} ref={ref} width={100} height={100} renderElement={renderTestElement}>
        {children}
      </Paper>
    </GraphProvider>
  );
}

function UsePaperEventsWithPaperIdPattern(
  properties: Readonly<{
    paperHolder: { current: dia.Paper | null };
    onCustomEvent: (...args: unknown[]) => void;
  }>
) {
  const { paperHolder, onCustomEvent } = properties;
  const paperId = useId();
  const handlePaperRef = useCallback(
    (paper: dia.Paper | null) => {
      paperHolder.current = paper;
    },
    [paperHolder]
  );

  usePaperEvents(paperId, {
    'element:pointerclick': (elementView, event, x, y) => {
      elementView.paper?.trigger('paper:test:custom', elementView, event, x, y);
    },
    'paper:test:custom': onCustomEvent,
  });

  return (
    <Paper
      id={paperId}
      ref={handlePaperRef}
      width={100}
      height={100}
      renderElement={renderTestElement}
    />
  );
}

describe('use-paper-events', () => {
  it('binds all supported paper events with raw JointJS arguments and supports custom events', async () => {
    const wrapper = createPaperWrapper('paper-context');
    const handlers: PaperEventHandlers = {};
    const listenerHandlers = new Map<
      string,
      Array<(...args: Parameters<mvc.EventHandler>) => void>
    >();
    const listenToSpy = jest
      .spyOn(mvc.Listener.prototype, 'listenTo')
      .mockImplementation((...args: unknown[]) => {
        const [, eventNameOrHash, callback] = args;
        if (typeof eventNameOrHash === 'string' && typeof callback === 'function') {
          const callbacks = listenerHandlers.get(eventNameOrHash) ?? [];
          callbacks.push(callback as (...args: Parameters<mvc.EventHandler>) => void);
          listenerHandlers.set(eventNameOrHash, callbacks);
        }
      });
    const stopListeningSpy = jest.spyOn(mvc.Listener.prototype, 'stopListening');

    for (const eventName of Object.keys(PAPER_EVENT_ARGS)) {
      handlers[eventName] = jest.fn();
    }

    const onCustomEvent = jest.fn();
    handlers['paper:test:custom'] = onCustomEvent;

    try {
      const { result } = renderHook(
        () => {
          const paper = usePaper();
          usePaperEvents(handlers);
          return paper;
        },
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      for (const [eventName, args] of Object.entries(PAPER_EVENT_ARGS) as Array<
        [PaperEventType, Parameters<EventMap[PaperEventType]>]
      >) {
        const callbacks = listenerHandlers.get(eventName) ?? [];
        expect(callbacks.length).toBeGreaterThan(0);

        act(() => {
          for (const callback of callbacks) {
            callback(...(args as Parameters<mvc.EventHandler>));
          }
        });
        expect(handlers[eventName]).toHaveBeenCalled();
        expect(handlers[eventName]).toHaveBeenLastCalledWith(...args);
      }

      const customHandlers = listenerHandlers.get('paper:test:custom') ?? [];
      expect(customHandlers.length).toBeGreaterThan(0);
      act(() => {
        for (const callback of customHandlers) {
          callback(1, 2, 3);
        }
      });

      expect(onCustomEvent).toHaveBeenCalled();
      expect(onCustomEvent).toHaveBeenLastCalledWith(1, 2, 3);
      expect(listenToSpy).toHaveBeenCalled();
    } finally {
      listenToSpy.mockRestore();
      stopListeningSpy.mockRestore();
    }
  });

  it('supports paper id target overload', async () => {
    const wrapper = createPaperWrapper('paper-by-id');
    const onContextMenu = jest.fn();

    const { result } = renderHook(
      () => {
        const paper = usePaper('paper-by-id');
        usePaperEvents('paper-by-id', { 'element:contextmenu': onContextMenu });
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current?.trigger('element:contextmenu', ELEMENT_VIEW, JOINT_EVENT, 30, 50);
    });

    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledWith(ELEMENT_VIEW, JOINT_EVENT, 30, 50);
  });

  it('supports paper ref target overload and binds when ref becomes available', async () => {
    const paperRef: RefObject<dia.Paper | null> = { current: null };
    const wrapper = createPaperWrapper('paper-ref', paperRef);
    const onScale = jest.fn();

    renderHook(
      () => {
        usePaperEvents(paperRef, { scale: onScale });
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(paperRef.current).toBeDefined();
    });

    act(() => {
      paperRef.current?.trigger('scale', 3, 4, { source: 'ref' });
    });

    expect(onScale).toHaveBeenCalledTimes(1);
    expect(onScale).toHaveBeenCalledWith(3, 4, { source: 'ref' });
  });

  it('supports paper ref target overload when ref current can be undefined', () => {
    const paperRef: RefObject<dia.Paper | null | undefined> = { current: undefined };
    const wrapper = createGraphWrapper();

    expect(() => {
      renderHook(
        () => {
          usePaperEvents(paperRef, { scale: jest.fn() });
        },
        { wrapper }
      );
    }).not.toThrow();
  });

  it('supports direct paper target overload when paper comes from usePaper(id)', async () => {
    const wrapper = createPaperWrapper('paper-direct');
    const onScale = jest.fn();

    const { result } = renderHook(
      () => {
        const paper = usePaper('paper-direct');
        usePaperEvents(paper, { scale: onScale });
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current?.trigger('scale', 5, 6, { source: 'paper-direct' });
    });

    expect(onScale).toHaveBeenCalledTimes(1);
    expect(onScale).toHaveBeenCalledWith(5, 6, { source: 'paper-direct' });
  });

  it('provides non-null paper ref in mount effect when using usePaperEvents in the same component', async () => {
    const capturePaperRefInEffect = jest.fn();

    function PaperWithEventsAndEffect() {
      const paperRef = useRef<dia.Paper | null>(null);

      usePaperEvents(
        paperRef,
        {
          'element:pointermove': jest.fn(),
          'element:pointerup': jest.fn(),
        },
        []
      );

      useEffect(() => {
        capturePaperRefInEffect(paperRef.current);
      }, []);

      return <Paper ref={paperRef} width={100} height={100} renderElement={renderTestElement} />;
    }

    render(
      <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
        <PaperWithEventsAndEffect />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(capturePaperRefInEffect).toHaveBeenCalled();
    });

    expect(capturePaperRefInEffect.mock.calls.map(([paper]) => paper)).toEqual(
      expect.arrayContaining([expect.any(Object)])
    );
    expect(capturePaperRefInEffect.mock.calls.map(([paper]) => paper)).not.toContain(null);
  });

  it('provides non-null paper ref in mount effect in StrictMode when using usePaperEvents in the same component', async () => {
    const capturePaperRefInEffect = jest.fn();

    function PaperWithEventsAndEffect() {
      const paperRef = useRef<dia.Paper | null>(null);

      usePaperEvents(
        paperRef,
        {
          'element:pointermove': jest.fn(),
          'element:pointerup': jest.fn(),
        },
        []
      );

      useEffect(() => {
        capturePaperRefInEffect(paperRef.current);
      }, []);

      return <Paper ref={paperRef} width={100} height={100} renderElement={renderTestElement} />;
    }

    render(
      <StrictMode>
        <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
          <PaperWithEventsAndEffect />
        </GraphProvider>
      </StrictMode>
    );

    await waitFor(() => {
      expect(capturePaperRefInEffect).toHaveBeenCalled();
    });

    expect(capturePaperRefInEffect.mock.calls.map(([paper]) => paper)).toEqual(
      expect.arrayContaining([expect.any(Object)])
    );
    expect(capturePaperRefInEffect.mock.calls.map(([paper]) => paper)).not.toContain(null);
  });

  it('cleans up listeners on unmount', async () => {
    const wrapper = createPaperWrapper('paper-cleanup');
    const onResize = jest.fn();

    const { result, unmount } = renderHook(
      () => {
        const paper = usePaper();
        usePaperEvents({ resize: onResize });
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.trigger('resize', 100, 200, { source: 'before-unmount' });
    });
    const callsBeforeUnmount = onResize.mock.calls.length;
    expect(callsBeforeUnmount).toBeGreaterThan(0);

    unmount();

    act(() => {
      result.current.trigger('resize', 100, 200, { source: 'after-unmount' });
    });

    expect(onResize).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('throws when context target is used outside Paper', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = createGraphWrapper();

    expect(() => {
      renderHook(() => usePaperEvents({ translate: jest.fn() }), { wrapper });
    }).toThrow('usePaperEvents without a target must be used within a Paper.');

    consoleError.mockRestore();
  });

  it('supports the useId + paperId overload pattern used in stories', async () => {
    const onCustomEvent = jest.fn();
    const paperHolder = { current: null as dia.Paper | null };

    render(
      <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
        <UsePaperEventsWithPaperIdPattern onCustomEvent={onCustomEvent} paperHolder={paperHolder} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(paperHolder.current).not.toBeNull();
    });

    const elementViewWithPaper = {
      ...ELEMENT_VIEW,
      paper: paperHolder.current,
    } as dia.ElementView;

    act(() => {
      paperHolder.current?.trigger(
        'element:pointerclick',
        elementViewWithPaper,
        JOINT_EVENT,
        40,
        60
      );
    });

    expect(onCustomEvent).toHaveBeenCalledTimes(1);
    expect(onCustomEvent).toHaveBeenCalledWith(elementViewWithPaper, JOINT_EVENT, 40, 60);
  });

  it('catches elements:measured event via usePaperEvents', async () => {
    const wrapper = createPaperWrapper('paper-measured');
    const onMeasured = jest.fn();

    const { result } = renderHook(
      () => {
        const paper = usePaper('paper-measured');
        usePaperEvents('paper-measured', {
          [PAPER_ELEMENTS_MEASURED]: onMeasured,
        });
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current?.trigger(PAPER_ELEMENTS_MEASURED);
    });

    expect(onMeasured).toHaveBeenCalledTimes(1);
  });

});
