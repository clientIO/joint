import { dia, highlighters, util } from '@joint/core';
import { measureNode } from './measure-node';
import { linkRoutingStraight } from './link-routing';
import { LinkView } from './link-view';
import { MagnetHighlighter, MAGNET_HIGHLIGHTER_NAME } from './magnet-highlighter';
import { wheelGuard } from '../utils/wheel-guard';

// ---------------------------------------------------------------------------
// PointerEvents migration
// ---------------------------------------------------------------------------
// Joint-core's `events` hash stays unchanged — `mousedown` / `touchstart` still
// drive `pointerdown`. Only the drag-survival layer (`documentEvents`) switches
// to real pointer events, and the first `pointermove` of a drag acquires
// `setPointerCapture` on `paper.el` so the drag stays locked to the host.
const POINTER_DOCUMENT_EVENTS: Record<string, string> = {
  pointermove: 'pointermove',
  pointerup: 'pointerup',
  pointercancel: 'pointerup',
};

type ProtectedPaperPrototype = {
  readonly pointermove: (event: dia.Event) => void;
  readonly pointerup: (event: dia.Event) => void;
  readonly startListening: () => void;
  readonly guard: (event: dia.Event, view: dia.CellView) => boolean;
  readonly guardExplicit: (event: dia.Event, view?: dia.CellView) => boolean | undefined;
};

const protectedProto = dia.Paper.prototype as unknown as ProtectedPaperPrototype;

/**
 * Resolve the underlying DOM PointerEvent's `pointerId` from a (possibly
 * jQuery-wrapped) event. Returns `null` when the event isn't a PointerEvent
 * (e.g. legacy fallbacks where capture isn't applicable).
 * @param event - The event passed to a paper handler.
 */
function getPointerId(event: dia.Event): number | null {
  const direct = (event as unknown as { pointerId?: unknown }).pointerId;
  if (typeof direct === 'number') return direct;
  const original = (event as unknown as { originalEvent?: { pointerId?: unknown } }).originalEvent;
  const fromOriginal = original?.pointerId;
  return typeof fromOriginal === 'number' ? fromOriginal : null;
}

/**
 * Swallow the next native `click`, so a gesture that moved does not also click.
 *
 * joint-core already withholds its own `pointerclick` once the pointer travels past
 * `clickThreshold`, but the browser still fires a DOM `click` whenever press and release
 * share a target — which a drag does whenever the node follows the pointer, as when an
 * element is moved by a button inside it. Without this, dragging a node by its button
 * would run the button's `onClick` on release.
 *
 * Capture on `document` rather than `paper.el`: React attaches its listeners to the
 * portal container, so a listener on `paper.el` could be ordered behind them.
 */
function swallowClick(event: Event): void {
  event.stopPropagation();
  event.preventDefault();
}

function swallowNextClick(): void {
  document.addEventListener('click', swallowClick, { capture: true, once: true });
  // A drag released off the pressed node fires no click at all; drop the listener so it
  // cannot eat an unrelated one later. Re-adding the same function is a no-op, so
  // overlapping gestures cannot stack listeners.
  setTimeout(() => document.removeEventListener('click', swallowClick, true), 0);
}

const DEFAULT_CLICK_THRESHOLD = 5;
const DEFAULT_GRID_SIZE = 10;
const DEFAULT_SNAP_RADIUS = 15;

/** Applied to magnets highlighted as available link targets. */
const MAGNET_AVAILABLE_CLASS_NAME = 'jj-is-magnet-available';

/** Applied to elements highlighted as available link targets. */
const ELEMENT_AVAILABLE_CLASS_NAME = 'jj-is-element-available';

/** Applied to the paper's host while a pointer drag is in progress. */
const DRAGGING_CLASS_NAME = 'jj-is-dragging';

// Future improvement: this should sit on the dia.Paper prototype,
// so it can be overridden by inheriting classes (e.g. Paper)
export const DEFAULT_HIGHLIGHTING = {
  [dia.CellView.Highlighting.CONNECTING]: {
    name: MAGNET_HIGHLIGHTER_NAME,
    options: {
      attrs: {
        strokeWidth: 1,
        stroke: 'var(--jj-highlighter-connecting-color)',
      },
      rx: 4,
      ry: 4,
      padding: 6,
    },
  },
  [dia.CellView.Highlighting.EMBEDDING]: {
    name: 'stroke',
    options: {
      attrs: {
        strokeWidth: 'var(--jj-stroke-width)',
        stroke: 'var(--jj-highlighter-embedding-color)',
      },
      rx: 4,
      ry: 4,
      padding: 6,
    },
  },
  [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: MAGNET_AVAILABLE_CLASS_NAME,
    },
  },
  [dia.CellView.Highlighting.ELEMENT_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: ELEMENT_AVAILABLE_CLASS_NAME,
    },
  },
};

