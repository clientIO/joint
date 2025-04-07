import type { dia, mvc } from '@joint/core';

export interface EventMap {
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
  // pointerdown
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
  'element:pointerup': (
    elementView: dia.ElementView,
    event: dia.Event,
    x: number,
    y: number
  ) => void;
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
  // transformations
  translate: (tx: number, ty: number, data: unknown) => void;
  scale: (sx: number, sy: number, data: unknown) => void;
  resize: (width: number, height: number, data: unknown) => void;
  transform: (matrix: SVGMatrix, data: unknown) => void;
  // custom

  custom: (eventName: string, ...args: Parameters<mvc.EventHandler>) => void;
}

// Extract Paper Event Names
export type PaperEventType = keyof EventMap;

/**
 * Paper event handler.
 * List of all events can be found here:
 * @see https://resources.jointjs.com/docs/jointjs#dia.Paper.events
 */
type PaperEventHandler<EventType extends PaperEventType> = (
  ...args: Parameters<EventMap[EventType]>
) => void;

// Paper Event Options with Type Information

type TransformEvent<T extends string> = T extends `${infer First}:${infer Rest}`
  ? `${Capitalize<First>}${TransformEvent<Rest>}`
  : Capitalize<T>;

// Correcting camelCase transformations for React events
// Ensuring "dblclick" becomes "DblClick"
type FixReactEventCase<T extends string> = T extends `${infer Prefix}click` ? `${Prefix}Click` : T;

type TransformReactEvent<T extends string> = FixReactEventCase<TransformEvent<T>>;

export type ReactPaperEventType<T extends string = PaperEventType> = `on${TransformReactEvent<T>}`;

/**
 * Paper event handlers.
 * @see https://resources.jointjs.com/docs/jointjs#dia.Paper.events
 */
export type PaperEvents = {
  [Type in PaperEventType as ReactPaperEventType<Type>]?: PaperEventHandler<Type>;
};

/**
 * Converts a Paper event type to a React event type.
 * @param type - The Paper event type.
 * @returns The corresponding React event type.
 */
export function typeToReactType(type: PaperEventType): ReactPaperEventType {
  return ('on' +
    type
      .split(':') // Split by ":"
      .map((word, index) =>
        index === 1 && word === 'dblclick'
          ? 'DblClick'
          : word.charAt(0).toUpperCase() + word.slice(1)
      ) // Capitalize first letter, fix "dblclick"
      .join('')) as ReactPaperEventType;
}
