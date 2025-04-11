/* eslint-disable sonarjs/max-switch-cases */
import type { dia, mvc } from '@joint/core';
import type { PaperEventType, PaperEvents } from '../types/event.types';

/**
 * Calls the matching PaperEvents handler if it exists.
 * @param type - The event type.
 * @param events - The PaperEvents object.
 * @param paper - The paper instance.
 * @param args - The arguments to pass to the event handler.
 */
export function handleEvent(
  type: PaperEventType,
  events: PaperEvents,
  paper: dia.Paper,
  ...args: unknown[]
): void {
  switch (type) {
    case 'render:done': {
      const [stats, opt] = args as [dia.Paper.UpdateStats, unknown];
      events.onRenderDone?.({ stats, opt, paper });
      break;
    }

    case 'cell:pointerclick': {
      const [cellView, event, x, y] = args as [dia.CellView, dia.Event, number, number];
      events.onCellPointerClick?.({ cellView, event, x, y, paper });
      break;
    }

    case 'element:pointerclick': {
      const [elementView, event, x, y] = args as [dia.ElementView, dia.Event, number, number];
      events.onElementPointerClick?.({ elementView, event, x, y, paper });
      break;
    }

    case 'link:pointerclick': {
      const [linkView, event, x, y] = args as [dia.LinkView, dia.Event, number, number];
      events.onLinkPointerClick?.({ linkView, event, x, y, paper });
      break;
    }

    case 'blank:pointerclick': {
      const [event, x, y] = args as [dia.Event, number, number];
      events.onBlankPointerClick?.({ event, x, y, paper });
      break;
    }

    case 'cell:pointerdblclick': {
      const [cellView, event, x, y] = args as [dia.CellView, dia.Event, number, number];
      events.onCellPointerDblClick?.({ cellView, event, x, y, paper });
      break;
    }

    case 'element:pointerdblclick': {
      const [elementView, event, x, y] = args as [dia.ElementView, dia.Event, number, number];
      events.onElementPointerDblClick?.({ elementView, event, x, y, paper });
      break;
    }

    case 'link:pointerdblclick': {
      const [linkView, event, x, y] = args as [dia.LinkView, dia.Event, number, number];
      events.onLinkPointerDblClick?.({ linkView, event, x, y, paper });
      break;
    }

    case 'blank:pointerdblclick': {
      const [event, x, y] = args as [dia.Event, number, number];
      events.onBlankPointerDblClick?.({ event, x, y, paper });
      break;
    }

    case 'cell:contextmenu': {
      const [cellView, event, x, y] = args as [dia.CellView, dia.Event, number, number];
      events.onCellContextMenu?.({ cellView, event, x, y, paper });
      break;
    }

    case 'element:contextmenu': {
      const [elementView, event, x, y] = args as [dia.ElementView, dia.Event, number, number];
      events.onElementContextMenu?.({ elementView, event, x, y, paper });
      break;
    }

    case 'link:contextmenu': {
      const [linkView, event, x, y] = args as [dia.LinkView, dia.Event, number, number];
      events.onLinkContextMenu?.({ linkView, event, x, y, paper });
      break;
    }

    case 'blank:contextmenu': {
      const [event, x, y] = args as [dia.Event, number, number];
      events.onBlankContextMenu?.({ event, x, y, paper });
      break;
    }

    case 'paper:pan': {
      const [event, deltaX, deltaY] = args as [dia.Event, number, number];
      events.onPan?.({ event, deltaX, deltaY, paper });
      break;
    }

    case 'paper:pinch': {
      const [event, x, y, scale] = args as [dia.Event, number, number, number];
      events.onPinch?.({ event, x, y, scale, paper });
      break;
    }

    case 'element:magnet:pointerclick': {
      const [elementView, event, magnetNode, x, y] = args as [
        dia.ElementView,
        dia.Event,
        SVGElement,
        number,
        number,
      ];
      events.onElementMagnetPointerClick?.({ elementView, event, magnetNode, x, y, paper });
      break;
    }

    case 'element:magnet:pointerdblclick': {
      const [elementView, event, magnetNode, x, y] = args as [
        dia.ElementView,
        dia.Event,
        SVGElement,
        number,
        number,
      ];
      events.onElementMagnetPointerDblClick?.({ elementView, event, magnetNode, x, y, paper });
      break;
    }

    case 'element:magnet:contextmenu': {
      const [elementView, event, magnetNode, x, y] = args as [
        dia.ElementView,
        dia.Event,
        SVGElement,
        number,
        number,
      ];
      events.onElementMagnetContextMenu?.({ elementView, event, magnetNode, x, y, paper });
      break;
    }

    case 'cell:highlight': {
      const [cellView, node, options] = args as [
        dia.CellView,
        SVGElement,
        dia.CellView.EventHighlightOptions,
      ];
      events.onCellHighlight?.({ cellView, node, options, paper });
      break;
    }

    case 'cell:unhighlight': {
      const [cellView, node, options] = args as [
        dia.CellView,
        SVGElement,
        dia.CellView.EventHighlightOptions,
      ];
      events.onCellUnhighlight?.({ cellView, node, options, paper });
      break;
    }

    case 'cell:highlight:invalid': {
      const [cellView, highlighterId, highlighter] = args as [
        dia.CellView,
        string,
        dia.HighlighterView,
      ];
      events.onCellHighlightInvalid?.({ cellView, highlighterId, highlighter, paper });
      break;
    }

    case 'link:connect': {
      const [linkView, event, newCellView, newCellViewMagnet, arrowhead] = args as [
        dia.LinkView,
        dia.Event,
        dia.CellView,
        SVGElement,
        dia.LinkEnd,
      ];
      events.onLinkConnect?.({ linkView, event, newCellView, newCellViewMagnet, arrowhead, paper });
      break;
    }

    case 'link:disconnect': {
      const [linkView, event, previousCellView, previousCellViewMagnet, arrowhead] = args as [
        dia.LinkView,
        dia.Event,
        dia.CellView,
        SVGElement,
        dia.LinkEnd,
      ];
      events.onLinkDisconnect?.({
        linkView,
        event,
        previousCellView,
        previousCellViewMagnet,
        arrowhead,
        paper,
      });
      break;
    }

    case 'link:snap:connect': {
      const [linkView, event, newCellView, newCellViewMagnet, arrowhead] = args as [
        dia.LinkView,
        dia.Event,
        dia.CellView,
        SVGElement,
        dia.LinkEnd,
      ];
      events.onLinkSnapConnect?.({
        linkView,
        event,
        newCellView,
        newCellViewMagnet,
        arrowhead,
        paper,
      });
      break;
    }

    case 'link:snap:disconnect': {
      const [linkView, event, previousCellView, previousCellViewMagnet, arrowhead] = args as [
        dia.LinkView,
        dia.Event,
        dia.CellView,
        SVGElement,
        dia.LinkEnd,
      ];
      events.onLinkSnapDisconnect?.({
        linkView,
        event,
        previousCellView,
        previousCellViewMagnet,
        arrowhead,
        paper,
      });
      break;
    }
    case 'link:mouseenter': {
      const [linkView, event] = args as [dia.LinkView, dia.Event];
      events.onLinkMouseEnter?.({ linkView, event, paper });
      break;
    }
    case 'link:mouseleave': {
      const [linkView, event] = args as [dia.LinkView, dia.Event];
      events.onLinkMouseLeave?.({ linkView, event, paper });
      break;
    }

    case 'custom': {
      const [eventName, ...eventArgs] = args as [string, ...Parameters<mvc.EventHandler>];
      events.onCustom?.({ eventName, args: eventArgs, paper });
      break;
    }

    case 'cell:mouseover': {
      const [cellView, event] = args as [dia.CellView, dia.Event];
      events.onCellMouseOver?.({ cellView, event, paper });
      break;
    }
    case 'element:mouseover': {
      const [elementView, event] = args as [dia.ElementView, dia.Event];
      events.onElementMouseOver?.({ elementView, event, paper });
      break;
    }
    case 'link:mouseover': {
      const [linkView, event] = args as [dia.LinkView, dia.Event];
      events.onLinkMouseOver?.({ linkView, event, paper });
      break;
    }
    case 'blank:mouseover': {
      const [event] = args as [dia.Event];
      events.onBlankMouseOver?.({ event, paper });
      break;
    }

    case 'cell:mouseout': {
      const [cellView, event] = args as [dia.CellView, dia.Event];
      events.onCellMouseOut?.({ cellView, event, paper });
      break;
    }
    case 'element:mouseout': {
      const [elementView, event] = args as [dia.ElementView, dia.Event];
      events.onElementMouseOut?.({ elementView, event, paper });
      break;
    }
    case 'link:mouseout': {
      const [linkView, event] = args as [dia.LinkView, dia.Event];
      events.onLinkMouseOut?.({ linkView, event, paper });
      break;
    }
    case 'blank:mouseout': {
      const [event] = args as [dia.Event];
      events.onBlankMouseOut?.({ event, paper });
      break;
    }

    case 'cell:mouseenter': {
      const [cellView, event] = args as [dia.CellView, dia.Event];
      events.onCellMouseEnter?.({ cellView, event, paper });
      break;
    }
    case 'element:mouseenter': {
      const [elementView, event] = args as [dia.ElementView, dia.Event];
      events.onElementMouseEnter?.({ elementView, event, paper });
      break;
    }

    case 'blank:mouseenter': {
      const [event] = args as [dia.Event];
      events.onBlankMouseEnter?.({ event, paper });
      break;
    }

    case 'cell:mouseleave': {
      const [cellView, event] = args as [dia.CellView, dia.Event];
      events.onCellMouseLeave?.({ cellView, event, paper });
      break;
    }
    case 'element:mouseleave': {
      const [elementView, event] = args as [dia.ElementView, dia.Event];
      events.onElementMouseLeave?.({ elementView, event, paper });
      break;
    }

    case 'blank:mouseleave': {
      const [event] = args as [dia.Event];
      events.onBlankMouseLeave?.({ event, paper });
      break;
    }

    default: {
      break;
    }
  }
}
