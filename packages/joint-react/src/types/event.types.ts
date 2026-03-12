import type { dia, mvc } from '@joint/core';
import type { AnyString } from './index';

/**
 * Event triggered when all elements have been properly measured (width and height > 1).
 * Use with `usePaperEvents` or `paper.on()` to listen for this event.
 */
export const PAPER_ELEMENTS_SIZE_READY = 'paper:elements:size:ready' as const;

/**
 * Event triggered when element sizes change after the initial measurement.
 * Use with `usePaperEvents` or `paper.on()` to listen for this event.
 */
export const PAPER_ELEMENTS_SIZE_CHANGE = 'paper:elements:size:change' as const;

/**
 * Event triggered when React element portals are rendered.
 * Called once with all currently rendered element IDs.
 * Use with `usePaperEvents` or `paper.on()` to listen for this event.
 */
export const PAPER_ELEMENTS_RENDER = 'paper:elements:render' as const;

export interface EventMap {
  // paper
  'paper:mouseenter': (event: dia.Event) => void;
  'paper:mouseleave': (event: dia.Event) => void;
  // pointerclick
  'cell:pointerclick': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => void;
  'element:pointerclick': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number
  ) => void;
  'link:pointerclick': (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => void;
  'blank:pointerclick': (event: dia.Event, x: number, y: number) => void;
  // pointerdblclick
  'cell:pointerdblclick': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => void;
  'element:pointerdblclick': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number
  ) => void;
  'link:pointerdblclick': (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => void;
  'blank:pointerdblclick': (event: dia.Event, x: number, y: number) => void;
  // contextmenu
  'cell:contextmenu': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => void;
  'element:contextmenu': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number
  ) => void;
  'link:contextmenu': (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => void;
  'blank:contextmenu': (event: dia.Event, x: number, y: number) => void;
  // pointerdown
  'cell:pointerdown': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => void;
  'element:pointerdown': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number
  ) => void;
  'link:pointerdown': (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => void;
  'blank:pointerdown': (event: dia.Event, x: number, y: number) => void;
  // pointermove
  'cell:pointermove': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => void;
  'element:pointermove': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number
  ) => void;
  'link:pointermove': (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => void;
  'blank:pointermove': (event: dia.Event, x: number, y: number) => void;
  // pointerup
  'cell:pointerup': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => void;
  'element:pointerup': (elementView: dia.ElementView, event: dia.Event, x: number, y: number) => void;
  'link:pointerup': (linkView: dia.LinkView, event: dia.Event, x: number, y: number) => void;
  'blank:pointerup': (event: dia.Event, x: number, y: number) => void;
  // mouseover
  'cell:mouseover': (cellView: dia.CellView, event: dia.Event) => void;
  'element:mouseover': (elementView: dia.ElementView, event: dia.Event) => void;
  'link:mouseover': (linkView: dia.LinkView, event: dia.Event) => void;
  'blank:mouseover': (event: dia.Event) => void;
  // mouseout
  'cell:mouseout': (cellView: dia.CellView, event: dia.Event) => void;
  'element:mouseout': (elementView: dia.ElementView, event: dia.Event) => void;
  'link:mouseout': (linkView: dia.LinkView, event: dia.Event) => void;
  'blank:mouseout': (event: dia.Event) => void;
  // mouseenter
  'cell:mouseenter': (cellView: dia.CellView, event: dia.Event) => void;
  'element:mouseenter': (elementView: dia.ElementView, event: dia.Event) => void;
  'link:mouseenter': (linkView: dia.LinkView, event: dia.Event) => void;
  'blank:mouseenter': (event: dia.Event) => void;
  // mouseleave
  'cell:mouseleave': (cellView: dia.CellView, event: dia.Event) => void;
  'element:mouseleave': (elementView: dia.ElementView, event: dia.Event) => void;
  'link:mouseleave': (linkView: dia.LinkView, event: dia.Event) => void;
  'blank:mouseleave': (event: dia.Event) => void;
  // mousewheel
  'cell:mousewheel': (
    cellView: dia.CellView,
    event: dia.Event,
    x: number,
    y: number,
    delta: number
  ) => void;
  'element:mousewheel': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number,
    delta: number
  ) => void;
  'link:mousewheel': (
    linkView: dia.LinkView,
    event: dia.Event,
    x: number,
    y: number,
    delta: number
  ) => void;
  'blank:mousewheel': (event: dia.Event, x: number, y: number, delta: number) => void;
  // touchpad
  'paper:pan': (event: dia.Event, deltaX: number, deltaY: number) => void;
  'paper:pinch': (event: dia.Event, x: number, y: number, scale: number) => void;
  // magnet
  'element:magnet:pointerclick': (
    elementView: dia.ElementView,
    event: dia.Event,
    magnetNode: SVGElement,
    x: number,
    y: number
  ) => void;
  'element:magnet:pointerdblclick': (
    elementView: dia.ElementView,
    event: dia.Event,
    magnetNode: SVGElement,
    x: number,
    y: number
  ) => void;
  'element:magnet:contextmenu': (
    elementView: dia.ElementView,
    event: dia.Event,
    magnetNode: SVGElement,
    x: number,
    y: number
  ) => void;
  // highlighting
  'cell:highlight': (
    cellView: dia.CellView,
    node: SVGElement,
    options: dia.CellView.EventHighlightOptions
  ) => void;
  'cell:unhighlight': (
    cellView: dia.CellView,
    node: SVGElement,
    options: dia.CellView.EventHighlightOptions
  ) => void;
  'cell:highlight:invalid': (
    cellView: dia.CellView,
    highlighterId: string,
    highlighter: dia.HighlighterView
  ) => void;
  // connect
  'link:connect': (
    linkView: dia.LinkView,
    event: dia.Event,
    newCellView: dia.CellView,
    newCellViewMagnet: SVGElement,
    arrowhead: dia.LinkEnd
  ) => void;
  'link:disconnect': (
    linkView: dia.LinkView,
    event: dia.Event,
    previousCellView: dia.CellView,
    previousCellViewMagnet: SVGElement,
    arrowhead: dia.LinkEnd
  ) => void;
  'link:snap:connect': (
    linkView: dia.LinkView,
    event: dia.Event,
    newCellView: dia.CellView,
    newCellViewMagnet: SVGElement,
    arrowhead: dia.LinkEnd
  ) => void;
  'link:snap:disconnect': (
    linkView: dia.LinkView,
    event: dia.Event,
    previousCellView: dia.CellView,
    previousCellViewMagnet: SVGElement,
    arrowhead: dia.LinkEnd
  ) => void;
  // render
  'render:done': (stats: dia.Paper.UpdateStats, opt: unknown) => void;
  'render:idle': (opt: dia.Paper.UpdateViewsAsyncOptions) => void;
  // react paper events
  [PAPER_ELEMENTS_SIZE_READY]: () => void;
  [PAPER_ELEMENTS_SIZE_CHANGE]: () => void;
  [PAPER_ELEMENTS_RENDER]: () => void;
  // transformations
  translate: (tx: number, ty: number, data: unknown) => void;
  scale: (sx: number, sy: number, data: unknown) => void;
  resize: (width: number, height: number, data: unknown) => void;
  transform: (matrix: SVGMatrix, data: unknown) => void;
}

