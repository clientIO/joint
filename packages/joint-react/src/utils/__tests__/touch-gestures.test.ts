import {
  isMultiTouchEvent,
  TouchGestureRecognizer,
  type TouchGestureEvent,
  type TouchGestureOptions,
  type TouchGestureUpdate,
  type TouchPointLike,
} from '../touch-gestures';

function touch(clientX: number, clientY: number, target: EventTarget | null = null): TouchPointLike {
  return { clientX, clientY, target };
}

interface MockTouchEvent extends TouchGestureEvent {
  readonly preventDefault: jest.Mock;
}

function touchEvent(type: string, touches: readonly TouchPointLike[]): MockTouchEvent {
  return {
    type,
    touches,
    preventDefault: jest.fn(),
  };
}

/** Deterministic scheduler: flushes run only when the test invokes them. */
function createManualScheduler() {
  const queue: Array<() => void> = [];
  const cancel = jest.fn();
  const schedule = jest.fn((flush: () => void) => {
    queue.push(flush);
    return cancel;
  });
  const runNext = () => {
    const flush = queue.shift();
    if (!flush) throw new Error('No scheduled flush to run.');
    flush();
  };
  return { schedule, runNext, cancel, queue };
}

function createRecognizer(overrides: Partial<TouchGestureOptions> = {}) {
  const scheduler = createManualScheduler();
  const onGestureStart = jest.fn();
  const onGestureUpdate = jest.fn();
  const onGestureEnd = jest.fn();
  const recognizer = new TouchGestureRecognizer({
    onGestureStart,
    onGestureUpdate,
    onGestureEnd,
    schedule: scheduler.schedule,
    ...overrides,
  });
  return { recognizer, scheduler, onGestureStart, onGestureUpdate, onGestureEnd };
}

function lastUpdate(onGestureUpdate: jest.Mock): TouchGestureUpdate {
  return onGestureUpdate.mock.calls.at(-1)![0] as TouchGestureUpdate;
}

