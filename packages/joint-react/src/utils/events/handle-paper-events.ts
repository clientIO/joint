import type { dia } from '@joint/core';
import { mvc } from '@joint/core';
import type { EventMap, PaperEvents } from '../../types/event.types';

export const PAPER_EVENTS_MAPPER: {
  [K in keyof PaperEvents]?: {
    jointEvent: keyof EventMap;
    handler: (graph: dia.Graph, paper: dia.Paper, ...args: never[]) => unknown;
  };
} = {
  // --- render ---
  onRenderDone: {
    jointEvent: 'render:done',
    handler: (graph, paper, stats: dia.Paper.UpdateStats, opt: unknown) => ({
      graph,
      paper,
      stats,
      opt,
    }),
  },

  // --- pointer click ---
  onCellPointerClick: {
    jointEvent: 'cell:pointerclick',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerClick: {
    jointEvent: 'element:pointerclick',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number
    ) => ({
      graph,
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerClick: {
    jointEvent: 'link:pointerclick',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerClick: {
    jointEvent: 'blank:pointerclick',
    handler: (graph, paper, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      event,
      x,
      y,
    }),
  },

  // --- pointer dblclick ---
  onCellPointerDblClick: {
    jointEvent: 'cell:pointerdblclick',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerDblClick: {
    jointEvent: 'element:pointerdblclick',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number
    ) => ({
      graph,
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerDblClick: {
    jointEvent: 'link:pointerdblclick',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerDblClick: {
    jointEvent: 'blank:pointerdblclick',
    handler: (graph, paper, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      event,
      x,
      y,
    }),
  },

  // --- contextmenu ---
  onCellContextMenu: {
    jointEvent: 'cell:contextmenu',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementContextMenu: {
    jointEvent: 'element:contextmenu',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number
    ) => ({
      graph,
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkContextMenu: {
    jointEvent: 'link:contextmenu',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankContextMenu: {
    jointEvent: 'blank:contextmenu',
    handler: (graph, paper, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      event,
      x,
      y,
    }),
  },

  // --- pointer down ---
  onCellPointerDown: {
    jointEvent: 'cell:pointerdown',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerDown: {
    jointEvent: 'element:pointerdown',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number
    ) => ({
      graph,
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerDown: {
    jointEvent: 'link:pointerdown',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerDown: {
    jointEvent: 'blank:pointerdown',
    handler: (graph, paper, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      event,
      x,
      y,
    }),
  },

  // --- pointer move ---
  onCellPointerMove: {
    jointEvent: 'cell:pointermove',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerMove: {
    jointEvent: 'element:pointermove',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number
    ) => ({
      graph,
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerMove: {
    jointEvent: 'link:pointermove',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerMove: {
    jointEvent: 'blank:pointermove',
    handler: (graph, paper, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      event,
      x,
      y,
    }),
  },

  // --- pointer up ---
  onCellPointerUp: {
    jointEvent: 'cell:pointerup',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      cellView,
      event,
      x,
      y,
    }),
  },
  onElementPointerUp: {
    jointEvent: 'element:pointerup',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number
    ) => ({
      graph,
      paper,
      elementView,
      event,
      x,
      y,
    }),
  },
  onLinkPointerUp: {
    jointEvent: 'link:pointerup',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      linkView,
      event,
      x,
      y,
    }),
  },
  onBlankPointerUp: {
    jointEvent: 'blank:pointerup',
    handler: (graph, paper, event: dia.Event, x: number, y: number) => ({
      graph,
      paper,
      event,
      x,
      y,
    }),
  },

  // --- mouse over/out ---
  onCellMouseOver: {
    jointEvent: 'cell:mouseover',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event) => ({
      graph,
      paper,
      cellView,
      event,
    }),
  },
  onElementMouseOver: {
    jointEvent: 'element:mouseover',
    handler: (graph, paper, elementView: dia.ElementView, event: dia.Event) => ({
      graph,
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseOver: {
    jointEvent: 'link:mouseover',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event) => ({
      graph,
      paper,
      linkView,
      event,
    }),
  },
  onBlankMouseOver: {
    jointEvent: 'blank:mouseover',
    handler: (graph, paper, event: dia.Event) => ({ graph, paper, event }),
  },

  onCellMouseOut: {
    jointEvent: 'cell:mouseout',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event) => ({
      graph,
      paper,
      cellView,
      event,
    }),
  },
  onElementMouseOut: {
    jointEvent: 'element:mouseout',
    handler: (graph, paper, elementView: dia.ElementView, event: dia.Event) => ({
      graph,
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseOut: {
    jointEvent: 'link:mouseout',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event) => ({
      graph,
      paper,
      linkView,
      event,
    }),
  },
  onBlankMouseOut: {
    jointEvent: 'blank:mouseout',
    handler: (graph, paper, event: dia.Event) => ({ graph, paper, event }),
  },

  // --- mouse enter/leave ---
  onCellMouseEnter: {
    jointEvent: 'cell:mouseenter',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event) => ({
      graph,
      paper,
      cellView,
      event,
    }),
  },
  onElementMouseEnter: {
    jointEvent: 'element:mouseenter',
    handler: (graph, paper, elementView: dia.ElementView, event: dia.Event) => ({
      graph,
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseEnter: {
    jointEvent: 'link:mouseenter',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event) => ({
      graph,
      paper,
      linkView,
      event,
    }),
  },
  onBlankMouseEnter: {
    jointEvent: 'blank:mouseenter',
    handler: (graph, paper, event: dia.Event) => ({ graph, paper, event }),
  },

  onCellMouseLeave: {
    jointEvent: 'cell:mouseleave',
    handler: (graph, paper, cellView: dia.CellView, event: dia.Event) => ({
      graph,
      paper,
      cellView,
      event,
    }),
  },
  onElementMouseLeave: {
    jointEvent: 'element:mouseleave',
    handler: (graph, paper, elementView: dia.ElementView, event: dia.Event) => ({
      graph,
      paper,
      elementView,
      event,
    }),
  },
  onLinkMouseLeave: {
    jointEvent: 'link:mouseleave',
    handler: (graph, paper, linkView: dia.LinkView, event: dia.Event) => ({
      graph,
      paper,
      linkView,
      event,
    }),
  },
  onBlankMouseLeave: {
    jointEvent: 'blank:mouseleave',
    handler: (graph, paper, event: dia.Event) => ({ graph, paper, event }),
  },

  // --- mouse wheel ---
  onCellMouseWheel: {
    jointEvent: 'cell:mousewheel',
    handler: (
      graph,
      paper,
      cellView: dia.CellView,
      event: dia.Event,
      x: number,
      y: number,
      delta: number
    ) => ({
      graph,
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
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      x: number,
      y: number,
      delta: number
    ) => ({
      graph,
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
      graph,
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      x: number,
      y: number,
      delta: number
    ) => ({
      graph,
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
    handler: (graph, paper, event: dia.Event, x: number, y: number, delta: number) => ({
      graph,
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
    handler: (graph, paper, event: dia.Event, deltaX: number, deltaY: number) => ({
      graph,
      paper,
      event,
      deltaX,
      deltaY,
    }),
  },
  onPinch: {
    jointEvent: 'paper:pinch',
    handler: (graph, paper, event: dia.Event, x: number, y: number, scale: number) => ({
      graph,
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
    handler: (graph, paper, event: dia.Event) => ({ graph, paper, event }),
  },
  onPaperMouseLeave: {
    jointEvent: 'paper:mouseleave',
    handler: (graph, paper, event: dia.Event) => ({ graph, paper, event }),
  },

  // --- magnet events ---
  onElementMagnetPointerClick: {
    jointEvent: 'element:magnet:pointerclick',
    handler: (
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      magnetNode: SVGElement,
      x: number,
      y: number
    ) => ({
      graph,
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
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      magnetNode: SVGElement,
      x: number,
      y: number
    ) => ({
      graph,
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
      graph,
      paper,
      elementView: dia.ElementView,
      event: dia.Event,
      magnetNode: SVGElement,
      x: number,
      y: number
    ) => ({
      graph,
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
      graph,
      paper,
      cellView: dia.CellView,
      node: SVGElement,
      options: dia.CellView.EventHighlightOptions
    ) => ({
      graph,
      paper,
      cellView,
      node,
      options,
    }),
  },
  onCellUnhighlight: {
    jointEvent: 'cell:unhighlight',
    handler: (
      graph,
      paper,
      cellView: dia.CellView,
      node: SVGElement,
      options: dia.CellView.EventHighlightOptions
    ) => ({
      graph,
      paper,
      cellView,
      node,
      options,
    }),
  },
  onCellHighlightInvalid: {
    jointEvent: 'cell:highlight:invalid',
    handler: (
      graph,
      paper,
      cellView: dia.CellView,
      highlighterId: string,
      highlighter: dia.HighlighterView
    ) => ({
      graph,
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
      graph,
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      newCellView: dia.CellView,
      newCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      graph,
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
      graph,
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      previousCellView: dia.CellView,
      previousCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      graph,
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
      graph,
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      newCellView: dia.CellView,
      newCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      graph,
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
      graph,
      paper,
      linkView: dia.LinkView,
      event: dia.Event,
      previousCellView: dia.CellView,
      previousCellViewMagnet: SVGElement,
      arrowhead: dia.LinkEnd
    ) => ({
      graph,
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
    handler: (graph, paper, tx: number, ty: number, data: unknown) => ({
      graph,
      paper,
      tx,
      ty,
      data,
    }),
  },
  onScale: {
    jointEvent: 'scale',
    handler: (graph, paper, sx: number, sy: number, data: unknown) => ({
      graph,
      paper,
      sx,
      sy,
      data,
    }),
  },
  onResize: {
    jointEvent: 'resize',
    handler: (graph, paper, width: number, height: number, data: unknown) => ({
      graph,
      paper,
      width,
      height,
      data,
    }),
  },
  onTransform: {
    jointEvent: 'transform',
    handler: (graph, paper, matrix: SVGMatrix, data: unknown) => ({ graph, paper, matrix, data }),
  },
  customEvents: {
    jointEvent: 'custom',
    handler: (graph, paper: dia.Paper, eventName: string, args: unknown[]) => ({
      graph,
      paper,
      eventName,
      args,
    }),
  },
};

export const PAPER_EVENT_KEYS: Set<keyof PaperEvents> = new Set(
  Object.keys(PAPER_EVENTS_MAPPER) as Array<keyof PaperEvents>
);

/**
 * Handles paper events by listening to the specified event types and invoking the corresponding handlers.
 * @param graph - The graph instance associated with the paper.
 * @param paper - The paper instance to listen for events on.
 * @param events - An object containing event names and their associated handlers.
 * @returns A function to stop listening for the events.
 */
export function handlePaperEvents(
  graph: dia.Graph,
  paper: dia.Paper,
  events: PaperEvents
): () => void {
  const controller = new mvc.Listener();

  for (const name in events) {
    const eventName = name as keyof PaperEvents;
    if (eventName === 'customEvents' && events.customEvents) {
      for (const customEventName in events.customEvents) {
        const customEventHandler = events.customEvents[customEventName];
        if (customEventHandler) {
          controller.listenTo(paper, customEventName, (...args: Parameters<mvc.EventHandler>) => {
            customEventHandler({ eventName: customEventName, args, paper, graph });
          });
        }
      }
      continue;
    }
    const event = events[eventName];
    if (!event) continue;
    const listener = PAPER_EVENTS_MAPPER[eventName];
    if (!listener) continue;

    controller.listenTo(paper, listener.jointEvent, (...args: never[]) => {
      const objectResult = listener.handler(graph, paper, ...args);
      if (typeof event === 'function') {
        event(objectResult as never);
      }
    });
  }

  return () => controller.stopListening();
}
