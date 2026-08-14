// Two-finger touch-gesture recognition for `dia.Paper` — turns real
// touchscreen pinch / two-finger-pan sequences into the same relative
// scale / wheel-convention pan values joint-core emits for touchpad
// (`ctrl`+wheel) gestures.
//
// Pure logic: no DOM listener wiring and no joint imports. The paper preset
// owns attaching it (capture-phase, non-passive listeners) and translating
// updates into `paper:pinch` / `paper:pan` events; this module owns the state
// machine and the math, so it is fully unit-testable in jsdom (which cannot
// construct real `TouchEvent`s).

/** Minimal structural view of a DOM `Touch` point. */
export interface TouchPointLike {
  readonly clientX: number;
  readonly clientY: number;
  readonly target: EventTarget | null;
}

/** Minimal structural view of a DOM `TouchEvent` as the recognizer consumes it. */
export interface TouchGestureEvent {
  readonly type: string;
  /** All touches currently on the screen (`TouchEvent.touches`). */
  readonly touches: ArrayLike<TouchPointLike> | Iterable<TouchPointLike>;
  readonly preventDefault: () => void;
}

/**
 * The official JointJS multi-touch predicate (as used by the JointJS+ touch
 * demo): a `touchstart` / `touchmove` whose native event reports more than one
 * active touch. Works on paper-delivered `dia.Event`s (which wrap the native
 * event as `originalEvent`).
 * @param event - A paper event (or any event-shaped object).
 * @param event.type - The DOM event type.
 * @param event.originalEvent - The wrapped native event, if any.
 * @returns `true` when the event belongs to a multi-touch sequence.
 * @group Utils
 */
export function isMultiTouchEvent(event: {
  readonly type?: string;
  readonly originalEvent?: unknown;
}): boolean {
  if (event.type !== 'touchstart' && event.type !== 'touchmove') return false;
  const touches = (event.originalEvent as { touches?: ArrayLike<unknown> } | undefined)?.touches;
  return !!touches && touches.length > 1;
}

/** One coalesced two-finger gesture sample (at most one per scheduled frame). */
export interface TouchGestureUpdate {
  /** The most recent raw touch event folded into this sample. */
  readonly event: TouchGestureEvent;
  /** Current gesture midpoint, client coordinates. */
  readonly clientX: number;
  /** Current gesture midpoint, client coordinates. */
  readonly clientY: number;
  /** Relative pinch ratio since the previous sample (`1` = no pinch). */
  readonly scale: number;
  /** Horizontal pan since the previous sample, wheel sign convention. */
  readonly deltaX: number;
  /** Vertical pan since the previous sample, wheel sign convention. */
  readonly deltaY: number;
}

/** Configuration for {@link TouchGestureRecognizer}. */
export interface TouchGestureOptions {
  /**
   * A two-finger gesture became active (fired once per gesture). Receives the
   * gesture midpoint in client coordinates alongside the raw event.
   */
  readonly onGestureStart: (event: TouchGestureEvent, midpoint: { x: number; y: number }) => void;
  /** A coalesced pinch / pan sample is ready. */
  readonly onGestureUpdate: (update: TouchGestureUpdate) => void;
  /** The gesture dropped below two fingers (fired once per gesture). */
  readonly onGestureEnd?: () => void;
  /**
   * Restrict which touches belong to the gesture — e.g. only touches whose
   * target sits inside the paper host. Defaults to accepting every touch.
   */
  readonly isEligibleTouch?: (touch: TouchPointLike) => boolean;
  /**
   * Veto a gesture before it starts — e.g. when a touch rests on a natively
   * scrollable region that should keep owning its touch input.
   */
  readonly shouldSkipGesture?: (touches: readonly TouchPointLike[]) => boolean;
  /**
   * Frame scheduler used to coalesce samples; returns a cancel function.
   * `requestAnimationFrame` by default, injectable for deterministic tests.
   */
  readonly schedule?: (flush: () => void) => () => void;
}

type GesturePhase = 'idle' | 'pinching' | 'draining';

interface PendingSample {
  scale: number;
  deltaX: number;
  deltaY: number;
  event: TouchGestureEvent;
}

function defaultSchedule(flush: () => void): () => void {
  const frameId = requestAnimationFrame(flush);
  return () => cancelAnimationFrame(frameId);
}

