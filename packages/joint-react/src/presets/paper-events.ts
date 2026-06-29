import type { dia } from '@joint/core';
import { mvc } from '@joint/core';
import type { DOMElement } from '@joint/core/types/internal';
import { type ConnectionEnd, toConnectionEnd } from './can-connect';

// ============================================================================
// Base / shared context shapes
// ============================================================================

// Paper + graph references shared by every event context.
interface BaseContext {
  readonly paper: dia.Paper;
  readonly graph: dia.Graph;
}

// Cell-level identifying payload (fires for any cell — element or link).
interface CellContext {
  readonly id: dia.Cell.ID;
  readonly model: dia.Cell;
  readonly view: dia.CellView;
}

// Element-level cell payload — `model` / `view` narrowed to element types.
interface ElementContext {
  readonly id: dia.Cell.ID;
  readonly model: dia.Element;
  readonly view: dia.ElementView;
}

// Link-level cell payload — `model` / `view` narrowed to link types.
interface LinkContext {
  readonly id: dia.Cell.ID;
  readonly model: dia.Link;
  readonly view: dia.LinkView;
}

// Composed building blocks — pointer/hover/wheel variants below add event + coords.
type CellEventParams = BaseContext & CellContext;
type ElementEventParams = BaseContext & ElementContext;
type LinkEventParams = BaseContext & LinkContext;

type WithPointer<Params> = Params & {
  readonly event: dia.Event;
  readonly x: number;
  readonly y: number;
};
type WithHover<Params> = Params & { readonly event: dia.Event };
type WithWheel<Params> = WithPointer<Params> & { readonly delta: number };

// ============================================================================
// Pointer / hover / wheel context aliases
// ============================================================================

/** Pointer-style cell-level payload (down/move/up/click/dblclick/contextmenu). */
type PointerCellEventParams = WithPointer<CellEventParams>;
/** Pointer-style element-level payload. */
type PointerElementEventParams = WithPointer<ElementEventParams>;
/** Pointer-style link-level payload. */
type PointerLinkEventParams = WithPointer<LinkEventParams>;
/** Pointer-style blank-area payload — event + coords on empty paper area. */
type PointerBlankEventParams = WithPointer<BaseContext>;

/** Hover-style cell-level payload (mouseenter/leave/over/out). */
type HoverCellEventParams = WithHover<CellEventParams>;
/** Hover-style element-level payload. */
type HoverElementEventParams = WithHover<ElementEventParams>;
/** Hover-style link-level payload. */
type HoverLinkEventParams = WithHover<LinkEventParams>;
/** Hover-style blank-area payload — event only on empty paper area. */
type HoverBlankEventParams = WithHover<BaseContext>;

/** Wheel cell-level payload (mousewheel) — pointer + delta. */
type WheelCellEventParams = WithWheel<CellEventParams>;
/** Wheel element-level payload. */
type WheelElementEventParams = WithWheel<ElementEventParams>;
/** Wheel link-level payload. */
type WheelLinkEventParams = WithWheel<LinkEventParams>;
/** Wheel blank-area payload — pointer + delta on empty paper area. */
type WheelBlankEventParams = WithWheel<BaseContext>;

