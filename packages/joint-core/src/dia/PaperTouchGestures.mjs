import { nextFrame, cancelFrame, normalizeEvent } from '../util/index.mjs';
import { config } from '../config/index.mjs';
import $ from '../mvc/Dom/index.mjs';

const PHASE_IDLE = 'idle';
const PHASE_PENDING = 'pending';
const PHASE_POINTER = 'pointer';
const PHASE_GESTURE = 'gesture';

// Capture phase, so the paper sees a touch before the content under the finger does,
// and non-passive, so the browser's own pinch-zoom / scroll can be prevented.
const LISTENER_OPTIONS = { capture: true, passive: false };
// Always bound: the first finger must be seen before the content under it is. Every paper
// pays for the pair, even one that consumes no gesture - both handlers leave immediately
// there. Binding them only once a listener appears would need an `on()` override on the
// paper, which is not worth it for two listeners.
const EVENT_TYPES = ['pointerdown', 'touchstart'];
// Bound only while a sequence is live: a permanently non-passive `touchmove` would make
// every paper a scroll-blocking region for the container around it. Registering the same
// listener twice is discarded by the DOM, so binding them per sequence needs no flag.
const SEQUENCE_EVENT_TYPES = [
    'pointermove', 'pointerup', 'pointercancel',
    'touchmove', 'touchend', 'touchcancel',
    // Safari runs its page pinch-zoom through its own gesture events, which survive a
    // prevented `touchmove` (no-ops everywhere else).
    'gesturestart', 'gesturechange'
];

// The `pointerdown` events re-dispatched by `replayHeldPointerdown()`.
const replayedPointerEvents = new WeakSet();

// A pointer that was taken away rather than released: the browser claimed it for a
// scroll or a zoom, or a second finger turned the sequence into a gesture. An
// interaction that ends this way was cancelled, not completed.
export function isCancelEvent(evt) {
    const { type } = evt;
    return type === 'touchcancel' || type === 'pointercancel';
}

function findTouch(touches, identifier) {
    for (let i = 0, n = touches.length; i < n; i++) {
        const touch = touches[i];
        if (touch.identifier === identifier) return touch;
    }
    return null;
}

/**
 * @class PaperTouchGestures
 * @description Recognizes two-finger touch gestures on a `dia.Paper`. A pinch fires
 * `paper:pinch` and a two-finger pan fires `paper:pan` - the events a touchpad already
 * produces - and neither ever opens a cell or blank interaction.
 *
 * The second finger of a gesture lands after the first, so the first finger's press is
 * withheld: the paper announces it only once the finger has been down for
 * `paper.TOUCH_PRESS_DELAY` or has lifted. A second finger before that starts a gesture
 * and no press is ever announced; a second finger after it cancels the press the way a
 * browser cancel does. The native `pointerdown` of that finger is withheld too, so DOM
 * content inside the paper (a React node, a button in a `foreignObject`) hears exactly
 * what the paper announces: it is re-dispatched with the press, and dropped with a gesture.
 *
 * Phases: idle -> pending (a finger, press withheld) -> pointer (press announced), or
 * -> gesture (a second finger), which owns the sequence until the last finger lifts.
 *
 * Withholding a `pointerdown` hides it from everything below the paper element, an app's
 * own handlers included, so the paper takes the touch stream only while `paper:pinch` or
 * `paper:pan` has a listener. A paper with neither leaves every pointer event alone, and
 * an app recognizing its own pinch there - the pointer-event recipe MDN documents - runs
 * exactly as it would on a plain element.
 */
export class PaperTouchGestures {

    constructor(paper) {

        this.paper = paper;
        // pointerId -> whether its `pointerdown` was delivered to the content. Outlives a
        // sequence: a finger still down when one ends must not have its `pointerup`
        // delivered to content that never heard its `pointerdown`.
        this.pointers = new Map();
        this.resetState();

        const preventDefault = (evt) => evt.preventDefault();
        this.handlers = {
            gesturestart: preventDefault,
            gesturechange: preventDefault,
            pointerdown: this.onPointerDown.bind(this),
            pointermove: this.onPointerMove.bind(this),
            pointerup: this.onPointerUp.bind(this),
            pointercancel: this.onPointerUp.bind(this),
            touchstart: this.onTouchStart.bind(this),
            touchmove: this.onTouchMove.bind(this),
            touchend: this.onTouchEnd.bind(this),
            touchcancel: this.onTouchEnd.bind(this),
        };
        this.toggleListeners(EVENT_TYPES, true);
    }