function getMidpoint(a: TouchPointLike, b: TouchPointLike): { x: number; y: number } {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function getDistance(a: TouchPointLike, b: TouchPointLike): number {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

/**
 * Recognizes two-finger pinch / pan gestures from a raw touch-event stream.
 *
 * State machine: `idle` → `pinching` (a second eligible finger lands) →
 * `draining` (below two fingers, leftover touches keep being prevented) →
 * `idle` (all fingers lifted). While not idle every touch event is
 * `preventDefault`ed so the browser never runs its own page pinch-zoom /
 * scroll — the recognizer's replacement for the `touch-action: none`
 * interact.js applies in the official JointJS touch demo (kept selective here
 * so `[data-jj-scrollable]` regions retain native touch scrolling). Events are
 * never stopped from propagating: the paper sees the full stream and
 * neutralizes its own single-pointer interactions the official way (see
 * `stopInteractionIfGestureDetected` in the paper preset).
 *
 * Samples are coalesced per scheduled frame: pinch ratios multiply and pan
 * deltas add up between flushes, so consumers do at most one (potentially
 * layout-heavy) transform per frame even on 120 Hz touch screens.
 * @internal
 */
export class TouchGestureRecognizer {
  private phase: GesturePhase = 'idle';
  private previousMidpoint = { x: 0, y: 0 };
  private previousDistance = 0;
  private pending: PendingSample | null = null;
  private cancelScheduledFlush: (() => void) | null = null;
  private readonly options: TouchGestureOptions;

  constructor(options: TouchGestureOptions) {
    this.options = options;
  }

  /** Feed a `touchstart`. Consumed (and possibly starts a gesture) unless idle single-touch. */
  handleTouchStart(event: TouchGestureEvent): void {
    if (this.phase !== 'idle') {
      // An extra finger joined mid-gesture (or while draining): swallow it so
      // the paper never starts a competing drag; keep tracking the first two.
      this.consume(event);
      return;
    }
    const touches = this.eligibleTouches(event);
    if (touches.length < 2) return;
    if (this.options.shouldSkipGesture?.(touches)) return;
    // Consume before anything else — preventing the second finger's
    // `touchstart` is what stops Safari from starting its page pinch-zoom.
    this.consume(event);
    this.phase = 'pinching';
    this.rebaseline(touches);
    this.options.onGestureStart(event, { ...this.previousMidpoint });
  }

  /** Feed a `touchmove`. Accumulates a sample while pinching; swallowed while draining. */
  handleTouchMove(event: TouchGestureEvent): void {
    if (this.phase === 'idle') return;
    this.consume(event);
    if (this.phase !== 'pinching') return;
    const touches = this.eligibleTouches(event);
    if (touches.length < 2) return; // stale move racing a touchend
    const [first, second] = touches;
    const midpoint = getMidpoint(first, second);
    const distance = getDistance(first, second);
    // Guard against a zero baseline (both fingers on the same point).
    const ratio = this.previousDistance > 0 ? distance / this.previousDistance : 1;
    const pending = this.pending ?? { scale: 1, deltaX: 0, deltaY: 0, event };
    pending.scale *= ratio;
    pending.deltaX += this.previousMidpoint.x - midpoint.x;
    pending.deltaY += this.previousMidpoint.y - midpoint.y;
    pending.event = event;
    this.pending = pending;
    this.previousMidpoint = midpoint;
    this.previousDistance = distance;
    this.scheduleFlush();
  }

  /** Feed a `touchend` or `touchcancel`. Ends / drains the gesture as fingers lift. */
  handleTouchEnd(event: TouchGestureEvent): void {
    if (this.phase === 'idle') return;
    this.consume(event);
    const touches = this.eligibleTouches(event);
    if (this.phase === 'pinching') {
      if (touches.length >= 2) {
        // A non-tracked (third) finger lifted — re-baseline so the next move
        // doesn't read a distance jump between different finger pairs.
        this.rebaseline(touches);
        return;
      }
      this.flush();
      this.options.onGestureEnd?.();
      this.phase = touches.length > 0 ? 'draining' : 'idle';
      return;
    }
    if (touches.length === 0) this.phase = 'idle';
  }

  /** Whether a two-finger gesture is in progress (pinching or draining). */
  isActive(): boolean {
    return this.phase !== 'idle';
  }

  /** Cancel any scheduled flush and reset to idle. */
  dispose(): void {
    this.cancelScheduledFlush?.();
    this.cancelScheduledFlush = null;
    this.pending = null;
    this.phase = 'idle';
  }

  private consume(event: TouchGestureEvent): void {
    event.preventDefault();
  }

  private eligibleTouches(event: TouchGestureEvent): TouchPointLike[] {
    // `TouchList` is only array-like in some environments — `Array.from`
    // handles both array-likes and iterables, a spread would need the latter.
    // eslint-disable-next-line unicorn/prefer-spread
    const touches = Array.from(event.touches);
    const { isEligibleTouch } = this.options;
    return isEligibleTouch ? touches.filter((touch) => isEligibleTouch(touch)) : touches;
  }

  private rebaseline(touches: readonly TouchPointLike[]): void {
    const [first, second] = touches;
    this.previousMidpoint = getMidpoint(first, second);
    this.previousDistance = getDistance(first, second);
  }

  private scheduleFlush(): void {
    if (this.cancelScheduledFlush) return;
    const schedule = this.options.schedule ?? defaultSchedule;
    this.cancelScheduledFlush = schedule(() => {
      this.cancelScheduledFlush = null;
      this.flush();
    });
  }

  private flush(): void {
    this.cancelScheduledFlush?.();
    this.cancelScheduledFlush = null;
    const sample = this.pending;
    this.pending = null;
    if (!sample) return;
    const { scale, deltaX, deltaY, event } = sample;
    if (scale === 1 && deltaX === 0 && deltaY === 0) return;
    this.options.onGestureUpdate({
      event,
      clientX: this.previousMidpoint.x,
      clientY: this.previousMidpoint.y,
      scale,
      deltaX,
      deltaY,
    });
  }
}
