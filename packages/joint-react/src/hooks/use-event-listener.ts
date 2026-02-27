import type { dia } from '@joint/core';
import { useLayoutEffect, type DependencyList } from 'react';
import type {
  GraphEventHandlers,
  PaperEventHandlers,
  PaperEventsHandlerKey,
} from '../types/event.types';
import { handleGraphEvents } from '../utils/events/handle-graph-events';
import { handlePaperEvents } from '../utils/events/handle-paper-events';
import { usePaperById } from './use-paper';

const EMPTY_DEPENDENCIES: DependencyList = [];

/**
 * Converts normalized paper handler key to normalized event name payload value.
 * @param handlerName - Handler key in PaperEventHandlers.
 * @returns Normalized event name (e.g. `onElementContextMenu` -> `elementContextMenu`).
 */
function normalizePaperEventName(handlerName: PaperEventsHandlerKey): string {
  return handlerName.startsWith('on')
    ? `${handlerName.slice(2, 3).toLowerCase()}${handlerName.slice(3)}`
    : handlerName;
}


/**
 * Registers typed paper event handlers by delegating to handlePaperEvents.
 * @param paper - Source paper instance.
 * @param handlers - Typed paper event handlers map.
 * @returns Paper unsubscribe function.
 */
function registerPaperEventHandlers(paper: dia.Paper, handlers: PaperEventHandlers): () => void {
  const graph = paper.model;
  const paperEvents: Record<string, unknown> = {};

  for (const eventKey in handlers) {
    if (eventKey === 'customEvents') continue;
    const handlerName = eventKey as PaperEventsHandlerKey;
    const handler = handlers[handlerName];
    if (!handler) continue;

    paperEvents[handlerName] = (payload: Record<string, unknown>) => {
      handler({
        ...payload,
        eventName: normalizePaperEventName(handlerName),
      } as never);
    };
  }

  if (handlers.customEvents) {
    paperEvents.customEvents = handlers.customEvents;
  }

  return handlePaperEvents(graph, paper, paperEvents as never);
}


export function useEventListener(
  target: dia.Graph,
  handlers: GraphEventHandlers,
  dependencies?: DependencyList
): void;
/**
 * Subscribes to typed JointJS graph or paper events with normalized payloads.
 * @param target - Graph instance or paper identifier to listen to.
 * @param handlers - Map of event handlers keyed by event name.
 * @param dependencies - Optional dependency array for effect re-subscription.
 * @group Hooks
 */
export function useEventListener(
  target: dia.Paper,
  handlers: PaperEventHandlers,
  dependencies?: DependencyList
): void;
export function useEventListener(
  target: 'paper',
  paperId: string,
  handlers: PaperEventHandlers,
  dependencies?: DependencyList
): void;
export function useEventListener(
  targetOrPaper: dia.Graph | dia.Paper | 'paper',
  paperIdOrHandlers: string | GraphEventHandlers | PaperEventHandlers,
  handlersOrDependencies: PaperEventHandlers | DependencyList = EMPTY_DEPENDENCIES,
  dependenciesArgument: DependencyList = EMPTY_DEPENDENCIES
) {
  const isPaperByIdTarget = targetOrPaper === 'paper';
  const paperById = usePaperById(isPaperByIdTarget ? (paperIdOrHandlers as string) : '');
  const dependencies = isPaperByIdTarget
    ? dependenciesArgument
    : (handlersOrDependencies as DependencyList);

  useLayoutEffect(() => {
    if (targetOrPaper === 'paper') {
      if (!paperById) {
        throw new Error(`Paper with id "${paperIdOrHandlers as string}" was not found.`);
      }
      return registerPaperEventHandlers(paperById, handlersOrDependencies as PaperEventHandlers);
    }

    if ('matrix' in targetOrPaper) {
      return registerPaperEventHandlers(
        targetOrPaper as dia.Paper,
        paperIdOrHandlers as PaperEventHandlers
      );
    }

    return handleGraphEvents(targetOrPaper as dia.Graph, paperIdOrHandlers as GraphEventHandlers);
  }, [targetOrPaper, paperById, paperIdOrHandlers, handlersOrDependencies, dependencies]);
}