/** Magnet payload — element-only, pointer + magnet SVG node + port/selector. */
type MagnetEventParams = WithPointer<ElementEventParams> & {
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
type PaperHoverEventParams = BaseContext & { readonly event: dia.Event };

/** Paper-level pan payload — `paper:pan` from touchpad / wheel pan. */
type PaperPanEventParams = BaseContext & {
  readonly event: dia.Event;
  readonly deltaX: number;
  readonly deltaY: number;
};

/** Paper-level pinch payload — `paper:pinch` from touchpad pinch gesture. */
type PaperPinchEventParams = BaseContext & {
  readonly event: dia.Event;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

/** `translate` payload — paper translation. */
type TranslateEventParams = BaseContext & {
  readonly translateX: number;
  readonly translateY: number;
  readonly options: unknown;
};

/** `scale` payload — paper scale. */
type ScaleEventParams = BaseContext & {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly options: unknown;
};

/** `resize` payload — paper dimensions. */
type ResizeEventParams = BaseContext & {
  readonly width: number;
  readonly height: number;
  readonly options: unknown;
};

/** `transform` payload — paper SVG transform matrix. */
type TransformEventParams = BaseContext & {
  readonly matrix: SVGMatrix;
  readonly options: unknown;
};

// ============================================================================
// Link connect/disconnect
// ============================================================================

/**
 * `link:connect` / `link:disconnect` payload, the link + the cell at the
 * (dis)connected end as a {@link ConnectionEnd} (same shape used by
 * `validateConnection`, so the two stay symmetric).
 * @group Types
 */
interface LinkConnectEventParams extends LinkEventParams {
  readonly event: dia.Event;
  /** Which end of the link was (dis)connected. */
  readonly end: 'source' | 'target';
  /** Cell at the (dis)connected end. Always present, these events fire only on actual cells. */
  readonly endCell: ConnectionEnd;
}

// ============================================================================
// CamelCase → native event-name maps
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
  onLinkSnapConnect: 'link:snap:connect',
  onLinkSnapDisconnect: 'link:snap:disconnect',
} as const;

// Highlight events — different signature: `(cellView, node, options)` and
// `(cellView, highlighterId, highlighter)` for `cell:highlight:invalid`.
// Needs its own context type. Stay raw until use cases demand it.
// const HIGHLIGHT_MAP = {
//   onCellHighlight: 'cell:highlight',
//   onCellUnhighlight: 'cell:unhighlight',
//   onCellHighlightInvalid: 'cell:highlight:invalid',
// } as const;

// Render lifecycle — `(stats, opt)` / `(opt)` signatures. Paper-level, no
// cell/blank context. Stay raw for now.
// const RENDER_MAP = {
//   onRenderDone: 'render:done',
//   onRenderIdle: 'render:idle',
// } as const;

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

const TRANSLATE_MAP = {
  onTranslate: 'translate',
} as const;

const SCALE_MAP = {
  onScale: 'scale',
} as const;

const RESIZE_MAP = {
  onResize: 'resize',
} as const;

const TRANSFORM_MAP = {
  onTransform: 'transform',
} as const;

const PAPER_EVENT_KEYS = new Set<string>([
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
  ...Object.keys(TRANSLATE_MAP),
  ...Object.keys(SCALE_MAP),
  ...Object.keys(RESIZE_MAP),
  ...Object.keys(TRANSFORM_MAP),
]);

// ============================================================================
// Paper event handlers (typed)
// ============================================================================

/**
 * Camel-cased, params-object handlers for the most common `dia.Paper` events.
 * Mixable with raw `'element:pointerclick'` keys in the same handlers map.
 * Paper-level events that stay raw: `'resize'`, `'transform'`, `'scale'`,
 * `'translate'`, `'render:done'`, `'render:idle'`, `'cell:highlight'`,
 * `'cell:unhighlight'`, `'cell:highlight:invalid'`, `'link:snap:connect'`,
 * `'link:snap:disconnect'`.
 * @group Types
 */
export interface PaperEventHandlers {
  // pointer (cell — fires for any cell, element OR link)
  readonly onCellPointerDown?: (params: PointerCellEventParams) => void;
  readonly onCellPointerMove?: (params: PointerCellEventParams) => void;
  readonly onCellPointerUp?: (params: PointerCellEventParams) => void;
  readonly onCellPointerClick?: (params: PointerCellEventParams) => void;
  readonly onCellPointerDblClick?: (params: PointerCellEventParams) => void;
  readonly onCellContextMenu?: (params: PointerCellEventParams) => void;
  // pointer (element)
  readonly onElementPointerDown?: (params: PointerElementEventParams) => void;
  readonly onElementPointerMove?: (params: PointerElementEventParams) => void;
  readonly onElementPointerUp?: (params: PointerElementEventParams) => void;
  readonly onElementPointerClick?: (params: PointerElementEventParams) => void;
  readonly onElementPointerDblClick?: (params: PointerElementEventParams) => void;
  readonly onElementContextMenu?: (params: PointerElementEventParams) => void;
  // pointer (link)
  readonly onLinkPointerDown?: (params: PointerLinkEventParams) => void;
  readonly onLinkPointerMove?: (params: PointerLinkEventParams) => void;
  readonly onLinkPointerUp?: (params: PointerLinkEventParams) => void;
  readonly onLinkPointerClick?: (params: PointerLinkEventParams) => void;
  readonly onLinkPointerDblClick?: (params: PointerLinkEventParams) => void;
  readonly onLinkContextMenu?: (params: PointerLinkEventParams) => void;
  // hover (cell — fires for any cell)
  readonly onCellMouseEnter?: (params: HoverCellEventParams) => void;
  readonly onCellMouseLeave?: (params: HoverCellEventParams) => void;
  readonly onCellMouseOver?: (params: HoverCellEventParams) => void;
  readonly onCellMouseOut?: (params: HoverCellEventParams) => void;
  // hover (element/link)
  readonly onElementMouseEnter?: (params: HoverElementEventParams) => void;
  readonly onElementMouseLeave?: (params: HoverElementEventParams) => void;
  readonly onElementMouseOver?: (params: HoverElementEventParams) => void;
  readonly onElementMouseOut?: (params: HoverElementEventParams) => void;
  readonly onLinkMouseEnter?: (params: HoverLinkEventParams) => void;
  readonly onLinkMouseLeave?: (params: HoverLinkEventParams) => void;
  readonly onLinkMouseOver?: (params: HoverLinkEventParams) => void;
  readonly onLinkMouseOut?: (params: HoverLinkEventParams) => void;
  // wheel
  readonly onCellMouseWheel?: (params: WheelCellEventParams) => void;
  readonly onElementMouseWheel?: (params: WheelElementEventParams) => void;
  readonly onLinkMouseWheel?: (params: WheelLinkEventParams) => void;
  // magnet
  readonly onElementMagnetPointerClick?: (params: MagnetEventParams) => void;
  readonly onElementMagnetPointerDblClick?: (params: MagnetEventParams) => void;
  readonly onElementMagnetContextMenu?: (params: MagnetEventParams) => void;
  // link connect
  readonly onLinkConnect?: (params: LinkConnectEventParams) => void;
  readonly onLinkDisconnect?: (params: LinkConnectEventParams) => void;
  readonly onLinkSnapConnect?: (params: LinkConnectEventParams) => void;
  readonly onLinkSnapDisconnect?: (params: LinkConnectEventParams) => void;
  // blank pointer
  readonly onBlankPointerDown?: (params: PointerBlankEventParams) => void;
  readonly onBlankPointerMove?: (params: PointerBlankEventParams) => void;
  readonly onBlankPointerUp?: (params: PointerBlankEventParams) => void;
  readonly onBlankPointerClick?: (params: PointerBlankEventParams) => void;
  readonly onBlankPointerDblClick?: (params: PointerBlankEventParams) => void;
  readonly onBlankContextMenu?: (params: PointerBlankEventParams) => void;
  // blank hover
  readonly onBlankMouseEnter?: (params: HoverBlankEventParams) => void;
  readonly onBlankMouseLeave?: (params: HoverBlankEventParams) => void;
  readonly onBlankMouseOver?: (params: HoverBlankEventParams) => void;
  readonly onBlankMouseOut?: (params: HoverBlankEventParams) => void;
  // blank wheel
  readonly onBlankMouseWheel?: (params: WheelBlankEventParams) => void;
  // paper-level hover (fires when pointer enters/leaves the paper host)
  readonly onPaperMouseEnter?: (params: PaperHoverEventParams) => void;
  readonly onPaperMouseLeave?: (params: PaperHoverEventParams) => void;
  // paper-level touchpad
  readonly onPaperPan?: (params: PaperPanEventParams) => void;
  readonly onPaperPinch?: (params: PaperPinchEventParams) => void;
  // paper transforms
  readonly onTranslate?: (params: TranslateEventParams) => void;
  readonly onScale?: (params: ScaleEventParams) => void;
  readonly onResize?: (params: ResizeEventParams) => void;
  readonly onTransform?: (params: TransformEventParams) => void;
}

/**
 * Extracts the callback type for a given paper event key.
 * For example, `PaperEventHandler<'onCellPointerDown'>` is `(params: PointerCellEventParams) => void`.
 * Useful for typing individual handler variables or parameters.
 * @group Types
 */
export type PaperEventHandler<T extends keyof PaperEventHandlers> = NonNullable<
  PaperEventHandlers[T]
>;

/**
 * Combined handlers, camelCase `on*` + raw native, accepted by `addPaperEventListeners`.
 * @group Types
 */
export type PaperEventMap = Partial<dia.Paper.EventMap> & PaperEventHandlers;

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
 * Subscribes a single camelCase event group: walks `map`, looks up each
 * user handler in `eventMap`, and registers a native-args wrapper that
 * builds the params object via `wrap`.
 * @param controller
 * @param paper
 * @param eventMap
 * @param map
 * @param wrap
 */
function subscribeGroup<Args extends unknown[], Params>(
  controller: mvc.Listener<[]>,
  paper: dia.Paper,
  eventMap: EventHandlerMap,
  map: Readonly<Record<string, string>>,
  wrap: (...args: Args) => Params
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
 * Registers raw (native-signature) handlers, any key in `eventMap` that
 * isn't a known `on*` key.
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
    if (PAPER_EVENT_KEYS.has(eventName)) continue;
    const handler = eventMap[eventName];
    if (!handler) continue;
    controller.listenTo(paper, eventName, (...args: Parameters<mvc.EventHandler>) => {
      handler(...(args as unknown[]));
    });
  }
}