describe('TouchGestureRecognizer', () => {
  it('starts a gesture on the second finger and consumes the event', () => {
    const { recognizer, onGestureStart } = createRecognizer();
    const start = touchEvent('touchstart', [touch(0, 0), touch(100, 0)]);
    recognizer.handleTouchStart(start);

    expect(onGestureStart).toHaveBeenCalledTimes(1);
    expect(onGestureStart).toHaveBeenCalledWith(start, { x: 50, y: 0 });
    expect(start.preventDefault).toHaveBeenCalled();
  });

  it('ignores single-finger touches entirely', () => {
    const { recognizer, onGestureStart, onGestureUpdate } = createRecognizer();
    const start = touchEvent('touchstart', [touch(0, 0)]);
    recognizer.handleTouchStart(start);
    const move = touchEvent('touchmove', [touch(10, 10)]);
    recognizer.handleTouchMove(move);

    expect(onGestureStart).not.toHaveBeenCalled();
    expect(onGestureUpdate).not.toHaveBeenCalled();
    expect(start.preventDefault).not.toHaveBeenCalled();
    expect(move.preventDefault).not.toHaveBeenCalled();
  });

  it('respects the shouldSkipGesture veto without consuming the event', () => {
    const shouldSkipGesture = jest.fn(() => true);
    const { recognizer, onGestureStart } = createRecognizer({ shouldSkipGesture });
    const touches = [touch(0, 0), touch(100, 0)];
    const start = touchEvent('touchstart', touches);
    recognizer.handleTouchStart(start);

    expect(shouldSkipGesture).toHaveBeenCalledWith(touches);
    expect(onGestureStart).not.toHaveBeenCalled();
    expect(start.preventDefault).not.toHaveBeenCalled();
  });

  it('counts only eligible touches', () => {
    const outside = document.createElement('div');
    const { recognizer, onGestureStart } = createRecognizer({
      isEligibleTouch: (point) => point.target !== outside,
    });
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0, outside)]));

    expect(onGestureStart).not.toHaveBeenCalled();
  });

  it('emits a coalesced pinch sample with relative scale and midpoint', () => {
    const { recognizer, scheduler, onGestureUpdate } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    const move = touchEvent('touchmove', [touch(0, 0), touch(200, 0)]);
    recognizer.handleTouchMove(move);

    expect(onGestureUpdate).not.toHaveBeenCalled(); // coalesced until the frame flush
    scheduler.runNext();

    expect(onGestureUpdate).toHaveBeenCalledTimes(1);
    expect(lastUpdate(onGestureUpdate)).toEqual({
      event: move,
      // Distance grew 100 → 200, midpoint moved (50,0) → (100,0).
      scale: 2,
      clientX: 100,
      clientY: 0,
      deltaX: -50,
      deltaY: 0,
    });
    expect(move.preventDefault).toHaveBeenCalled();
  });

  it('folds multiple moves into a single sample per flush', () => {
    const { recognizer, scheduler, onGestureUpdate } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(0, 0), touch(200, 0)]));
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(10, 0), touch(110, 0)]));
    scheduler.runNext();

    expect(onGestureUpdate).toHaveBeenCalledTimes(1);
    const update = lastUpdate(onGestureUpdate);
    // Ratios multiply: (200/100) * (100/200) = 1; midpoint 50 → 100 → 60.
    expect(update.scale).toBe(1);
    expect(update.deltaX).toBe(-10);
    expect(update.clientX).toBe(60);
    // Only one flush was scheduled for both moves.
    expect(scheduler.schedule).toHaveBeenCalledTimes(1);
  });

  it('emits pan-only samples with wheel sign convention', () => {
    const { recognizer, scheduler, onGestureUpdate } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    // Both fingers move down-right by (10, 20): content follows the fingers,
    // which in wheel convention is a negative delta.
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(10, 20), touch(110, 20)]));
    scheduler.runNext();

    const update = lastUpdate(onGestureUpdate);
    expect(update.scale).toBe(1);
    expect(update.deltaX).toBe(-10);
    expect(update.deltaY).toBe(-20);
  });

  it('does not emit when nothing changed', () => {
    const { recognizer, scheduler, onGestureUpdate } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(0, 0), touch(100, 0)]));
    scheduler.runNext();

    expect(onGestureUpdate).not.toHaveBeenCalled();
  });

  it('guards against a zero-distance baseline', () => {
    const { recognizer, scheduler, onGestureUpdate } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(50, 50), touch(50, 50)]));
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(0, 0), touch(100, 0)]));
    scheduler.runNext();

    const update = lastUpdate(onGestureUpdate);
    expect(update.scale).toBe(1); // no ratio from a 0 baseline — not Infinity
    expect(Number.isFinite(update.deltaX)).toBe(true);
  });

  it('flushes pending sample and ends the gesture when dropping below two fingers', () => {
    const { recognizer, scheduler, onGestureUpdate, onGestureEnd } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(0, 0), touch(300, 0)]));
    const end = touchEvent('touchend', [touch(0, 0)]);
    recognizer.handleTouchEnd(end);

    // Pending sample delivered synchronously on gesture end, before onGestureEnd.
    expect(onGestureUpdate).toHaveBeenCalledTimes(1);
    expect(lastUpdate(onGestureUpdate).scale).toBe(3);
    expect(onGestureEnd).toHaveBeenCalledTimes(1);
    expect(end.preventDefault).toHaveBeenCalled();
    // The already-scheduled flush later becomes a no-op.
    expect(() => scheduler.runNext()).not.toThrow();
    expect(onGestureUpdate).toHaveBeenCalledTimes(1);
  });

  it('drains the leftover finger: consumes its events without emitting', () => {
    const { recognizer, onGestureUpdate, onGestureEnd } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    recognizer.handleTouchEnd(touchEvent('touchend', [touch(0, 0)]));
    expect(onGestureEnd).toHaveBeenCalledTimes(1);

    const drainMove = touchEvent('touchmove', [touch(30, 30)]);
    recognizer.handleTouchMove(drainMove);
    expect(drainMove.preventDefault).toHaveBeenCalled();
    expect(onGestureUpdate).not.toHaveBeenCalled();

    // Last finger lifts → idle again; a fresh gesture can start.
    recognizer.handleTouchEnd(touchEvent('touchend', []));
    const restart = touchEvent('touchstart', [touch(0, 0), touch(50, 0)]);
    recognizer.handleTouchStart(restart);
    expect(restart.preventDefault).toHaveBeenCalled();
  });

  it('returns to idle directly when both fingers lift at once', () => {
    const { recognizer, onGestureEnd } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    recognizer.handleTouchEnd(touchEvent('touchcancel', []));
    expect(onGestureEnd).toHaveBeenCalledTimes(1);

    // Next single-finger touch flows through untouched — recognizer is idle.
    const single = touchEvent('touchstart', [touch(5, 5)]);
    recognizer.handleTouchStart(single);
    expect(single.preventDefault).not.toHaveBeenCalled();
  });

  it('swallows a third finger and re-baselines when it lifts', () => {
    const { recognizer, scheduler, onGestureUpdate, onGestureEnd } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    const third = touchEvent('touchstart', [touch(0, 0), touch(100, 0), touch(500, 500)]);
    recognizer.handleTouchStart(third);
    expect(third.preventDefault).toHaveBeenCalled();

    // The third finger lifts — tracked pair unchanged, no jump emitted.
    recognizer.handleTouchEnd(touchEvent('touchend', [touch(0, 0), touch(100, 0)]));
    expect(onGestureEnd).not.toHaveBeenCalled();

    // Gesture continues from the re-baselined pair.
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(0, 0), touch(150, 0)]));
    scheduler.runNext();
    expect(lastUpdate(onGestureUpdate).scale).toBe(1.5);
  });

  it('dispose cancels a scheduled flush', () => {
    const { recognizer, scheduler, onGestureUpdate } = createRecognizer();
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    recognizer.handleTouchMove(touchEvent('touchmove', [touch(0, 0), touch(200, 0)]));
    recognizer.dispose();

    expect(scheduler.cancel).toHaveBeenCalled();
    scheduler.runNext(); // the stale flush delivers nothing
    expect(onGestureUpdate).not.toHaveBeenCalled();
  });
});

