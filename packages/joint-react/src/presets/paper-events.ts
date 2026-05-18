import type { dia } from '@joint/core';
import { mvc } from '@joint/core';
import type { DOMElement } from '@joint/core/types/internal.js';
import type { PaperEventMap } from '../types/event.types';
import { type ConnectionEnd, toConnectionEnd } from './can-connect';

// ============================================================================
// Base / shared context shapes
// ============================================================================

/** Paper + graph references shared by every event context. */
export interface BaseContext {
  readonly paper: dia.Paper;
  readonly graph: dia.Graph;
}

/** Cell-level identifying payload (fires for any cell — element or link). */
export interface CellContext {
  readonly id: dia.Cell.ID;
  readonly model: dia.Cell;
  readonly view: dia.CellView;
}

/** Element-level cell payload — `model` / `view` narrowed to element types. */
export interface ElementContext {
  readonly id: dia.Cell.ID;
  readonly model: dia.Element;
  readonly view: dia.ElementView;
}

/** Link-level cell payload — `model` / `view` narrowed to link types. */
export interface LinkContext {
  readonly id: dia.Cell.ID;
  readonly model: dia.Link;
  readonly view: dia.LinkView;
}

/** Composed cell-level event context (cell + base). Internal building block. */
export type CellEventContext = BaseContext & CellContext;
/** Composed element-level event context (element cell + base). */
export type ElementEventContext = BaseContext & ElementContext;
/** Composed link-level event context (link cell + base). */
export type LinkEventContext = BaseContext & LinkContext;

/** Blank-area event payload — no cell, no view. */
export type BlankEventContext = BaseContext;

type WithPointer<Ctx> = Ctx & {
  readonly event: Event;
  readonly x: number;
  readonly y: number;
};
type WithHover<Ctx> = Ctx & { readonly event: Event };
type WithWheel<Ctx> = WithPointer<Ctx> & { readonly delta: number };

// ============================================================================
// Pointer / hover / wheel context aliases
// ============================================================================

/** Pointer-style cell-level payload (down/move/up/click/dblclick/contextmenu). */
export type PointerCellEventContext = WithPointer<CellEventContext>;
/** Pointer-style element-level payload. */
export type PointerElementEventContext = WithPointer<ElementEventContext>;
/** Pointer-style link-level payload. */
export type PointerLinkEventContext = WithPointer<LinkEventContext>;
/** Pointer-style blank-area payload — event + coords on empty paper area. */
export type PointerBlankEventContext = WithPointer<BlankEventContext>;

/** Hover-style cell-level payload (mouseenter/leave/over/out). */
export type HoverCellEventContext = WithHover<CellEventContext>;
/** Hover-style element-level payload. */
export type HoverElementEventContext = WithHover<ElementEventContext>;
/** Hover-style link-level payload. */
export type HoverLinkEventContext = WithHover<LinkEventContext>;
/** Hover-style blank-area payload — event only on empty paper area. */
export type HoverBlankEventContext = WithHover<BlankEventContext>;

/** Wheel cell-level payload (mousewheel) — pointer + delta. */
export type WheelCellEventContext = WithWheel<CellEventContext>;
/** Wheel element-level payload. */
export type WheelElementEventContext = WithWheel<ElementEventContext>;
/** Wheel link-level payload. */
export type WheelLinkEventContext = WithWheel<LinkEventContext>;
/** Wheel blank-area payload — pointer + delta on empty paper area. */
export type WheelBlankEventContext = WithWheel<BlankEventContext>;

/** Magnet payload — element-only, pointer + magnet SVG node + port/selector. */
export type MagnetEventContext = WithPointer<ElementEventContext> & {
  readonly magnet: DOMElement;
  /** The port ID, or `null` if the magnet is not on a port. */
  readonly port: string | null;
  /** The `joint-selector` attribute of the magnet, or `null`. */
  readonly selector: string | null;
};

// ============================================================================
// Paper-level contexts
// ============================================================================

/** Paper-edge hover payload (`paper:mouseenter` / `paper:mouseleave`). */
export type PaperHoverEventContext = BlankEventContext & { readonly event: Event };

