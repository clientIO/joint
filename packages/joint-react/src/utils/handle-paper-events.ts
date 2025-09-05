import type { dia } from '@joint/core';
import { mvc } from '@joint/core';
import type { EventMap, PaperEvents } from '../types/event.types';

export const PAPER_EVENTS_MAPPER: {
  [K in keyof PaperEvents]?: {
    jointEvent: keyof EventMap;
    handler: (paper: dia.Paper, ...args: never[]) => Parameters<NonNullable<PaperEvents[K]>>[0];
  };
} = {
  // --- render ---
  onRenderDone: {
    jointEvent: 'render:done',
    handler: (paper, stats: dia.Paper.UpdateStats, opt: unknown) => ({ paper, stats, opt }),
  },

  // --- pointer click ---
  onCellPointerClick: {
    jointEvent: 'cell:pointerclick',
    handler: (paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerClick: {
    jointEvent: 'element:pointerclick',
    handler: (paper, elementView: dia.ElementView, event: dia.Event, x: number, y: number) => ({
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerClick: {
    jointEvent: 'link:pointerclick',
    handler: (paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerClick: {
    jointEvent: 'blank:pointerclick',
    handler: (paper, event: dia.Event, x: number, y: number) => ({ paper, event, x, y }),
  },

  // --- pointer dblclick ---
  onCellPointerDblClick: {
    jointEvent: 'cell:pointerdblclick',
    handler: (paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerDblClick: {
    jointEvent: 'element:pointerdblclick',
    handler: (paper, elementView: dia.ElementView, event: dia.Event, x: number, y: number) => ({
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerDblClick: {
    jointEvent: 'link:pointerdblclick',
    handler: (paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerDblClick: {
    jointEvent: 'blank:pointerdblclick',
    handler: (paper, event: dia.Event, x: number, y: number) => ({ paper, event, x, y }),
  },

  // --- contextmenu ---
  onCellContextMenu: {
    jointEvent: 'cell:contextmenu',
    handler: (paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementContextMenu: {
    jointEvent: 'element:contextmenu',
    handler: (paper, elementView: dia.ElementView, event: dia.Event, x: number, y: number) => ({
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkContextMenu: {
    jointEvent: 'link:contextmenu',
    handler: (paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankContextMenu: {
    jointEvent: 'blank:contextmenu',
    handler: (paper, event: dia.Event, x: number, y: number) => ({ paper, event, x, y }),
  },

  // --- pointer down ---
  onCellPointerDown: {
    jointEvent: 'cell:pointerdown',
    handler: (paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerDown: {
    jointEvent: 'element:pointerdown',
    handler: (paper, elementView: dia.ElementView, event: dia.Event, x: number, y: number) => ({
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerDown: {
    jointEvent: 'link:pointerdown',
    handler: (paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerDown: {
    jointEvent: 'blank:pointerdown',
    handler: (paper, event: dia.Event, x: number, y: number) => ({ paper, event, x, y }),
  },

  // --- pointer move ---
  onCellPointerMove: {
    jointEvent: 'cell:pointermove',
    handler: (paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerMove: {
    jointEvent: 'element:pointermove',
    handler: (paper, elementView: dia.ElementView, event: dia.Event, x: number, y: number) => ({
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerMove: {
    jointEvent: 'link:pointermove',
    handler: (paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerMove: {
    jointEvent: 'blank:pointermove',
    handler: (paper, event: dia.Event, x: number, y: number) => ({ paper, event, x, y }),
  },

  // --- pointer up ---
  onCellPointerUp: {
    jointEvent: 'cell:pointerup',
    handler: (paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerUp: {
    jointEvent: 'element:pointerup',
    handler: (paper, elementView: dia.ElementView, event: dia.Event, x: number, y: number) => ({
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerUp: {
    jointEvent: 'link:pointerup',
    handler: (paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerUp: {
    jointEvent: 'blank:pointerup',
    handler: (paper, event: dia.Event, x: number, y: number) => ({ paper, event, x, y }),
  },

  // --- mouse over/out ---
  onCellMouseOver: {
    jointEvent: 'cell:mouseover',
    handler: (paper, cellView: dia.CellView, event: dia.Event) => ({ paper, cellView, event }),
  },
  onElementMouseOver: {
    jointEvent: 'element:mouseover',
    handler: (paper, elementView: dia.ElementView, event: dia.Event) => ({
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseOver: {
    jointEvent: 'link:mouseover',
    handler: (paper, linkView: dia.LinkView, event: dia.Event) => ({ paper, linkView, event }),
  },
  onBlankMouseOver: {
    jointEvent: 'blank:mouseover',
    handler: (paper, event: dia.Event) => ({ paper, event }),
  },

  onCellMouseOut: {
    jointEvent: 'cell:mouseout',
    handler: (paper, cellView: dia.CellView, event: dia.Event) => ({ paper, cellView, event }),
  },
  onElementMouseOut: {
    jointEvent: 'element:mouseout',
    handler: (paper, elementView: dia.ElementView, event: dia.Event) => ({
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseOut: {
    jointEvent: 'link:mouseout',
    handler: (paper, linkView: dia.LinkView, event: dia.Event) => ({ paper, linkView, event }),
  },
  onBlankMouseOut: {
    jointEvent: 'blank:mouseout',
    handler: (paper, event: dia.Event) => ({ paper, event }),
  },

  // --- mouse enter/leave ---
  onCellMouseEnter: {
    jointEvent: 'cell:mouseenter',
    handler: (paper, cellView: dia.CellView, event: dia.Event) => ({ paper, cellView, event }),
  },
  onElementMouseEnter: {
    jointEvent: 'element:mouseenter',
    handler: (paper, elementView: dia.ElementView, event: dia.Event) => ({
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseEnter: {
    jointEvent: 'link:mouseenter',
    handler: (paper, linkView: dia.LinkView, event: dia.Event) => ({ paper, linkView, event }),
  },
  onBlankMouseEnter: {
    jointEvent: 'blank:mouseenter',
    handler: (paper, event: dia.Event) => ({ paper, event }),
  },

  onCellMouseLeave: {
    jointEvent: 'cell:mouseleave',
    handler: (paper, cellView: dia.CellView, event: dia.Event) => ({ paper, cellView, event }),
  },
  onElementMouseLeave: {
    jointEvent: 'element:mouseleave',
    handler: (paper, elementView: dia.ElementView, event: dia.Event) => ({
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseLeave: {
    jointEvent: 'link:mouseleave',
    handler: (paper, linkView: dia.LinkView, event: dia.Event) => ({ paper, linkView, event }),
  },
  onBlankMouseLeave: {
    jointEvent: 'blank:mouseleave',
    handler: (paper, event: dia.Event) => ({ paper, event }),
  },

  // --- mouse wheel ---
  onCellMouseWheel: {
    jointEvent: 'cell:mousewheel',
    handler: (
      paper,
      cellView: dia.CellView,
      event: dia.Event,
      x: number,
      y: number,
      delta: number
    ) => ({
      paper,
      cellView,
      event,
      x,
      y,
      delta,
    }),
  },
  onElementMouseWheel: {
    jointEvent: 'element:mousewheel',
    handler: (
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number,
      delta: number
    ) => ({
      paper,
      elementView,
      event,
      x,
      y,
      delta,
    }),
  },
  onLinkMouseWheel: {
    jointEvent: 'link:mousewheel',
    handler: (
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      x: number,
      y: number,
      delta: number
    ) => ({
      paper,
      linkView,
      event,
      x,
      y,
      delta,
    }),
  },
  onBlankMouseWheel: {
    jointEvent: 'blank:mousewheel',
    handler: (paper, event: dia.Event, x: number, y: number, delta: number) => ({
      paper,
      event,
      x,
      y,
      delta,
    }),
  },

  // --- paper gestures ---
  onPan: {
    jointEvent: 'paper:pan',
    handler: (paper, event: dia.Event, deltaX: number, deltaY: number) => ({
      paper,
      event,
      deltaX,
      deltaY,
    }),
  },
  onPinch: {
    jointEvent: 'paper:pinch',
    handler: (paper, event: dia.Event, x: number, y: number, scale: number) => ({
      paper,
      event,
      x,
      y,
      scale,
    }),
  },

  // --- paper mouse enter/leave ---
  onPaperMouseEnter: {
    jointEvent: 'paper:mouseenter',
    handler: (paper, event: dia.Event) => ({ paper, event }),
  },
  onPaperMouseLeave: {
    jointEvent: 'paper:mouseleave',
    handler: (paper, event: dia.Event) => ({ paper, event }),
  },

  // --- magnet events ---
  onElementMagnetPointerClick: {
    jointEvent: 'element:magnet:pointerclick',
    handler: (
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      magnetNode: SVGElement,
      x: number,
      y: number
    ) => ({
      paper,
      elementView,
      event,
      magnetNode,
      x,
      y,
    }),
  },
  onElementMagnetPointerDblClick: {
    jointEvent: 'element:magnet:pointerdblclick',
    handler: (
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      magnetNode: SVGElement,
      x: number,
      y: number
    ) => ({
      paper,
      elementView,
      event,
      magnetNode,
      x,
      y,
    }),
  },
  onElementMagnetContextMenu: {
    jointEvent: 'element:magnet:contextmenu',
    handler: (
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      magnetNode: SVGElement,
      x: number,
      y: number
    ) => ({
      paper,
      elementView,
      event,
      magnetNode,
      x,
      y,
    }),
  },

  // --- highlight events ---
  onCellHighlight: {
    jointEvent: 'cell:highlight',
    handler: (
      paper,
      cellView: dia.CellView,
      node: SVGElement,
      options: dia.CellView.EventHighlightOptions
    ) => ({
      paper,
      cellView,
      node,
      options,
    }),
  },
  onCellUnhighlight: {
    jointEvent: 'cell:unhighlight',
    handler: (
      paper,
      cellView: dia.CellView,
      node: SVGElement,
      options: dia.CellView.EventHighlightOptions
    ) => ({
      paper,
      cellView,
      node,
      options,
    }),
  },
  onCellHighlightInvalid: {
    jointEvent: 'cell:highlight:invalid',
    handler: (
      paper,
      cellView: dia.CellView,
      highlighterId: string,
      highlighter: dia.HighlighterView
    ) => ({
      paper,
      cellView,
      highlighterId,
      highlighter,
    }),
  },

  // --- link connection events ---
  onLinkConnect: {
    jointEvent: 'link:connect',
    handler: (
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      newCellView: dia.CellView,
      newCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      paper,
      linkView,
      event,
      newCellView,
      newCellViewMagnet,
      arrowhead,
    }),
  },
  onLinkDisconnect: {
    jointEvent: 'link:disconnect',
    handler: (
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      previousCellView: dia.CellView,
      previousCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      paper,
      linkView,
      event,
      previousCellView,
      previousCellViewMagnet,
      arrowhead,
    }),
  },
  onLinkSnapConnect: {
    jointEvent: 'link:snap:connect',
    handler: (
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      newCellView: dia.CellView,
      newCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      paper,
      linkView,
      event,
      newCellView,
      newCellViewMagnet,
      arrowhead,
    }),
  },
  onLinkSnapDisconnect: {
    jointEvent: 'link:snap:disconnect',
    handler: (
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      previousCellView: dia.CellView,
      previousCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      paper,
      linkView,
      event,
      previousCellView,
      previousCellViewMagnet,
      arrowhead,
    }),
  },

  // --- transform events ---
  onTranslate: {
    jointEvent: 'translate',
    handler: (paper, tx: number, ty: number, data: unknown) => ({ paper, tx, ty, data }),
  },
  onScale: {
    jointEvent: 'scale',
    handler: (paper, sx: number, sy: number, data: unknown) => ({ paper, sx, sy, data }),
  },
  onResize: {
    jointEvent: 'resize',
    handler: (paper, width: number, height: number, data: unknown) => ({
      paper,
      width,
      height,
      data,
    }),
  },
  onTransform: {
    jointEvent: 'transform',
    handler: (paper, matrix: SVGMatrix, data: unknown) => ({ paper, matrix, data }),
  },
  onCustomEvent: {
    jointEvent: 'custom',
    handler: (paper, eventName: string, args: unknown[]) => ({ paper, eventName, args }),
  },
};

/**
 * Handles paper events by listening to the specified event types and invoking the corresponding handlers.
 * @param paper - The paper instance to listen for events on.
 * @param events - An object containing event names and their associated handlers.
 * @returns A function to stop listening for the events.
 */
export function handlePaperEvents(paper: dia.Paper, events: PaperEvents): () => void {
  const controller = new mvc.Listener();

  for (const name in events) {
    const eventName = name as keyof PaperEvents;
    const event = events[eventName];
    if (!event) continue;
    const listener = PAPER_EVENTS_MAPPER[eventName];
    if (!listener) continue;
    controller.listenTo(paper, listener.jointEvent, (...args: never[]) => {
      const objectResult = listener.handler(paper, ...args);
      event(objectResult as never);
    });
  }

  return () => controller.stopListening();
}
