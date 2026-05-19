import { dia } from '@joint/core';
import { measureNode } from './measure-node';
import { linkRoutingStraight } from './link-routing';
import { LinkView } from './link-view';

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

// Inject CSS custom property into all built-in grid pattern colors
// so they respond to --jj-paper-grid-color.
// @ts-expect-error Accessing protected member to set default grid pattern colors
// eslint-disable-next-line unicorn/no-array-for-each
Object.values(dia.Paper.gridPatterns).forEach((pattern) => {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (const subPattern of patterns) {
    if (!subPattern.color) continue;
    subPattern.color = 'var(--jj-paper-grid-color)';
  }
});

const DEFAULT_CLICK_THRESHOLD = 5;
const DEFAULT_GRID_SIZE = 10;
const DEFAULT_SNAP_RADIUS = 15;

// Future improvement: this should sit on the dia.Paper prototype,
// so it can be overridden by inheriting classes (e.g. Paper)
export const DEFAULT_HIGHLIGHTING = {
  [dia.CellView.Highlighting.DEFAULT]: {
    name: 'stroke',
    options: {
      attrs: {
        strokeWidth: 1,
        stroke: 'var(--jj-paper-highlight-color)',
      },
      rx: 4,
      ry: 4,
      padding: 6,
    },
  },
  [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'jj-is-available',
    },
  },
  [dia.CellView.Highlighting.ELEMENT_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'jj-is-available',
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

export const Paper = dia.Paper.extend({
  className: 'jj-paper joint-paper',
  classNamePrefix: '',
  documentEvents: POINTER_DOCUMENT_EVENTS,

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
    this.el.classList.add('jj-is-dragging');
    try {
      target.setPointerCapture(pointerId);
      this.eventData(event, { captureTarget: target });
    } catch {
      // Capture can fail if the element isn't connected — safe to ignore;
      // the drag still works via `documentEvents`.
    }
  },

  /**
   * Run the upstream pointerup handler, then release capture. Also runs on
   * `pointercancel` (mapped to the same method via the events hash) so
   * OS-stolen pointers don't leave listeners attached.
   * @param event - The pointerup or pointercancel event.
   */
  pointerup(this: dia.Paper, event: dia.Event) {
    const pointerId = getPointerId(event);
    const captureTarget = this.eventData(event).captureTarget as Element | undefined;
    protectedProto.pointerup.call(this, event);
    if (!captureTarget || pointerId === null) return;
    this.el.classList.remove('jj-is-dragging');
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
    highlighting: DEFAULT_HIGHLIGHTING,
    drawGrid: true,
    magnetThreshold: 'onleave',
    ...linkRoutingStraight(),
    measureNode,
    linkView,
  },
}) as typeof dia.Paper;