/** Paper-level pan payload — `paper:pan` from touchpad / wheel pan. */
export type PaperPanEventContext = BlankEventContext & {
  readonly event: Event;
  readonly deltaX: number;
  readonly deltaY: number;
};

/** Paper-level pinch payload — `paper:pinch` from touchpad pinch gesture. */
export type PaperPinchEventContext = BlankEventContext & {
  readonly event: Event;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

// ============================================================================
// Link connect/disconnect
// ============================================================================

/**
 * `link:connect` / `link:disconnect` payload — the link + the cell at the
 * (dis)connected end as a {@link ConnectionEnd} (same shape used by
 * `validateConnection`, so the two stay symmetric).
 */
export interface LinkConnectEventContext extends LinkEventContext {
  readonly event: Event;
  /** Which end of the link was (dis)connected. */
  readonly end: 'source' | 'target';
  /** Cell at the (dis)connected end. Always present — these events fire only on actual cells. */
  readonly endCell: ConnectionEnd;
}

// ============================================================================
// Normalized event maps (camelCase → native)
// ============================================================================

const POINTER_CELL_MAP = {
  onCellPointerDown: 'cell:pointerdown',
  onCellPointerMove: 'cell:pointermove',
  onCellPointerUp: 'cell:pointerup',
  onCellPointerClick: 'cell:pointerclick',
  onCellPointerDblClick: 'cell:pointerdblclick',
  onCellContextMenu: 'cell:contextmenu',
  onElementPointerDown: 'element:pointerdown',
  onElementPointerMove: 'element:pointermove',
  onElementPointerUp: 'element:pointerup',
  onElementPointerClick: 'element:pointerclick',
  onElementPointerDblClick: 'element:pointerdblclick',
  onElementContextMenu: 'element:contextmenu',
  onLinkPointerDown: 'link:pointerdown',
  onLinkPointerMove: 'link:pointermove',
  onLinkPointerUp: 'link:pointerup',
  onLinkPointerClick: 'link:pointerclick',
  onLinkPointerDblClick: 'link:pointerdblclick',
  onLinkContextMenu: 'link:contextmenu',
} as const;

const HOVER_CELL_MAP = {
  onCellMouseEnter: 'cell:mouseenter',
  onCellMouseLeave: 'cell:mouseleave',
  onCellMouseOver: 'cell:mouseover',
  onCellMouseOut: 'cell:mouseout',
  onElementMouseEnter: 'element:mouseenter',
  onElementMouseLeave: 'element:mouseleave',
  onElementMouseOver: 'element:mouseover',
  onElementMouseOut: 'element:mouseout',
  onLinkMouseEnter: 'link:mouseenter',
  onLinkMouseLeave: 'link:mouseleave',
  onLinkMouseOver: 'link:mouseover',
  onLinkMouseOut: 'link:mouseout',
} as const;

const WHEEL_CELL_MAP = {
  onCellMouseWheel: 'cell:mousewheel',
  onElementMouseWheel: 'element:mousewheel',
  onLinkMouseWheel: 'link:mousewheel',
} as const;

const MAGNET_MAP = {
  onElementMagnetPointerClick: 'element:magnet:pointerclick',
  onElementMagnetPointerDblClick: 'element:magnet:pointerdblclick',
  onElementMagnetContextMenu: 'element:magnet:contextmenu',
} as const;

const LINK_CONNECT_MAP = {
  onLinkConnect: 'link:connect',
  onLinkDisconnect: 'link:disconnect',
} as const;

const POINTER_BLANK_MAP = {
  onBlankPointerDown: 'blank:pointerdown',
  onBlankPointerMove: 'blank:pointermove',
  onBlankPointerUp: 'blank:pointerup',
  onBlankPointerClick: 'blank:pointerclick',
  onBlankPointerDblClick: 'blank:pointerdblclick',
  onBlankContextMenu: 'blank:contextmenu',
} as const;

const HOVER_BLANK_MAP = {
  onBlankMouseEnter: 'blank:mouseenter',
  onBlankMouseLeave: 'blank:mouseleave',
  onBlankMouseOver: 'blank:mouseover',
  onBlankMouseOut: 'blank:mouseout',
} as const;

const WHEEL_BLANK_MAP = {
  onBlankMouseWheel: 'blank:mousewheel',
} as const;

const PAPER_HOVER_MAP = {
  onPaperMouseEnter: 'paper:mouseenter',
  onPaperMouseLeave: 'paper:mouseleave',
} as const;

const PAPER_PAN_MAP = {
  onPaperPan: 'paper:pan',
} as const;

const PAPER_PINCH_MAP = {
  onPaperPinch: 'paper:pinch',
} as const;

const NORMALIZED_KEYS = new Set<string>([
  ...Object.keys(POINTER_CELL_MAP),
  ...Object.keys(HOVER_CELL_MAP),
  ...Object.keys(WHEEL_CELL_MAP),
  ...Object.keys(MAGNET_MAP),
  ...Object.keys(LINK_CONNECT_MAP),
  ...Object.keys(POINTER_BLANK_MAP),
  ...Object.keys(HOVER_BLANK_MAP),
  ...Object.keys(WHEEL_BLANK_MAP),
  ...Object.keys(PAPER_HOVER_MAP),
  ...Object.keys(PAPER_PAN_MAP),
  ...Object.keys(PAPER_PINCH_MAP),
]);

// ============================================================================
// Normalized handlers map (typed)
// ============================================================================

/**
 * Camel-cased, context-object handlers for the most common `dia.Paper` events.
 * Mixable with raw `'element:pointerclick'` keys in the same handlers map.
 * Paper-level events that stay raw: `'resize'`, `'transform'`, `'scale'`,
 * `'translate'`, `'render:done'`, `'render:idle'`, `'cell:highlight'`,
 * `'cell:unhighlight'`, `'cell:highlight:invalid'`, `'link:snap:connect'`,
 * `'link:snap:disconnect'`.
 */
export interface NormalizedPaperHandlers {
  // pointer (cell — fires for any cell, element OR link)
  readonly onCellPointerDown?: (ctx: PointerCellEventContext) => void;
  readonly onCellPointerMove?: (ctx: PointerCellEventContext) => void;
  readonly onCellPointerUp?: (ctx: PointerCellEventContext) => void;
  readonly onCellPointerClick?: (ctx: PointerCellEventContext) => void;
  readonly onCellPointerDblClick?: (ctx: PointerCellEventContext) => void;
  readonly onCellContextMenu?: (ctx: PointerCellEventContext) => void;
  // pointer (element)
  readonly onElementPointerDown?: (ctx: PointerElementEventContext) => void;
  readonly onElementPointerMove?: (ctx: PointerElementEventContext) => void;
  readonly onElementPointerUp?: (ctx: PointerElementEventContext) => void;
  readonly onElementPointerClick?: (ctx: PointerElementEventContext) => void;
  readonly onElementPointerDblClick?: (ctx: PointerElementEventContext) => void;
  readonly onElementContextMenu?: (ctx: PointerElementEventContext) => void;
  // pointer (link)
  readonly onLinkPointerDown?: (ctx: PointerLinkEventContext) => void;
  readonly onLinkPointerMove?: (ctx: PointerLinkEventContext) => void;
  readonly onLinkPointerUp?: (ctx: PointerLinkEventContext) => void;
  readonly onLinkPointerClick?: (ctx: PointerLinkEventContext) => void;
  readonly onLinkPointerDblClick?: (ctx: PointerLinkEventContext) => void;
  readonly onLinkContextMenu?: (ctx: PointerLinkEventContext) => void;
  // hover (cell — fires for any cell)
  readonly onCellMouseEnter?: (ctx: HoverCellEventContext) => void;
  readonly onCellMouseLeave?: (ctx: HoverCellEventContext) => void;
  readonly onCellMouseOver?: (ctx: HoverCellEventContext) => void;
  readonly onCellMouseOut?: (ctx: HoverCellEventContext) => void;
  // hover (element/link)
  readonly onElementMouseEnter?: (ctx: HoverElementEventContext) => void;
  readonly onElementMouseLeave?: (ctx: HoverElementEventContext) => void;
  readonly onElementMouseOver?: (ctx: HoverElementEventContext) => void;
  readonly onElementMouseOut?: (ctx: HoverElementEventContext) => void;
  readonly onLinkMouseEnter?: (ctx: HoverLinkEventContext) => void;
  readonly onLinkMouseLeave?: (ctx: HoverLinkEventContext) => void;
  readonly onLinkMouseOver?: (ctx: HoverLinkEventContext) => void;
  readonly onLinkMouseOut?: (ctx: HoverLinkEventContext) => void;
  // wheel
  readonly onCellMouseWheel?: (ctx: WheelCellEventContext) => void;
  readonly onElementMouseWheel?: (ctx: WheelElementEventContext) => void;
  readonly onLinkMouseWheel?: (ctx: WheelLinkEventContext) => void;
  // magnet
  readonly onElementMagnetPointerClick?: (ctx: MagnetEventContext) => void;
  readonly onElementMagnetPointerDblClick?: (ctx: MagnetEventContext) => void;
  readonly onElementMagnetContextMenu?: (ctx: MagnetEventContext) => void;
  // link connect
  readonly onLinkConnect?: (ctx: LinkConnectEventContext) => void;
  readonly onLinkDisconnect?: (ctx: LinkConnectEventContext) => void;
  // blank pointer
  readonly onBlankPointerDown?: (ctx: PointerBlankEventContext) => void;
  readonly onBlankPointerMove?: (ctx: PointerBlankEventContext) => void;
  readonly onBlankPointerUp?: (ctx: PointerBlankEventContext) => void;
  readonly onBlankPointerClick?: (ctx: PointerBlankEventContext) => void;
  readonly onBlankPointerDblClick?: (ctx: PointerBlankEventContext) => void;
  readonly onBlankContextMenu?: (ctx: PointerBlankEventContext) => void;
  // blank hover
  readonly onBlankMouseEnter?: (ctx: HoverBlankEventContext) => void;
  readonly onBlankMouseLeave?: (ctx: HoverBlankEventContext) => void;
  readonly onBlankMouseOver?: (ctx: HoverBlankEventContext) => void;
  readonly onBlankMouseOut?: (ctx: HoverBlankEventContext) => void;
  // blank wheel
  readonly onBlankMouseWheel?: (ctx: WheelBlankEventContext) => void;
  // paper-level hover (fires when pointer enters/leaves the paper host)
  readonly onPaperMouseEnter?: (ctx: PaperHoverEventContext) => void;
  readonly onPaperMouseLeave?: (ctx: PaperHoverEventContext) => void;
  // paper-level touchpad
  readonly onPaperPan?: (ctx: PaperPanEventContext) => void;
  readonly onPaperPinch?: (ctx: PaperPinchEventContext) => void;
}

/** Combined handlers — normalized + raw native — accepted by `attachPaperHandlers`. */
export type PaperHandlers = Partial<PaperEventMap> & NormalizedPaperHandlers;

// ============================================================================
// Subscription helpers
// ============================================================================

type EventHandlerMap = Record<string, ((...args: unknown[]) => void) | undefined>;

/**
 * Build the cell-only portion of an event context (id, model, view).
 * Compose with a `BaseContext` (paper, graph) at call sites.
 * @param view
 */
function makeCellContext(view: dia.CellView): CellContext {
  return { id: view.model.id, model: view.model, view };
}

/**
 * Subscribes a single normalized event group: walks `map`, looks up each
 * user handler in `eventMap`, and registers a native-args wrapper that
 * builds the context object via `wrap`.
 * @param controller
 * @param paper
 * @param eventMap
 * @param map
 * @param wrap
 */
function subscribeGroup<Args extends unknown[], Ctx>(
  controller: mvc.Listener<[]>,
  paper: dia.Paper,
  eventMap: EventHandlerMap,
  map: Readonly<Record<string, string>>,
  wrap: (...args: Args) => Ctx
): void {
  for (const key in map) {
    const handler = eventMap[key];
    if (!handler) continue;
    controller.listenTo(paper, map[key], (...args: unknown[]) => {
      handler(wrap(...(args as Args)));
    });
  }
}

/**
 * Registers raw (native-signature) handlers — any key in `eventMap` that
 * isn't a known normalized `on*` key.
 * @param controller
 * @param paper
 * @param eventMap
 */
function subscribeRaw(
  controller: mvc.Listener<[]>,
  paper: dia.Paper,
  eventMap: EventHandlerMap
): void {
  for (const eventName in eventMap) {
    if (NORMALIZED_KEYS.has(eventName)) continue;
    const handler = eventMap[eventName];
    if (!handler) continue;
    controller.listenTo(paper, eventName, (...args: Parameters<mvc.EventHandler>) => {
      handler(...(args as unknown[]));
    });
  }
}

/**
 * Attaches a normalized handlers map to a paper and returns a cleanup
 * function that detaches everything. Pure JointJS adapter — no React.
 *
 * `attachPaperHandlers` is the runtime that powers the React `usePaperEvents`
 * hook; it can also be used directly when wiring events outside React (e.g.
 * inside other presets, plugins, or non-React stencils).
 * @param paper - Target paper. The associated graph is read from `paper.model`.
 * @param handlers - Normalized + raw event handlers.
 * @returns Cleanup callback that calls `listener.stopListening()`.
 */
export function attachPaperHandlers(
  paper: dia.Paper,
  handlers: PaperHandlers
): () => void {
  const graph = paper.model;
  const controller = new mvc.Listener();
  const eventMap = handlers as EventHandlerMap;
  const baseContext: BaseContext = { paper, graph };

  subscribeGroup(controller, paper, eventMap, POINTER_CELL_MAP,
    (view: dia.CellView, event: Event, x: number, y: number) =>
      ({ ...baseContext, ...makeCellContext(view), event, x, y }));

  subscribeGroup(controller, paper, eventMap, HOVER_CELL_MAP,
    (view: dia.CellView, event: Event) => ({ ...baseContext, ...makeCellContext(view), event }));

  subscribeGroup(controller, paper, eventMap, WHEEL_CELL_MAP,
    (view: dia.CellView, event: Event, x: number, y: number, delta: number) =>
      ({ ...baseContext, ...makeCellContext(view), event, x, y, delta }));

  // Native magnet arg order is (view, evt, magnet, x, y) — not (view, evt, x, y, magnet).
  subscribeGroup(controller, paper, eventMap, MAGNET_MAP,
    (view: dia.ElementView, event: Event, magnet: DOMElement, x: number, y: number) => {
      const end = toConnectionEnd(view, magnet);
      return { ...baseContext, ...makeCellContext(view), event, x, y, magnet, port: end.port, selector: end.selector };
    });

  subscribeGroup(controller, paper, eventMap, LINK_CONNECT_MAP,
    (
      linkView: dia.LinkView,
      event: Event,
      endView: dia.CellView,
      endMagnet: DOMElement | undefined,
      end: 'source' | 'target'
    ) => ({
      ...baseContext,
      ...makeCellContext(linkView),
      event,
      end,
      endCell: toConnectionEnd(endView, endMagnet),
    }));

  subscribeGroup(controller, paper, eventMap, POINTER_BLANK_MAP,
    (event: Event, x: number, y: number) => ({ ...baseContext, event, x, y }));

  subscribeGroup(controller, paper, eventMap, HOVER_BLANK_MAP,
    (event: Event) => ({ ...baseContext, event }));

  subscribeGroup(controller, paper, eventMap, WHEEL_BLANK_MAP,
    (event: Event, x: number, y: number, delta: number) =>
      ({ ...baseContext, event, x, y, delta }));

  // Paper-level hover (`paper:mouseenter` / `paper:mouseleave`) — native (evt).
  subscribeGroup(controller, paper, eventMap, PAPER_HOVER_MAP,
    (event: Event) => ({ ...baseContext, event }));

  // Paper-level pan (`paper:pan`) — native (evt, deltaX, deltaY).
  subscribeGroup(controller, paper, eventMap, PAPER_PAN_MAP,
    (event: Event, deltaX: number, deltaY: number) =>
      ({ ...baseContext, event, deltaX, deltaY }));

  // Paper-level pinch (`paper:pinch`) — native (evt, x, y, scale).
  subscribeGroup(controller, paper, eventMap, PAPER_PINCH_MAP,
    (event: Event, x: number, y: number, scale: number) =>
      ({ ...baseContext, event, x, y, scale }));

  subscribeRaw(controller, paper, eventMap);

  return () => controller.stopListening();
}