/**
 * Default link view factory. Uses the preset LinkView,
 * unless a specific namespaced view constructor exists.
 * @param _ - The link model for which a view is being constructed.
 * @param NSViewCtor - The namespaced view constructor, if it exists. Passed by dia.Paper
 * @returns A dia.LinkView constructor to use for link views on this paper.
 */
const linkView = (
  _: dia.Link,
  NSViewCtor: typeof dia.LinkView | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): typeof dia.LinkView<any> => {
  // Use the namespaced LinkView if provided,
  // otherwise fall back to the default LinkView.
  return NSViewCtor ?? LinkView;
};

function getGridPatterns(): Record<string, dia.Paper.PatternOptions[]> {
  const patterns = util.cloneDeep(
    // @ts-expect-error Accessing protected member to set default grid pattern colors
    dia.Paper.gridPatterns as Record<string, dia.Paper.PatternOptions[]>
  );
  for (const pattern of Object.values(patterns)) {
    for (const subPattern of pattern) {
      if (!subPattern.color) continue;
      subPattern.color = 'var(--jj-paper-grid-color)';
    }
  }
  return patterns;
}

export const Paper = dia.Paper.extend(
  {
    className: 'jj-paper',
    classNamePrefix: '',
    theme: '',
    defaultTheme: '',

    documentEvents: POINTER_DOCUMENT_EVENTS,

    FORM_CONTROL_TAG_NAMES: ['TEXTAREA', 'INPUT', 'SELECT', 'OPTION'] ,

    // Cell focus tracking. `focusin`/`focusout` bubble (unlike `focus`/`blur`),
    // so they delegate to `.joint-cell` and report which cell owns the focused
    // node (e.g. a `tabindex` element) via the `cell:focus` / `cell:blur` paper
    // events. The parent hash is spread first because a subclass `events` object
    // replaces — rather than merges with — the inherited one.
    events: {
      ...dia.Paper.prototype.events,
      'focusin .joint-cell': 'handleCellFocus',
      'focusout .joint-cell': 'handleCellBlur',
    },

    /**
     * Delegated `focusin` on a cell — emit `cell:focus` naming the cell that
     * owns the newly focused node.
     * @param event - The delegated focusin event; `event.target` is the node.
     */
    handleCellFocus(this: dia.Paper, event: dia.Event) {
      const view = this.findView<dia.ElementView | dia.LinkView>(event.target);
      if (view) view.notify('cell:focus', event);
    },

    /**
     * Delegated `focusout` on a cell — emit `cell:blur` naming the cell that
     * owned the just-blurred node.
     * @param event - The delegated focusout event; `event.target` is the node.
     */
    handleCellBlur(this: dia.Paper, event: dia.Event) {
      const view = this.findView<dia.ElementView | dia.LinkView>(event.target);
      if (view) view.notify('cell:blur', event);
    },

    /**
     * Add listeners that record the original pointerdown target into the
     * drag's `evt.data`, so `pointermove` can use it as a `setPointerCapture`
     * target. Three sources cover every drag-start path: `cell:pointerdown`
     * (element / link / label), `element:magnet:pointerdown` (magnet drag),
     * `blank:pointerdown` (drag from empty paper area).
     */
    startListening(this: dia.Paper) {
      protectedProto.startListening.call(this);
      const storePointerTarget = (_: unknown, event: dia.Event) => {
        // On passive magnets `element:magnet:pointerdown` fires before `cell:pointerdown`;
        // keep the magnet's target (more specific) and let the cell event bail.
        if (this.eventData(event).pointerTarget) return;
        this.eventData(event, { pointerTarget: event.target });
      };
      this.on({
        'cell:pointerdown': storePointerTarget,
        'element:magnet:pointerdown': storePointerTarget,
      });
    },

    /**
     * Capture the pointer once a drag is confirmed by joint-core (the
     * `isDragging` flag is set by every action-confirmed branch — element,
     * link, label, arrowhead, magnet→link). Idempotent: once `captureTarget`
     * is set in the drag's `evt.data`, subsequent pointermoves skip.
     * @param event - The pointermove event from document delegation.
     */
    pointermove(this: dia.Paper, event: dia.Event) {
      protectedProto.pointermove.call(this, event);
      const data = this.eventData(event);
      if (data.captureTarget) return;
      if (!this.isDragging(event)) return;
      const pointerId = getPointerId(event);
      if (pointerId === null) return;
      const target = data.pointerTarget instanceof Element ? data.pointerTarget : this.el;
      this.el.classList.add(DRAGGING_CLASS_NAME);
      try {
        target.setPointerCapture(pointerId);
        this.eventData(event, { captureTarget: target });
      } catch {
        // Capture can fail if the element isn't connected — safe to ignore;
        // the drag still works via `documentEvents`.
      }
    },

    /**
     * Compose {@link wheelGuard} onto joint-core's `guard`: a wheel over a
     * scrollable node body (native `<textarea>` or an element marked
     * `data-jj-scrollable`, both with actual overflow) short-circuits the
     * paper's mousewheel pipeline so the region scrolls natively.
     * `Ctrl`/`Cmd`+wheel is never guarded — pinch-zoom keeps working. The
     * caller's own `options.guard` still runs via the super call.
     * @param event - Event delivered to the paper's dispatch.
     * @param view - View resolved from the event target, if any.
     */
    guard(this: dia.Paper, event: dia.Event, view: dia.CellView) {
      return protectedProto.guard.call(this, event, view) || wheelGuard(event);
    },

    /**
     * Treat React content portaled into `paper.el` as off the paper's event surface.
     *
     * `<Paper>` children — an overlay, a popup, a toolbar — render into `paper.el` but
     * outside its SVG. A press there must not open a blank interaction, and React alone
     * cannot prevent one: React attaches its delegated listeners to the portal container,
     * which IS `paper.el`, and the paper delegates on that same node and got there first,
     * so a React `onMouseDown` runs after the paper has already reacted.
     *
     * joint-core leaves such a press alone for backwards compatibility, deciding it only
     * from `guardExplicit`. Rejecting it here — after the caller's own `options.guard` —
     * is what lets overlay content use plain React events with no interception of its own.
     * @param event - Event delivered to the paper's dispatch.
     * @param view - View resolved from the event target, if any.
     * @returns `true` to guard, `false` to allow, `undefined` to leave it undecided.
     */
    guardExplicit(this: dia.Paper, event: dia.Event, view?: dia.CellView) {
      const guarded = protectedProto.guardExplicit.call(this, event, view);
      if (guarded !== undefined) return guarded;
      const { target } = event;
      const isPortaledContent =
        target instanceof Node && !this.svg.contains(target) && this.el.contains(target);
      // Anything else stays undecided, so the paper goes on to judge the target itself.
      return isPortaledContent ? true : undefined;
    },

    /**
     * Let a press on a `<button>` start a paper interaction — an element move, or a link
     * when the button sits inside a magnet. joint-core blocks every form control here,
     * which makes a button click-only; buttons are the one control whose whole purpose is
     * a press, so a drag from one is unambiguous. `FORM_CONTROL_TAG_NAMES` is left alone,
     * so the button keeps its native default action and stays focusable.
     *
     * A drag that moves does not also click: `pointerup` swallows the native click.
     */
    PREVENT_INTERACTION_TAG_NAMES: ['TEXTAREA', 'INPUT', 'SELECT', 'OPTION'],

    /**
     * Run the upstream pointerup handler, then release capture. Also runs on
     * `pointercancel` (mapped to the same method via the events hash) so
     * OS-stolen pointers don't leave listeners attached.
     *
     * Also withholds the next native `click` when the gesture moved, so a drag started
     * from a button does not fire its `onClick` on release.
     * @param event - The pointerup or pointercancel event.
     */
    pointerup(this: dia.Paper, event: dia.Event) {
      const pointerId = getPointerId(event);
      const { captureTarget, mousemoved = 0 } = this.eventData(event) as {
        captureTarget?: Element;
        mousemoved?: number;
      };
      // Read before the super call: it ends the gesture and resets this state.
      if (mousemoved > (this.options.clickThreshold ?? 0)) swallowNextClick();
      protectedProto.pointerup.call(this, event);
      if (!captureTarget || pointerId === null) return;
      this.el.classList.remove(DRAGGING_CLASS_NAME);
      if (captureTarget.hasPointerCapture?.(pointerId)) {
        try {
          captureTarget.releasePointerCapture(pointerId);
        } catch {
          // Ignored — release can fail if the element was already detached.
        }
      }
    },

    options: {
      ...dia.Paper.prototype.options,
      // Required for React integration features:
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      frozen: true,
      autoFreeze: true,
      viewManagement: {
        disposeHidden: true,
        lazyInitialize: true,
      },
      // Defaults (overridable from constructor options)
      preventDefaultBlankAction: false,
      linkPinning: false,
      gridSize: DEFAULT_GRID_SIZE,
      markAvailable: true,
      clickThreshold: DEFAULT_CLICK_THRESHOLD,
      snapLinks: { radius: DEFAULT_SNAP_RADIUS },
      highlighterNamespace: {
        ...highlighters,
        [MAGNET_HIGHLIGHTER_NAME]: MagnetHighlighter,
      },
      highlighting: DEFAULT_HIGHLIGHTING,
      drawGrid: true,
      magnetThreshold: 'onleave',
      ...linkRoutingStraight(),
      measureNode,
      linkView,
    },
  },
  {
    gridPatterns: getGridPatterns(),
  }
) as typeof dia.Paper;