describe('isMultiTouchEvent', () => {
  it('detects multi-touch touchstart / touchmove via the native touches list', () => {
    expect(isMultiTouchEvent({ type: 'touchstart', originalEvent: { touches: [1, 2] } })).toBe(
      true
    );
    expect(isMultiTouchEvent({ type: 'touchmove', originalEvent: { touches: [1, 2, 3] } })).toBe(
      true
    );
  });

  it('rejects single-touch and non-touch events', () => {
    expect(isMultiTouchEvent({ type: 'touchstart', originalEvent: { touches: [1] } })).toBe(false);
    expect(isMultiTouchEvent({ type: 'pointermove', originalEvent: { touches: [1, 2] } })).toBe(
      false
    );
    expect(isMultiTouchEvent({ type: 'touchmove' })).toBe(false);
  });
});

describe('TouchGestureRecognizer.isActive', () => {
  it('covers the whole gesture including the draining phase', () => {
    const scheduler = createManualScheduler();
    const recognizer = new TouchGestureRecognizer({
      onGestureStart: jest.fn(),
      onGestureUpdate: jest.fn(),
      schedule: scheduler.schedule,
    });
    expect(recognizer.isActive()).toBe(false);
    recognizer.handleTouchStart(touchEvent('touchstart', [touch(0, 0), touch(100, 0)]));
    expect(recognizer.isActive()).toBe(true);
    recognizer.handleTouchEnd(touchEvent('touchend', [touch(0, 0)]));
    expect(recognizer.isActive()).toBe(true); // draining still owns the sequence
    recognizer.handleTouchEnd(touchEvent('touchend', []));
    expect(recognizer.isActive()).toBe(false);
  });
});