export type PaperEventType = keyof EventMap;

export type PaperEventHandlers = Partial<{
  [EventName in PaperEventType]: (...args: Parameters<EventMap[EventName]>) => void;
}> & {
  [eventName: AnyString]: ((...args: Parameters<mvc.EventHandler>) => void) | undefined;
};

export interface GraphEventOptions {
  readonly [key: string]: unknown;
}

export interface GraphKnownEventMap {
  readonly add: (
    cell: dia.Cell,
    collection: mvc.Collection<dia.Cell>,
    options: GraphEventOptions
  ) => void;
  readonly remove: (
    cell: dia.Cell,
    collection: mvc.Collection<dia.Cell>,
    options: GraphEventOptions
  ) => void;
  readonly change: (cell: dia.Cell, options: GraphEventOptions) => void;
  readonly reset: (
    collection: mvc.Collection<dia.Cell>,
    options: GraphEventOptions
  ) => void;
  readonly sort: (
    collection: mvc.Collection<dia.Cell>,
    options: GraphEventOptions
  ) => void;
  readonly move: (cell: dia.Cell, options: GraphEventOptions) => void;
  readonly 'batch:start': (data: GraphEventOptions) => void;
  readonly 'batch:stop': (data: GraphEventOptions) => void;
}

export type GraphKnownEventName = keyof GraphKnownEventMap;

export type GraphPatternEventName = `change:${string}` | `layer:${string}` | `layers:${string}`;

export type GraphEventName = GraphKnownEventName | GraphPatternEventName;

type GraphPatternEventArgs<EventName extends GraphPatternEventName> =
  EventName extends `change:${string}`
    ? [cell: dia.Cell, options?: GraphEventOptions]
    : EventName extends `layer:${string}`
      ? [
          layer: dia.GraphLayer,
          collectionOrOptions?: mvc.Collection<dia.GraphLayer> | GraphEventOptions,
          options?: GraphEventOptions,
        ]
      : [layerCollection: dia.GraphLayerCollection, options?: GraphEventOptions];

export type GraphEventArgs<EventName extends GraphEventName> =
  EventName extends GraphKnownEventName
    ? Parameters<GraphKnownEventMap[EventName]>
    : EventName extends GraphPatternEventName
      ? GraphPatternEventArgs<EventName>
      : Parameters<mvc.EventHandler>;

export type GraphEventHandlers = Partial<{
  [EventName in GraphEventName]: (...args: GraphEventArgs<EventName>) => void;
}> & {
  [eventName: AnyString]: ((...args: Parameters<mvc.EventHandler>) => void) | undefined;
};
