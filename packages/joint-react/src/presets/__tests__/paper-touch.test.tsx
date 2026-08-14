/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, waitFor } from '@testing-library/react';
import type { CSSProperties } from 'react';
import type { dia } from '@joint/core';
import { GraphProvider } from '../../components';
import { Paper } from '../../components/paper/paper';
import type { CellRecord } from '../../types/cell.types';

const PAPER_STYLE: CSSProperties = { width: 400, height: 400 };

// Integration coverage for the touch-gesture layer wired in presets/paper.ts:
// real DOM dispatches on a rendered <Paper>, asserting the emitted
// `paper:pinch` / `paper:pan` events and the drag-cancel behavior. Geometry
// going through the mocked SVG CTM degenerates in jsdom, so local x/y args are
// not asserted — the scale ratio and pan deltas are pure client-space math.

beforeEach(() => {
  // jsdom does not implement elementFromPoint; core's `getEventTarget` calls
  // it for captured-pointer / touch events. `null` = nothing under the point.
  Object.defineProperty(document, 'elementFromPoint', {
    value: () => null,
    writable: true,
    configurable: true,
  });
});

const initialCells: readonly CellRecord[] = [
  {
    id: 'n1',
    type: 'element',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    data: {},
  },
];

interface TouchStub {
  readonly x: number;
  readonly y: number;
  readonly target?: Element;
}

function dispatchTouch(target: Element, type: string, touches: readonly TouchStub[]): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touchList = touches.map((touch) => ({
    clientX: touch.x,
    clientY: touch.y,
    target: touch.target ?? target,
  }));
  Object.assign(event, {
    touches: touchList,
    changedTouches: touchList,
    clientX: touches[0]?.x ?? 0,
    clientY: touches[0]?.y ?? 0,
  });
  target.dispatchEvent(event);
  return event;
}

async function renderTouchPaper() {
  const paperRef: { current: dia.Paper | null } = { current: null };
  const { container, unmount } = render(
    <GraphProvider initialCells={initialCells}>
      <Paper
        ref={(paper: dia.Paper | null) => {
          paperRef.current = paper;
        }}
        style={PAPER_STYLE}
      />
    </GraphProvider>
  );
  await waitFor(() => expect(container.querySelector('.joint-cell')).toBeTruthy());
  const paper = paperRef.current;
  if (!paper) throw new Error('Paper was not created.');
  const cellNode = container.querySelector('.joint-cell');
  if (!cellNode) throw new Error('Cell node not rendered.');
  return { paper, cellNode, container, unmount };
}