/**
 * Attaches a handlers map (camelCase `on*` + raw native) to a paper and
 * returns a cleanup function that detaches everything. Pure JointJS adapter.
 * no React.
 *
 * `addPaperEventListeners` is the runtime that powers the React {@link useOnPaperEvents}
 * hook; it can also be used directly when wiring events outside React (e.g.
 * inside other presets, plugins, or non-React stencils).
 * @param paper - Target paper. The associated graph is read from `paper.model`.
 * @param handlers - CamelCase `on*` + raw event handlers.
 * @returns Cleanup callback that calls `listener.stopListening()`.
 */
export function addPaperEventListeners(paper: dia.Paper, handlers: PaperEventMap): () => void {
  const graph = paper.model;
  const controller = new mvc.Listener();
  const eventMap = handlers as EventHandlerMap;
  const baseContext: BaseContext = { paper, graph };

  subscribeGroup(
    controller,
    paper,
    eventMap,
    POINTER_CELL_MAP,
    (view: dia.CellView, event: dia.Event, x: number, y: number) => ({
      ...baseContext,
      ...makeCellContext(view),
      event,
      x,
      y,
    })
  );

  subscribeGroup(
    controller,
    paper,
    eventMap,
    HOVER_CELL_MAP,
    (view: dia.CellView, event: dia.Event) => ({ ...baseContext, ...makeCellContext(view), event })
  );

  subscribeGroup(
    controller,
    paper,
    eventMap,
    WHEEL_CELL_MAP,
    (view: dia.CellView, event: dia.Event, x: number, y: number, delta: number) => ({
      ...baseContext,
      ...makeCellContext(view),
      event,
      x,
      y,
      delta,
    })
  );

  // Native magnet arg order is (view, evt, magnet, x, y) — not (view, evt, x, y, magnet).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    MAGNET_MAP,
    (view: dia.ElementView, event: dia.Event, magnet: DOMElement, x: number, y: number) => {
      const end = toConnectionEnd(view, magnet);
      return {
        ...baseContext,
        ...makeCellContext(view),
        event,
        x,
        y,
        magnet,
        port: end.port,
        selector: end.selector,
      };
    }
  );

  subscribeGroup(
    controller,
    paper,
    eventMap,
    LINK_CONNECT_MAP,
    (
      linkView: dia.LinkView,
      event: dia.Event,
      endView: dia.CellView,
      endMagnet: DOMElement | undefined,
      end: 'source' | 'target'
    ) => ({
      ...baseContext,
      ...makeCellContext(linkView),
      event,
      end,
      endCell: toConnectionEnd(endView, endMagnet),
    })
  );

  subscribeGroup(
    controller,
    paper,
    eventMap,
    POINTER_BLANK_MAP,
    (event: dia.Event, x: number, y: number) => ({ ...baseContext, event, x, y })
  );

  subscribeGroup(controller, paper, eventMap, HOVER_BLANK_MAP, (event: dia.Event) => ({
    ...baseContext,
    event,
  }));

  subscribeGroup(
    controller,
    paper,
    eventMap,
    WHEEL_BLANK_MAP,
    (event: dia.Event, x: number, y: number, delta: number) => ({
      ...baseContext,
      event,
      x,
      y,
      delta,
    })
  );

  // Paper-level hover (`paper:mouseenter` / `paper:mouseleave`) — native (evt).
  subscribeGroup(controller, paper, eventMap, PAPER_HOVER_MAP, (event: dia.Event) => ({
    ...baseContext,
    event,
  }));

  // Paper-level pan (`paper:pan`) — native (evt, deltaX, deltaY).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    PAPER_PAN_MAP,
    (event: dia.Event, deltaX: number, deltaY: number) => ({
      ...baseContext,
      event,
      deltaX,
      deltaY,
    })
  );

  // Paper-level pinch (`paper:pinch`) — native (evt, x, y, scale).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    PAPER_PINCH_MAP,
    (event: dia.Event, x: number, y: number, scale: number) => ({
      ...baseContext,
      event,
      x,
      y,
      scale,
    })
  );

  // `translate` — native (tx, ty, data).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    TRANSLATE_MAP,
    (translateX: number, translateY: number, options: unknown) => ({
      ...baseContext,
      translateX,
      translateY,
      options,
    })
  );

  // `scale` — native (sx, sy, data).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    SCALE_MAP,
    (scaleX: number, scaleY: number, options: unknown) => ({
      ...baseContext,
      scaleX,
      scaleY,
      options,
    })
  );

  // `resize` — native (width, height, data).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    RESIZE_MAP,
    (width: number, height: number, options: unknown) => ({
      ...baseContext,
      width,
      height,
      options,
    })
  );

  // `transform` — native (matrix, data).
  subscribeGroup(
    controller,
    paper,
    eventMap,
    TRANSFORM_MAP,
    (matrix: SVGMatrix, options: unknown) => ({ ...baseContext, matrix, options })
  );

  subscribeRaw(controller, paper, eventMap);

  return () => controller.stopListening();
}

/**
 * Picks the `on*` paper-event handlers (`onBlankContextMenu`, …) out of a
 * props object. Non-event props are ignored.
 * @param props - Any object that may contain `on*` handler keys.
 * @returns The matched `on*` entries.
 */
export function extractEventsFromPaperProps(
  props: Partial<PaperEventHandlers>
): Partial<PaperEventHandlers> {
  const eventHandlers: Partial<PaperEventHandlers> = {};
  for (const property in props) {
    const key = property as keyof PaperEventHandlers;
    if (PAPER_EVENT_KEYS.has(key)) {
      // Variable-key write: cast past the readonly/union index to assign.
      (eventHandlers as Record<string, unknown>)[key] = props[key];
    }
  }
  return eventHandlers;
}
