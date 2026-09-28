import { useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { GraphProvider, Paper } from '../../components';
import type { PaperProps } from '../../components/paper/paper.types';
import { usePaper } from '../../hooks/use-paper';
import type { PaperView } from '../../mvc/paper';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';
import { SCROLLABLE_ATTRIBUTE } from '../../utils/wheel-guard';

// Two-finger touch gestures on a `<Paper>`. joint-core owns the recognizer: the first
// finger's press (the paper events and the native `pointerdown` the node content sees)
// is withheld until the finger proves to be a press, a second finger starts a gesture
// that fires `paper:pinch` / `paper:pan` and nothing else, and a press already
// announced is cancelled without a click. These tests drive the whole pipeline through
// this preset (pointer-event document listeners, the click swallow, pointer capture,
// the scrollable-region guard) with a React `onPointerDown` inside `renderElement`.

const ELEMENT_ID = 'cell-1';
const PAPER_STYLE = { width: 400, height: 400 };

const initialCells: readonly CellRecord[] = [
  {
    id: ELEMENT_ID,
    type: ELEMENT_MODEL_TYPE,
    position: { x: 50, y: 50 },
    size: { width: 100, height: 100 },
  } as CellRecord,
];

beforeAll(() => {
  // jsdom has no layout, so it ships no `elementFromPoint`; joint-core reaches for it
  // while a drag is in flight (`CellView#getEventTarget`).
  document.elementFromPoint = () => null;
  // Nor pointer capture. The preset captures the pointer on the first drag move and
  // releases it when the drag ends or is cancelled.
  const captured = new Set<number>();
  Element.prototype.setPointerCapture = (pointerId: number) => {
    captured.add(pointerId);
  };
  Element.prototype.releasePointerCapture = (pointerId: number) => {
    captured.delete(pointerId);
  };
  Element.prototype.hasPointerCapture = (pointerId: number) => captured.has(pointerId);
});

interface TouchStub {
  readonly identifier: number;
  readonly target: Element;
  readonly clientX: number;
  readonly clientY: number;
}

interface Finger {
  readonly id: number;
  readonly target: Element;
  x: number;
  y: number;
  readonly primary: boolean;
}

/**
 * A touchscreen for jsdom, which constructs neither `PointerEvent` nor `Touch`: plain
 * events carrying the properties the paper reads, dispatched in the order a browser
 * uses — the pointer event, then the touch event with the touches of the whole screen.
 */
function createTouchScreen() {
  const active: Finger[] = [];

  function find(id: number): Finger {
    const finger = active.find((candidate) => candidate.id === id);
    if (!finger) throw new Error(`No finger ${id} on the screen.`);
    return finger;
  }

  function touchList(fingers: readonly Finger[]): TouchStub[] {
    return fingers.map(({ id, target, x, y }) => ({
      identifier: id,
      target,
      clientX: x,
      clientY: y,
    }));
  }

  function dispatchTouch(type: string, finger: Finger): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, {
      touches: touchList(active),
      changedTouches: touchList([finger]),
      clientX: finger.x,
      clientY: finger.y,
    });
    finger.target.dispatchEvent(event);
    return event;
  }

  function dispatchPointer(type: string, finger: Finger): Event {
    const event = new Event(type, { bubbles: true, cancelable: true, composed: true });
    Object.assign(event, {
      pointerType: 'touch',
      pointerId: finger.id,
      isPrimary: finger.primary,
      clientX: finger.x,
      clientY: finger.y,
      button: 0,
    });
    finger.target.dispatchEvent(event);
    return event;
  }

  return {
    down(id: number, target: Element, x: number, y: number) {
      const finger: Finger = { id, target, x, y, primary: active.length === 0 };
      active.push(finger);
      dispatchPointer('pointerdown', finger);
      return dispatchTouch('touchstart', finger);
    },
    move(id: number, x: number, y: number) {
      const finger = find(id);
      finger.x = x;
      finger.y = y;
      dispatchPointer('pointermove', finger);
      return dispatchTouch('touchmove', finger);
    },
    up(id: number) {
      const finger = find(id);
      dispatchPointer('pointerup', finger);
      active.splice(active.indexOf(finger), 1);
      return dispatchTouch('touchend', finger);
    },
    cancel(id: number) {
      const finger = find(id);
      dispatchPointer('pointercancel', finger);
      active.splice(active.indexOf(finger), 1);
      return dispatchTouch('touchcancel', finger);
    },
  };
}