    /**
     * @public
     * @description Detach every listener and forget the sequence in progress.
     */
    remove() {

        this.reset();
        this.toggleListeners(EVENT_TYPES, false);
    }

    /**
     * @public
     * @description Park the press `pointerdown()` is about to announce, so it is
     * announced only once this finger proves not to be the first of a gesture.
     * @returns {boolean} `true` when the press was withheld, `false` to announce it now.
     */
    withholdPress(evt, view) {

        if (this.phase !== PHASE_PENDING || evt.originalEvent !== this.startEvent) return false;
        this.press = { evt, view };
        return true;
    }

    /**
     * @public
     * @description A guarded touch is not the paper's: the content hears the press right away.
     */
    releasePress(evt) {

        if (this.phase !== PHASE_PENDING || evt.originalEvent !== this.startEvent) return;
        this.replayHeldPointerdown();
        this.reset();
    }

    /**
     * @public
     * @description Remember the `evt.data` of an interaction going live while a press is
     * tracked (the announced press, or a label drag that bypasses the withholding). Its
     * document events carry that object, and cancelling the press must find it there.
     */
    trackInteraction(data) {

        if (this.phase === PHASE_PENDING || this.phase === PHASE_POINTER) this.data = data;
    }

    /**
     * @public
     * @description Whether a `dbltap` this close to the end of a gesture is one of its
     * lifts rather than a double tap.
     */
    isGestureLift() {

        return (Date.now() - this.endedAt) < config.doubleTapInterval;
    }

    resetState() {

        this.phase = PHASE_IDLE;
        // The first finger
        this.startEvent = null; // its `touchstart`, to recognize it in `pointerdown()`
        this.identifier = null;
        this.pointerId = null;
        this.target = null;
        this.startX = 0;
        this.startY = 0;
        // Where the finger is now: a drag begins here, not back at the landing point
        this.lastX = 0;
        this.lastY = 0;
        // Whether it travelled past `TOUCH_PRESS_THRESHOLD` while withheld
        this.moved = false;
        // The withheld press: `{ evt, view }`, or `null` when the paper has no press to
        // announce (guarded, or the content under the finger kept the event)
        this.press = null;
        this.timer = null;
        // `evt.data` of the interaction the press started (see `trackInteraction()`)
        this.data = null;
        // The withheld native `pointerdown` of the first finger
        this.held = null;
        // The gesture: the tracked pair and the midpoint and distance last reported
        this.id0 = null;
        this.id1 = null;
        this.midX = 0;
        this.midY = 0;
        this.distance = 0;
        // The latest move of the gesture, measured once per frame
        this.sampleEvent = null;
        this.frame = null;
        // When the last gesture ended: its lifts must not count as a `dbltap`
        this.endedAt = 0;
    }