describe('paper preset touch gestures', () => {
  it('emits paper:pinch with the relative scale ratio for a two-finger pinch', async () => {
    const { paper, cellNode } = await renderTouchPaper();
    const onPinch = jest.fn();
    paper.on('paper:pinch', onPinch);

    const start = dispatchTouch(cellNode, 'touchstart', [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ]);
    // Gesture start is announced immediately with a scale-1 pinch and the
    // second finger's touchstart is consumed (no browser pinch-zoom).
    expect(onPinch).toHaveBeenCalledTimes(1);
    expect(onPinch.mock.calls[0][3]).toBe(1);
    expect(start.defaultPrevented).toBe(true);

    // Fingers spread 100 → 200 apart: relative scale ratio 2 after the
    // animation-frame flush.
    dispatchTouch(cellNode, 'touchmove', [
      { x: 50, y: 100 },
      { x: 250, y: 100 },
    ]);
    await waitFor(() => expect(onPinch).toHaveBeenCalledTimes(2));
    expect(onPinch.mock.calls[1][3]).toBe(2);
  });

  it('emits paper:pan with wheel-convention deltas for a two-finger pan', async () => {
    const { paper, cellNode } = await renderTouchPaper();
    const onPan = jest.fn();
    paper.on('paper:pan', onPan);
    // Subscribe pinch too so the built-in zoom yields (not under test here).
    paper.on('paper:pinch', jest.fn());

    dispatchTouch(cellNode, 'touchstart', [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ]);
    // Both fingers move right by 30 and down by 10 — content follows the
    // fingers, which in wheel convention is a negative delta.
    dispatchTouch(cellNode, 'touchmove', [
      { x: 130, y: 110 },
      { x: 230, y: 110 },
    ]);
    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(1));
    expect(onPan.mock.calls[0][1]).toBe(-30);
    expect(onPan.mock.calls[0][2]).toBe(-10);
  });

  it('stops an in-flight single-finger drag when the second finger lands, without a click', async () => {
    const { paper, cellNode } = await renderTouchPaper();
    const onCellPointerDown = jest.fn();
    const onBlankPointerUp = jest.fn();
    const onCellPointerClick = jest.fn();
    const onBlankPointerClick = jest.fn();
    paper.on('cell:pointerdown', onCellPointerDown);
    paper.on('blank:pointerup', onBlankPointerUp);
    paper.on('cell:pointerclick', onCellPointerClick);
    paper.on('blank:pointerclick', onBlankPointerClick);
    paper.on('paper:pinch', jest.fn());

    // Finger 1 starts a regular cell drag through core's touchstart pipeline.
    dispatchTouch(cellNode, 'touchstart', [{ x: 50, y: 50 }]);
    expect(onCellPointerDown).toHaveBeenCalledTimes(1);

    // Finger 2 promotes the sequence to a pinch. Core still processes its
    // touchstart (official pattern), and the gesture detector neutralizes it:
    // `preventDefaultInteraction` stops the new cell drag from starting and
    // `paper.pointerup` ends the single-pointer interaction (the finger-1
    // drag's document events undelegate).
    dispatchTouch(cellNode, 'touchstart', [
      { x: 50, y: 50 },
      { x: 150, y: 50 },
    ]);
    expect(onCellPointerDown).toHaveBeenCalledTimes(2); // official: finger 2 is seen, then neutralized
    expect(onBlankPointerUp).toHaveBeenCalledTimes(1); // the neutralizing pointerup
    // A two-finger press must not click / select the pressed cell.
    expect(onCellPointerClick).not.toHaveBeenCalled();
    expect(onBlankPointerClick).not.toHaveBeenCalled();
  });

  it('neutralizes the re-delegated drag on the first touch-driven pointermove', async () => {
    const { paper, cellNode } = await renderTouchPaper();
    const onCellPointerMove = jest.fn();
    const onCellPointerUp = jest.fn();
    const onCellPointerClick = jest.fn();
    paper.on('cell:pointermove', onCellPointerMove);
    paper.on('cell:pointerup', onCellPointerUp);
    paper.on('cell:pointerclick', onCellPointerClick);
    paper.on('paper:pinch', jest.fn());

    dispatchTouch(cellNode, 'touchstart', [{ x: 50, y: 50 }]);
    // Finger 2: core re-delegates drag events after the neutralization (it
    // runs inside `pointerdown`, before `delegateDragEvents`).
    dispatchTouch(cellNode, 'touchstart', [
      { x: 50, y: 50 },
      { x: 150, y: 50 },
    ]);

    // Drag moves arrive as pointer events under this preset. The first one is
    // caught by the pointermove leg of the detector and ends the drag — at
    // most one garbled move leaks (same as the official demo).
    const pointerMove = new Event('pointermove', { bubbles: true });
    Object.assign(pointerMove, { pointerType: 'touch', clientX: 60, clientY: 60 });
    document.dispatchEvent(pointerMove);
    expect(onCellPointerMove).toHaveBeenCalledTimes(1);
    expect(onCellPointerUp).toHaveBeenCalledTimes(1);
    // The neutralizing pointerup must not synthesize a click.
    expect(onCellPointerClick).not.toHaveBeenCalled();

    // The drag is gone — further moves reach nothing.
    document.dispatchEvent(pointerMove);
    expect(onCellPointerMove).toHaveBeenCalledTimes(1);
  });

  it('keeps single-finger touches on core untouched', async () => {
    const { paper, cellNode } = await renderTouchPaper();
    const onCellPointerDown = jest.fn();
    const onPinch = jest.fn();
    paper.on('cell:pointerdown', onCellPointerDown);
    paper.on('paper:pinch', onPinch);

    const start = dispatchTouch(cellNode, 'touchstart', [{ x: 50, y: 50 }]);
    expect(onCellPointerDown).toHaveBeenCalledTimes(1);
    expect(onPinch).not.toHaveBeenCalled();
    // Core's own preventDefault policy applies — the gesture layer didn't veto
    // propagation (the event reached core's delegated handler at all).
    expect(start.defaultPrevented).toBe(true); // preventDefaultViewAction default
  });

  it('leaves gestures on scrollable regions to the region', async () => {
    const { paper } = await renderTouchPaper();
    const onPinch = jest.fn();
    paper.on('paper:pinch', onPinch);

    // A scrollable list inside the paper (same opt-out the wheel guard uses).
    const scrollable = document.createElement('div');
    scrollable.dataset.jjScrollable = '';
    Object.defineProperty(scrollable, 'scrollHeight', { value: 500 });
    Object.defineProperty(scrollable, 'clientHeight', { value: 100 });
    paper.el.append(scrollable);

    const start = dispatchTouch(scrollable, 'touchstart', [
      { x: 10, y: 10 },
      { x: 40, y: 40 },
    ]);
    expect(onPinch).not.toHaveBeenCalled();
    expect(start.defaultPrevented).toBe(false); // the region keeps native scrolling
  });

  it('drains the remaining finger after the gesture ends (no phantom interactions)', async () => {
    const { paper, cellNode } = await renderTouchPaper();
    const onCellPointerDown = jest.fn();
    paper.on('cell:pointerdown', onCellPointerDown);
    paper.on('paper:pinch', jest.fn());

    // Both fingers land in a single touchstart: core sees one pointerdown
    // (official pattern) which the detector immediately neutralizes.
    dispatchTouch(cellNode, 'touchstart', [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ]);
    expect(onCellPointerDown).toHaveBeenCalledTimes(1);

    // One finger lifts — the gesture ends, the leftover finger drains: its
    // moves stay browser-prevented and start nothing on the paper.
    dispatchTouch(cellNode, 'touchend', [{ x: 100, y: 100 }]);
    const drainMove = dispatchTouch(cellNode, 'touchmove', [{ x: 120, y: 120 }]);
    expect(drainMove.defaultPrevented).toBe(true);
    expect(onCellPointerDown).toHaveBeenCalledTimes(1);

    // All fingers up — the next single-finger touch flows to core again.
    dispatchTouch(cellNode, 'touchend', []);
    dispatchTouch(cellNode, 'touchstart', [{ x: 50, y: 50 }]);
    expect(onCellPointerDown).toHaveBeenCalledTimes(2);
  });
});