let capturedPaper: PaperView | null = null;
let capturedNode: HTMLDivElement | null = null;
let capturedList: HTMLDivElement | null = null;

/** The handlers of the node's content, reassigned per test. */
const content = {
  onPointerDown: () => {},
  onPointerUp: () => {},
  onClick: () => {},
};

function Capture() {
  capturedPaper = usePaper().paper;
  return null;
}

/** Read through a call, so TypeScript does not narrow the captures to their reset value. */
function getCaptured() {
  return { paper: capturedPaper, node: capturedNode, list: capturedList };
}

/**
 * Fake only `setTimeout` / `clearTimeout`, the timers the press delay needs. Jest's
 * default set also fakes `queueMicrotask` and `requestAnimationFrame`, which the
 * graph store and the paper schedule their work with, and a flush left pending
 * behind fake timers never runs — the next test's node content would never render.
 */
function fakePressTimers(): void {
  jest.useFakeTimers({
    doNotFake: [
      'Date',
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
    ],
  });
}

function restoreRealTimers(): void {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
}

function NodeContent() {
  const nodeRef = useCallback((node: HTMLDivElement | null) => {
    capturedNode = node;
  }, []);
  const listRef = useCallback((node: HTMLDivElement | null) => {
    capturedList = node;
    if (!node) return;
    // jsdom runs no layout: give the list the overflow the guard looks for.
    Object.defineProperty(node, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(node, 'clientHeight', { value: 40, configurable: true });
  }, []);
  const onPointerDown = useCallback(() => content.onPointerDown(), []);
  const onPointerUp = useCallback(() => content.onPointerUp(), []);
  const onClick = useCallback(() => content.onClick(), []);
  return (
    <foreignObject width={100} height={100}>
      <div
        ref={nodeRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
        style={PAPER_STYLE}
      >
        <div ref={listRef} {...{ [SCROLLABLE_ATTRIBUTE]: '' }}>
          list
        </div>
      </div>
    </foreignObject>
  );
}

const renderElement = () => <NodeContent />;

interface Rendered {
  readonly paper: PaperView;
  readonly node: HTMLDivElement;
  readonly list: HTMLDivElement;
  readonly screen: ReturnType<typeof createTouchScreen>;
  readonly events: string[];
}

interface RenderOptions {
  /** Extra `<Paper>` props (event props are subscribed through the paper store). */
  readonly paperProps?: Partial<PaperProps>;
  /**
   * Subscribe to `paper:pinch` up front. The paper owns touch gestures only while a
   * listener consumes them; without one every touch keeps the immediate path.
   */
  readonly consume?: boolean;
}

async function renderTouchPaper({ paperProps, consume = true }: RenderOptions = {}): Promise<Rendered> {
  capturedPaper = null;
  capturedNode = null;
  capturedList = null;
  const events: string[] = [];
  content.onPointerDown = () => events.push('react:pointerdown');
  content.onPointerUp = () => events.push('react:pointerup');
  content.onClick = () => events.push('react:click');
  render(
    <GraphProvider initialCells={initialCells}>
      <Paper style={PAPER_STYLE} renderElement={renderElement} {...paperProps}>
        <Capture />
      </Paper>
    </GraphProvider>
  );
  await waitFor(() => expect(capturedNode).not.toBeNull());
  const { paper, node, list } = getCaptured();
  if (!paper || !node || !list) throw new Error('Paper did not render.');
  if (consume) paper.on('paper:pinch', () => {});
  for (const name of [
    'element:pointerdown',
    'element:pointermove',
    'element:pointerup',
    'element:pointerclick',
    'blank:pointerdown',
    'blank:pointerup',
    'blank:pointerclick',
  ]) {
    paper.on(name, (...args: unknown[]) => {
      const event = (name.startsWith('blank:') ? args[0] : args[1]) as dia.Event;
      events.push(`${name}:${event.type}`);
    });
  }
  return { paper, node, list, screen: createTouchScreen(), events };
}

describe('paper preset touch gestures', () => {
  it('announces a tap at the lift: the node content hears its pointerdown first', async () => {
    const { node, screen, events } = await renderTouchPaper();

    screen.down(1, node, 100, 100);
    expect(events).toEqual([]);

    screen.up(1);
    expect(events).toEqual([
      'react:pointerdown',
      'element:pointerdown:touchstart',
      'react:pointerup',
      'element:pointerup:pointerup',
      'element:pointerclick:click',
    ]);
  });

  it('starts a gesture on a quick second finger: no paper events, no React events', async () => {
    const { paper, node, screen, events } = await renderTouchPaper();
    const onPinch = jest.fn();
    paper.on('paper:pinch', onPinch);

    screen.down(1, node, 100, 100);
    const second = screen.down(2, node, 200, 100);
    expect(second.defaultPrevented).toBe(true);
    screen.move(1, 50, 100);
    screen.move(2, 250, 100);
    await waitFor(() => expect(onPinch).toHaveBeenCalledTimes(1));
    // 100 apart -> 200 apart.
    expect(onPinch.mock.calls[0][3]).toBe(2);
    screen.up(2);
    screen.up(1);

    expect(events).toEqual([]);
    expect(paper.model.hasActiveBatch('pointer')).toBe(false);
  });

  it('cancels a press already announced when the second finger lands, without a click', async () => {
    const { paper, node, screen, events } = await renderTouchPaper();
    paper.on('paper:pinch', jest.fn());
    fakePressTimers();
    try {
      screen.down(1, node, 100, 100);
      act(() => {
        jest.advanceTimersByTime(paper.TOUCH_PRESS_DELAY);
      });
      expect(events).toEqual(['react:pointerdown', 'element:pointerdown:touchstart']);
      expect(paper.model.hasActiveBatch('pointer')).toBe(true);

      screen.down(2, node, 200, 100);
      expect(events.slice(2)).toEqual(['element:pointerup:touchcancel']);
      expect(paper.model.hasActiveBatch('pointer')).toBe(false);

      screen.move(1, 90, 100);
      screen.move(2, 210, 100);
      screen.up(2);
      screen.up(1);
      // The delivered pointer still gets its pointerup; nothing clicks.
      expect(events.slice(3)).toEqual(['react:pointerup']);
    } finally {
      restoreRealTimers();
    }
  });

  it('cancels a drag in flight and releases the pointer capture', async () => {
    const { paper, node, screen, events } = await renderTouchPaper();
    const element = paper.model.getCell(ELEMENT_ID);
    if (!element?.isElement()) throw new Error('Element not found.');

    fakePressTimers();
    try {
      screen.down(1, node, 100, 100);
      act(() => {
        jest.advanceTimersByTime(paper.TOUCH_PRESS_DELAY);
      });
    } finally {
      restoreRealTimers();
    }
    expect(events).toEqual(['react:pointerdown', 'element:pointerdown:touchstart']);
    // The drag captures the pointer on its second move, once a pointer id is known.
    screen.move(1, 120, 100);
    screen.move(1, 125, 100);
    expect(events.at(-1)).toBe('element:pointermove:pointermove');
    expect(paper.el.classList.contains('jj-is-dragging')).toBe(true);
    expect(node.hasPointerCapture(1)).toBe(true);
    const origin = { x: 50, y: 50 };
    expect(element.position().toJSON()).not.toEqual(origin);

    screen.down(2, node, 200, 100);
    expect(events.at(-1)).toBe('element:pointerup:touchcancel');
    expect(paper.el.classList.contains('jj-is-dragging')).toBe(false);
    expect(node.hasPointerCapture(1)).toBe(false);

    screen.move(1, 150, 100);
    screen.move(2, 250, 100);
    screen.up(2);
    screen.up(1);
    // A pinch that began as a drag leaves the element where the finger picked it up.
    expect(element.position().toJSON()).toEqual(origin);
    expect(events.filter((name) => name.startsWith('element:pointerclick'))).toEqual([]);
  });

  it('leaves a touch on a scrollable region to the region', async () => {
    const { list, screen, events } = await renderTouchPaper();

    const start = screen.down(1, list, 100, 100);
    expect(start.defaultPrevented).toBe(false);
    // Delivered with the touchstart: the paper has no interest in the sequence.
    expect(events).toEqual(['react:pointerdown']);
    const second = screen.down(2, list, 200, 100);
    expect(second.defaultPrevented).toBe(false);
    screen.move(2, 250, 100);
    screen.up(2);
    screen.up(1);
    // Both fingers are the region's: delivered at once, nothing withheld.
    expect(events).toEqual([
      'react:pointerdown',
      'react:pointerdown',
      'react:pointerup',
      'react:pointerup',
    ]);
  });

  it('keeps the immediate path when no listener consumes gestures', async () => {
    const { paper, node, screen, events } = await renderTouchPaper({ consume: false });

    screen.down(1, node, 100, 100);
    expect(events).toEqual(['react:pointerdown', 'element:pointerdown:touchstart']);
    // The second finger is a press too, as before this feature.
    screen.down(2, node, 200, 100);
    expect(events).toEqual([
      'react:pointerdown',
      'element:pointerdown:touchstart',
      'react:pointerdown',
      'element:pointerdown:touchstart',
    ]);
    screen.up(2);
    screen.up(1);

    paper.on('paper:pinch', jest.fn());
    events.length = 0;
    screen.down(1, node, 100, 100);
    expect(screen.down(2, node, 200, 100).defaultPrevented).toBe(true);
    expect(screen.move(2, 220, 100).defaultPrevented).toBe(true);
    expect(screen.up(2).defaultPrevented).toBe(true);
    expect(screen.up(1).defaultPrevented).toBe(true);
    expect(events).toEqual([]);
  });

  it('keeps the onElementPointerDown prop silent during a pinch and feeds onPaperPinch', async () => {
    const onElementPointerDown = jest.fn();
    const onPaperPinch = jest.fn();
    const { node, screen } = await renderTouchPaper({
      consume: false,
      paperProps: { onElementPointerDown, onPaperPinch },
    });

    screen.down(1, node, 100, 100);
    expect(screen.down(2, node, 200, 100).defaultPrevented).toBe(true);
    screen.move(1, 50, 100);
    screen.move(2, 250, 100);
    await waitFor(() => expect(onPaperPinch).toHaveBeenCalledTimes(1));
    expect(onPaperPinch.mock.calls[0][0]).toMatchObject({ scale: 2 });
    expect(onPaperPinch.mock.calls[0][0].event.type).toBe('touchmove');
    screen.up(2);
    screen.up(1);
    expect(onElementPointerDown).not.toHaveBeenCalled();

    screen.down(1, node, 100, 100);
    screen.up(1);
    expect(onElementPointerDown).toHaveBeenCalledTimes(1);
  });

  it('releases the capture without a click when the browser cancels a drag', async () => {
    const { paper, node, screen, events } = await renderTouchPaper();

    fakePressTimers();
    try {
      screen.down(1, node, 100, 100);
      act(() => {
        jest.advanceTimersByTime(paper.TOUCH_PRESS_DELAY);
      });
    } finally {
      restoreRealTimers();
    }
    screen.move(1, 120, 100);
    screen.move(1, 125, 100);
    expect(node.hasPointerCapture(1)).toBe(true);

    screen.cancel(1);
    expect(events.at(-1)).toBe('element:pointerup:pointercancel');
    expect(events.filter((name) => name.startsWith('element:pointerclick'))).toEqual([]);
    expect(paper.el.classList.contains('jj-is-dragging')).toBe(false);
    expect(node.hasPointerCapture(1)).toBe(false);
  });

});
