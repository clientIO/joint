import { mvc, type dia } from '@joint/core';
import { useLayoutEffect, type DependencyList } from 'react';
import type {
  GraphEventHandlers,
  GraphEventName,
  GraphEventOptions,
  GraphEventPayload,
  PaperEventHandlers,
  PaperEventType,
  PaperListenerPayload,
} from '../types/event.types';
import { usePaperById } from './use-paper';

const EMPTY_DEPENDENCIES: DependencyList = [];

/**
 * Normalizes graph event options to an object shape.
 * @param value - Raw event options value emitted by JointJS.
 * @returns Normalized options object.
 */
function getGraphEventOptions(value: unknown): GraphEventOptions {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as GraphEventOptions;
}

/**
 * Type guard for graph layer collection-like values.
 * @param value - Candidate runtime value.
 * @returns True when the value behaves like a graph layer collection.
 */
function isGraphLayerCollection(value: unknown): value is dia.GraphLayerCollection {
  return !!value && typeof value === 'object' && 'models' in (value as object);
}

/**
 * Creates a normalized payload object for typed graph events.
 * @param graph - Source graph instance.
 * @param eventName - Graph event name.
 * @param args - Raw JointJS event arguments.
 * @returns Normalized typed graph payload.
 */
function createGraphEventPayload<EventName extends GraphEventName>(
  graph: dia.Graph,
  eventName: EventName,
  args: unknown[]
): GraphEventPayload<EventName> {
  if (eventName === 'add' || eventName === 'remove') {
    const [cell, collection, options] = args as [
      dia.Cell,
      mvc.Collection<dia.Cell>,
      GraphEventOptions,
    ];
    return {
      graph,
      eventName,
      args: [cell, collection, getGraphEventOptions(options)],
      cell,
      collection,
      options: getGraphEventOptions(options),
    } as GraphEventPayload<EventName>;
  }
  if (eventName === 'change' || eventName.startsWith('change:')) {
    const [cell, options] = args as [dia.Cell, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [cell, getGraphEventOptions(options)],
      cell,
      options: getGraphEventOptions(options),
    } as GraphEventPayload<EventName>;
  }
  if (eventName === 'reset') {
    const [collection, options] = args as [mvc.Collection<dia.Cell>, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [collection, getGraphEventOptions(options)],
      collection,
      cells: collection.models,
      options: getGraphEventOptions(options),
    } as GraphEventPayload<EventName>;
  }
  if (eventName === 'sort') {
    const [collection, options] = args as [mvc.Collection<dia.Cell>, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [collection, getGraphEventOptions(options)],
      collection,
      options: getGraphEventOptions(options),
    } as GraphEventPayload<EventName>;
  }
  if (eventName === 'move') {
    const [cell, options] = args as [dia.Cell, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [cell, getGraphEventOptions(options)],
      cell,
      options: getGraphEventOptions(options),
    } as GraphEventPayload<EventName>;
  }
  if (eventName === 'batch:start' || eventName === 'batch:stop') {
    const [data] = args as [GraphEventOptions];
    return {
      graph,
      eventName,
      args: [getGraphEventOptions(data)],
      data: getGraphEventOptions(data),
    } as GraphEventPayload<EventName>;
  }
  if (eventName.startsWith('layer:')) {
    const [layer, collectionOrOptions, options] = args as [
      dia.GraphLayer,
      mvc.Collection<dia.GraphLayer> | GraphEventOptions,
      GraphEventOptions,
    ];
    const collection = isGraphLayerCollection(collectionOrOptions)
      ? (collectionOrOptions as mvc.Collection<dia.GraphLayer>)
      : null;
    const resolvedOptions = collection ? options : collectionOrOptions;
    return {
      graph,
      eventName,
      args: [layer, collection ?? resolvedOptions, getGraphEventOptions(options)],
      layer,
      collection,
      options: getGraphEventOptions(resolvedOptions),
    } as unknown as GraphEventPayload<EventName>;
  }
  const [layerCollection, options] = args as [dia.GraphLayerCollection, GraphEventOptions];
  return {
    graph,
    eventName,
    args: [layerCollection, getGraphEventOptions(options)],
    layerCollection: layerCollection ?? null,
    options: getGraphEventOptions(options),
  } as unknown as GraphEventPayload<EventName>;
}

/**
 * Registers typed paper event handlers on a listener controller.
 * @param controller - Listener controller used for event subscriptions.
 * @param paper - Source paper instance.
 * @param handlers - Typed paper event handlers map.
 */
function registerPaperEventHandlers(
  controller: mvc.Listener<[]>,
  paper: dia.Paper,
  handlers: PaperEventHandlers
) {
  const graph = paper.model;
  for (const eventKey in handlers) {
    if (eventKey === 'customEvents') continue;
    const eventName = eventKey as PaperEventType;
    const handler = handlers[eventName];
    if (!handler) continue;
    controller.listenTo(paper, eventName, (...args: Parameters<mvc.EventHandler>) => {
      const payload: PaperListenerPayload<PaperEventType> = {
        graph,
        paper,
        eventName,
        args: args as never,
      };
      handler(payload as never);
    });
  }
  if (!handlers.customEvents) return;
  for (const customEventName in handlers.customEvents) {
    const customEventHandler = handlers.customEvents[customEventName];
    if (!customEventHandler) continue;
    controller.listenTo(paper, customEventName, (...args: Parameters<mvc.EventHandler>) => {
      customEventHandler({ graph, paper, eventName: customEventName, args });
    });
  }
}

/**
 * Registers typed graph event handlers on a listener controller.
 * @param controller - Listener controller used for event subscriptions.
 * @param graph - Source graph instance.
 * @param handlers - Typed graph event handlers map.
 */
function registerGraphEventHandlers(
  controller: mvc.Listener<[]>,
  graph: dia.Graph,
  handlers: GraphEventHandlers
) {
  for (const eventKey in handlers) {
    const eventName = eventKey as GraphEventName;
    const handler = handlers[eventName];
    if (!handler) continue;
    controller.listenTo(graph, eventName, (...args: unknown[]) => {
      handler(createGraphEventPayload(graph, eventName, args) as never);
    });
  }
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
    const controller = new mvc.Listener();
    if (targetOrPaper === 'paper') {
      if (!paperById) {
        throw new Error(`Paper with id "${paperIdOrHandlers as string}" was not found.`);
      }
      registerPaperEventHandlers(
        controller,
        paperById,
        handlersOrDependencies as PaperEventHandlers
      );
      return () => controller.stopListening();
    }

    if ('matrix' in targetOrPaper) {
      registerPaperEventHandlers(
        controller,
        targetOrPaper as dia.Paper,
        paperIdOrHandlers as PaperEventHandlers
      );
      return () => controller.stopListening();
    }

    registerGraphEventHandlers(
      controller,
      targetOrPaper as dia.Graph,
      paperIdOrHandlers as GraphEventHandlers
    );
    return () => controller.stopListening();
  }, [targetOrPaper, paperById, paperIdOrHandlers, handlersOrDependencies, dependencies]);
}
