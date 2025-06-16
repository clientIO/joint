import type { dia, mvc } from '@joint/core';

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
 * Paper event handlers.
 * @see https://resources.jointjs.com/docs/jointjs#dia.Paper.events
 */

export interface PaperEvents {
  // Paper mouse events
  onPaperMouseEnter?: (args: { event: dia.Event; paper: dia.Paper }) => void;
  onPaperMouseLeave?: (args: { event: dia.Event; paper: dia.Paper }) => void;

  // Click events
  onCellPointerClick?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementPointerClick?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onLinkPointerClick?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onBlankPointerClick?: (args: {
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;

  // Double click events
  onCellPointerDblClick?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementPointerDblClick?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onLinkPointerDblClick?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onBlankPointerDblClick?: (args: {
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;

  // Context menu events
  onCellContextMenu?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementContextMenu?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onLinkContextMenu?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onBlankContextMenu?: (args: { event: dia.Event; x: number; y: number; paper: dia.Paper }) => void;

  // Pointer down events
  onCellPointerDown?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementPointerDown?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onLinkPointerDown?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onBlankPointerDown?: (args: { event: dia.Event; x: number; y: number; paper: dia.Paper }) => void;

  // Pointer move events
  onCellPointerMove?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementPointerMove?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onLinkPointerMove?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onBlankPointerMove?: (args: { event: dia.Event; x: number; y: number; paper: dia.Paper }) => void;

  // Pointer up events
  onCellPointerUp?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementPointerUp?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onLinkPointerUp?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onBlankPointerUp?: (args: { event: dia.Event; x: number; y: number; paper: dia.Paper }) => void;

  // Mouse over events
  onCellMouseOver?: (args: { cellView: dia.CellView; event: dia.Event; paper: dia.Paper }) => void;
  onElementMouseOver?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    paper: dia.Paper;
  }) => void;
  onLinkMouseOver?: (args: { linkView: dia.LinkView; event: dia.Event; paper: dia.Paper }) => void;
  onBlankMouseOver?: (args: { event: dia.Event; paper: dia.Paper }) => void;

  // Mouse out events
  onCellMouseOut?: (args: { cellView: dia.CellView; event: dia.Event; paper: dia.Paper }) => void;
  onElementMouseOut?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    paper: dia.Paper;
  }) => void;
  onLinkMouseOut?: (args: { linkView: dia.LinkView; event: dia.Event; paper: dia.Paper }) => void;
  onBlankMouseOut?: (args: { event: dia.Event; paper: dia.Paper }) => void;

  // Mouse enter events
  onCellMouseEnter?: (args: { cellView: dia.CellView; event: dia.Event; paper: dia.Paper }) => void;
  onElementMouseEnter?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    paper: dia.Paper;
  }) => void;
  onLinkMouseEnter?: (args: { linkView: dia.LinkView; event: dia.Event; paper: dia.Paper }) => void;
  onBlankMouseEnter?: (args: { event: dia.Event; paper: dia.Paper }) => void;

  // Mouse leave events
  onCellMouseLeave?: (args: { cellView: dia.CellView; event: dia.Event; paper: dia.Paper }) => void;
  onElementMouseLeave?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    paper: dia.Paper;
  }) => void;
  onLinkMouseLeave?: (args: { linkView: dia.LinkView; event: dia.Event; paper: dia.Paper }) => void;
  onBlankMouseLeave?: (args: { event: dia.Event; paper: dia.Paper }) => void;

  // Mouse wheel events
  onCellMouseWheel?: (args: {
    cellView: dia.CellView;
    event: dia.Event;
    x: number;
    y: number;
    delta: number;
    paper: dia.Paper;
  }) => void;
  onElementMouseWheel?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    x: number;
    y: number;
    delta: number;
    paper: dia.Paper;
  }) => void;
  onLinkMouseWheel?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    x: number;
    y: number;
    delta: number;
    paper: dia.Paper;
  }) => void;
  onBlankMouseWheel?: (args: {
    event: dia.Event;
    x: number;
    y: number;
    delta: number;
    paper: dia.Paper;
  }) => void;

  // Paper gestures
  onPan?: (args: { event: dia.Event; deltaX: number; deltaY: number; paper: dia.Paper }) => void;
  onPinch?: (args: {
    event: dia.Event;
    x: number;
    y: number;
    scale: number;
    paper: dia.Paper;
  }) => void;

  // Magnet events
  onElementMagnetPointerClick?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    magnetNode: SVGElement;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementMagnetPointerDblClick?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    magnetNode: SVGElement;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;
  onElementMagnetContextMenu?: (args: {
    elementView: dia.ElementView;
    event: dia.Event;
    magnetNode: SVGElement;
    x: number;
    y: number;
    paper: dia.Paper;
  }) => void;

  // Highlight events
  onCellHighlight?: (args: {
    cellView: dia.CellView;
    node: SVGElement;
    options: dia.CellView.EventHighlightOptions;
    paper: dia.Paper;
  }) => void;
  onCellUnhighlight?: (args: {
    cellView: dia.CellView;
    node: SVGElement;
    options: dia.CellView.EventHighlightOptions;
    paper: dia.Paper;
  }) => void;
  onCellHighlightInvalid?: (args: {
    cellView: dia.CellView;
    highlighterId: string;
    highlighter: dia.HighlighterView;
    paper: dia.Paper;
  }) => void;

  // Connection events
  onLinkConnect?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    newCellView: dia.CellView;
    newCellViewMagnet: SVGElement;
    arrowhead: dia.LinkEnd;
    paper: dia.Paper;
  }) => void;
  onLinkDisconnect?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    previousCellView: dia.CellView;
    previousCellViewMagnet: SVGElement;
    arrowhead: dia.LinkEnd;
    paper: dia.Paper;
  }) => void;
  onLinkSnapConnect?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    newCellView: dia.CellView;
    newCellViewMagnet: SVGElement;
    arrowhead: dia.LinkEnd;
    paper: dia.Paper;
  }) => void;
  onLinkSnapDisconnect?: (args: {
    linkView: dia.LinkView;
    event: dia.Event;
    previousCellView: dia.CellView;
    previousCellViewMagnet: SVGElement;
    arrowhead: dia.LinkEnd;
    paper: dia.Paper;
  }) => void;

  // Render events
  onRenderDone?: (args: { stats: dia.Paper.UpdateStats; opt: unknown; paper: dia.Paper }) => void;

  // Transform events
  onTranslate?: (args: { tx: number; ty: number; data: unknown; paper: dia.Paper }) => void;
  onScale?: (args: { sx: number; sy: number; data: unknown; paper: dia.Paper }) => void;
  onResize?: (args: { width: number; height: number; data: unknown; paper: dia.Paper }) => void;
  onTransform?: (args: { matrix: SVGMatrix; data: unknown; paper: dia.Paper }) => void;

  // Custom events
  onCustomEvent?: (args: {
    eventName: string;
    args: Parameters<mvc.EventHandler>;
    paper: dia.Paper;
  }) => void;
}