    reset() {

        this.toggleListeners(SEQUENCE_EVENT_TYPES, false);
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.frame !== null) {
            cancelFrame(this.frame);
            this.frame = null;
        }
        const { endedAt } = this;
        this.resetState();
        this.endedAt = endedAt;
    }

    toggleListeners(types, add) {

        const { el } = this.paper;
        const { handlers } = this;
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            if (add) {
                el.addEventListener(type, handlers[type], LISTENER_OPTIONS);
            } else {
                el.removeEventListener(type, handlers[type], LISTENER_OPTIONS);
            }
        }
    }

    // The number of touches on the paper's event surface (a `touches` list covers the
    // whole page, and content next to the SVG - a halo, an overlay - is not the paper's).
    countTouches(touches) {

        const { svg } = this.paper;
        let count = 0;
        for (let i = 0, n = touches.length; i < n; i++) {
            if (svg.contains(touches[i].target)) count++;
        }
        return count;
    }

    onTouchStart(evt) {

        const { touches, changedTouches } = evt;
        // A plain `Event` typed `touchstart` has no touch payload to read.
        if (!touches || !changedTouches || changedTouches.length === 0) return;

        // Watchdog: a sequence whose fingers lifted unseen (their targets left the DOM,
        // and the browser stops delivering their touch events) would stay recorded
        // forever. Every finger on the page being new proves the old ones are gone.
        if (this.phase !== PHASE_IDLE && touches.length === changedTouches.length) {
            this.reset();
        }

        switch (this.phase) {
            case PHASE_IDLE: {
                if (!this.paper._consumesTouchGestures()) return;
                // A `touchstart` synthesized without `touches` (`simulate.touchstart()`)
                // counts none and takes the immediate path too.
                const count = this.countTouches(touches);
                if (count === 1) {
                    this.beginPress(evt, changedTouches[0]);
                } else if (count > 1 && touches.length === changedTouches.length) {
                    // Both fingers landed at once.
                    this.beginGesture(changedTouches[0], changedTouches[1]);
                    break;
                } else {
                    // A finger joining a sequence the paper let go (a guarded press, or a
                    // press the content under it kept): hand its press back and stay out.
                    this.replayHeldPointerdown();
                    this.reset();
                }
                return;
            }
            case PHASE_PENDING:
            case PHASE_POINTER: {
                const first = findTouch(touches, this.identifier);
                if (!first) {
                    // The first finger lifted unseen. Start over with this one.
                    this.reset();
                    this.onTouchStart(evt);
                    return;
                }
                const second = changedTouches[0];
                // An interaction already live (the announced press, or a label drag that
                // bypasses the withholding) ends the way a browser cancel does. A press
                // still withheld is simply never announced: `flushPress()` only fires in
                // the pending phase, which this leaves behind.
                this.cancelPress(evt, first);
                // A finger on content next to the SVG (an overlay, a toolbar) is not the
                // paper's, and neither is one whose identifier the browser reused from a
                // finger that lifted unseen: the press ends, but no gesture begins.
                if (!this.paper.svg.contains(second.target) || second.identifier === first.identifier) {
                    this.reset();
                    return;
                }
                this.beginGesture(first, second);
                break;
            }
            case PHASE_GESTURE: {
                // An extra finger belongs to the gesture.
                break;
            }
        }

        // From the second finger on, no content under a finger hears the sequence and
        // the browser must not start its own pan or zoom.
        evt.stopPropagation();
        evt.preventDefault();
    }

    beginPress(evt, first) {

        this.phase = PHASE_PENDING;
        this.startEvent = evt;
        this.identifier = first.identifier;
        this.target = first.target;
        this.startX = this.lastX = first.clientX;
        this.startY = this.lastY = first.clientY;
        this.moved = false;
        this.timer = setTimeout(() => this.flushPress(), this.paper.TOUCH_PRESS_DELAY);
        this.toggleListeners(SEQUENCE_EVENT_TYPES, true);
    }

    beginGesture(first, second) {

        this.phase = PHASE_GESTURE;
        this.id0 = first.identifier;
        this.id1 = second.identifier;
        this.measure(first, second);
        this.toggleListeners(SEQUENCE_EVENT_TYPES, true);
    }

    // The finger proved to be a press: the content hears its `pointerdown` and the paper
    // announces the interaction, with the original event so nothing downstream can tell.
    flushPress() {

        if (this.phase !== PHASE_PENDING) return;
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.phase = PHASE_POINTER;
        this.startEvent = null;
        this.replayHeldPointerdown();
        const { press, paper } = this;
        this.press = null;
        if (!press) return;
        const { evt } = press;
        let { view } = press;
        if (this.moved) {
            // The finger travelled while the press was withheld. Announce it where the
            // finger is now: measuring from the landing point would jump whatever the
            // press picks up by everything the finger did in the meantime.
            evt.clientX = this.lastX;
            evt.clientY = this.lastY;
        }
        if (view) {
            // The view could have been re-rendered, or its cell removed, while the press was withheld.
            view = paper.getCellView(view.model) || view;
            if (!paper.model.getCell(view.model.id)) return;
        }
        paper._dispatchPointerdown(evt, view, false);
        if (this.moved && this.data) {
            // Released right after being announced, but the finger did travel: the
            // interaction is a swipe, so `pointerup` must not read it as a click.
            paper.eventData({ data: this.data }, { mousemoved: paper.options.clickThreshold + 1 });
        }
    }

    // A second finger landed on an announced press, or the browser took the pointer: end
    // the interaction the way a browser cancel does - a release at the first finger,
    // typed as a cancel, which `pointerup()` does not turn into a click.
    cancelPress(evt, first) {

        const { data } = this;
        this.data = null;
        // Nothing was announced when the content kept the press to itself.
        if (!data) return;
        this.paper.pointerup(new $.Event(evt, {
            // Typed after its cause: the browser taking the pointer, or a second finger.
            type: isCancelEvent(evt) ? evt.type : 'touchcancel',
            data,
            target: this.target,
            clientX: first.clientX,
            clientY: first.clientY,
            pointerId: this.pointerId,
        }));
    }

    // Re-dispatch the withheld native `pointerdown` to the content under the finger.
    replayHeldPointerdown() {

        const { held } = this;
        if (!held) return;
        this.held = null;
        this.pointers.set(held.pointerId, true);
        const { target } = held;
        if (!target.isConnected) return;
        // An event is a valid init dictionary for its own constructor. `MouseEvent`
        // stands in where pointer events do not exist (jsdom).
        const EventClass = (typeof PointerEvent === 'function') ? PointerEvent : MouseEvent;
        const replay = new EventClass(held.type, held);
        replayedPointerEvents.add(replay);
        target.dispatchEvent(replay);
    }

    onTouchMove(evt) {

        switch (this.phase) {
            case PHASE_PENDING: {
                const first = findTouch(evt.touches, this.identifier);
                if (!first) return;
                this.lastX = first.clientX;
                this.lastY = first.clientY;
                const dx = first.clientX - this.startX;
                const dy = first.clientY - this.startY;
                const threshold = this.paper.TOUCH_PRESS_THRESHOLD;
                if (dx * dx + dy * dy <= threshold * threshold) return;
                // Too far to be a press: this is a drag, and waiting out the rest of the
                // window would leave the finger moving with nothing following it.
                this.moved = true;
                this.flushPress();
                return;
            }
            case PHASE_GESTURE: {
                evt.stopPropagation();
                // A move the browser already owns cannot be cancelled (Chrome marks the
                // moves after it took over a scroll), and cancelling it only warns.
                if (evt.cancelable) evt.preventDefault();
                // Keep the event; the frame that reports measures it. One `paper:pan` /
                // `paper:pinch` per frame, whatever the touch sampling rate. Once a finger
                // has lifted the pair is incomplete and `flush()` reports nothing, so the
                // leftovers are swallowed without starting anything.
                this.sampleEvent = evt;
                if (this.frame === null) this.frame = nextFrame(this.flush, this);
                return;
            }
            default:
                return;
        }
    }

    onTouchEnd(evt) {

        if (this.phase === PHASE_IDLE) return;
        const { touches, changedTouches } = evt;
        if (!touches || !changedTouches) return;

        switch (this.phase) {
            case PHASE_PENDING: {
                if (!findTouch(changedTouches, this.identifier)) return;
                if (evt.type === 'touchcancel') {
                    // The browser took the finger (a scroll): nothing to announce.
                    this.reset();
                    return;
                }
                // A tap in a browser without pointer events (with them, the finger's
                // `pointerup` precedes its `touchend` and resolves the tap - see
                // `onPointerUp()`): announce and release the press at once.
                this.flushPress();
                if (this.data !== null) this.paper.pointerup(new $.Event(evt, { data: this.data }));
                this.reset();
                return;
            }
            case PHASE_POINTER: {
                if (this.countTouches(touches) === 0) this.reset();
                return;
            }
            case PHASE_GESTURE: {
                // No click and no compatibility mouse events from a gesture's finger.
                if (evt.cancelable) evt.preventDefault();
                this.flush();
                if (this.countTouches(touches) === 0) {
                    // The last lift of the sequence: its taps are the gesture's, not a `dbltap`.
                    this.endedAt = Date.now();
                    this.reset();
                }
                return;
            }
        }
    }

    // Record where the tracked pair is now; the difference from the last record is what
    // the next `paper:pan` / `paper:pinch` reports.
    measure(first, second) {

        this.midX = (first.clientX + second.clientX) / 2;
        this.midY = (first.clientY + second.clientY) / 2;
        this.distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    }

    flush() {

        if (this.frame !== null) {
            cancelFrame(this.frame);
            this.frame = null;
        }
        const { sampleEvent, midX, midY, distance, paper } = this;
        if (!sampleEvent) return;
        this.sampleEvent = null;
        const first = findTouch(sampleEvent.touches, this.id0);
        const second = findTouch(sampleEvent.touches, this.id1);
        if (!first || !second) return;
        this.measure(first, second);
        const evt = normalizeEvent(new $.Event(sampleEvent));
        // Wheel sign convention: the content follows the fingers.
        const deltaX = midX - this.midX;
        const deltaY = midY - this.midY;
        if (deltaX !== 0 || deltaY !== 0) {
            paper.trigger('paper:pan', evt, deltaX, deltaY);
        }
        // Two fingers on one point have no ratio.
        const scale = (distance > 0) ? this.distance / distance : 1;
        if (scale !== 1) {
            const { x, y } = paper.clientToLocalPoint(this.midX, this.midY);
            paper.trigger('paper:pinch', evt, x, y, scale);
        }
    }

    // The native pointer events of a touch. Content inside the paper hears the first
    // finger's `pointerdown` once the press is announced, and never the pointer events
    // of a gesture.

    onPointerDown(evt) {

        if (evt.pointerType !== 'touch' || replayedPointerEvents.has(evt)) return;
        // A primary pointer starts a sequence for the browser, so anything still tracked
        // belongs to fingers that lifted unseen (see the watchdog in `onTouchStart()`).
        if (evt.isPrimary && this.phase !== PHASE_IDLE) this.reset();
        // Cheapest first: a paper nobody listens to for gestures must not walk the tree
        // on every touch. A sequence already running keeps tracking either way, so that a
        // listener removed halfway through cannot orphan it.
        if (this.phase === PHASE_IDLE && !this.paper._consumesTouchGestures()) return;
        // Content next to the SVG (an overlay) is not on the paper's event surface.
        if (!this.paper.svg.contains(evt.target)) return;
        if (this.phase === PHASE_IDLE) {
            // The first finger of the paper's sequence. `isPrimary` cannot tell: it is
            // page-wide, so a finger resting outside the paper makes this one secondary.
            this.held = evt;
            this.pointerId = evt.pointerId;
            this.toggleListeners(SEQUENCE_EVENT_TYPES, true);
        }
        this.pointers.set(evt.pointerId, false);
        evt.stopImmediatePropagation();
    }

    onPointerMove(evt) {

        if (evt.pointerType !== 'touch') return;
        const delivered = this.pointers.get(evt.pointerId);
        if (delivered === undefined) return;
        if (!delivered || this.phase === PHASE_GESTURE) {
            evt.stopImmediatePropagation();
        }
    }

    onPointerUp(evt) {

        if (evt.pointerType !== 'touch') return;
        const delivered = this.pointers.get(evt.pointerId);
        if (delivered === undefined) return;
        this.pointers.delete(evt.pointerId);
        if (evt.pointerId === this.pointerId && evt.type === 'pointercancel') {
            // The browser took the finger to pan or zoom the page. It is the only notice:
            // the touch stream goes on (Chrome sends no `touchcancel` for a scroll), so
            // the sequence ends here - a pending press is dropped and a live one cancelled.
            if (this.phase === PHASE_POINTER) this.cancelPress(evt, evt);
            this.reset();
            if (!delivered) evt.stopImmediatePropagation();
            return;
        }
        // A pointer whose `pointerdown` was delivered gets its `pointerup` too.
        if (delivered) return;
        if (evt.pointerId === this.pointerId) {
            if (evt.type === 'pointerup' && this.phase === PHASE_PENDING) {
                // A tap. Announce the press and let this `pointerup` release it.
                this.flushPress();
                return;
            }
            // Lifted unheard: there is nothing left to replay.
            this.held = null;
        }
        evt.stopImmediatePropagation();
    }
}
