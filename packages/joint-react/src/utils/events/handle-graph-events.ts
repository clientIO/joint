import { mvc, type dia } from '@joint/core';
import type {
  GraphEventHandlers,
  GraphEventName,
  GraphEventOptions,
  GraphEventPayloadByHandlerName,
  GraphNormalizedEventName,
} from '../../types/event.types';

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
 * Converts normalized graph event handler key to JointJS event name.
 * @param eventName - Normalized graph event handler key.
 * @returns JointJS event name used by graph.listenTo.
 */
function toJointGraphEventName(eventName: GraphNormalizedEventName): GraphEventName {
  if (eventName === 'batchStart') return 'batch:start';
  if (eventName === 'batchStop') return 'batch:stop';
  if (eventName.startsWith('change') && eventName !== 'change') {
    return `change:${eventName.slice('change'.length, 'change'.length + 1).toLowerCase()}${eventName.slice('change'.length + 1)}`;
  }
  if (eventName.startsWith('layer') && !eventName.startsWith('layers')) {
    return `layer:${eventName.slice('layer'.length, 'layer'.length + 1).toLowerCase()}${eventName.slice('layer'.length + 1)}`;
  }
  if (eventName.startsWith('layers')) {
    return `layers:${eventName.slice('layers'.length, 'layers'.length + 1).toLowerCase()}${eventName.slice('layers'.length + 1)}`;
  }
  return eventName as GraphEventName;
}

/**
 * Creates a normalized payload object for typed graph events.
 * @param graph - Source graph instance.
 * @param eventName - Normalized graph event key.
 * @param jointEventName - Underlying JointJS event name.
 * @param args - Raw JointJS event arguments.
 * @returns Normalized typed graph payload.
 */
function createGraphEventPayload(
  graph: dia.Graph,
  eventName: GraphNormalizedEventName,
  jointEventName: GraphEventName,
  args: unknown[]
): GraphEventPayloadByHandlerName<GraphNormalizedEventName> {
  if (jointEventName === 'add' || jointEventName === 'remove') {
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
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  if (jointEventName === 'change' || jointEventName.startsWith('change:')) {
    const [cell, options] = args as [dia.Cell, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [cell, getGraphEventOptions(options)],
      cell,
      options: getGraphEventOptions(options),
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  if (jointEventName === 'reset') {
    const [collection, options] = args as [mvc.Collection<dia.Cell>, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [collection, getGraphEventOptions(options)],
      collection,
      cells: collection.models,
      options: getGraphEventOptions(options),
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  if (jointEventName === 'sort') {
    const [collection, options] = args as [mvc.Collection<dia.Cell>, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [collection, getGraphEventOptions(options)],
      collection,
      options: getGraphEventOptions(options),
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  if (jointEventName === 'move') {
    const [cell, options] = args as [dia.Cell, GraphEventOptions];
    return {
      graph,
      eventName,
      args: [cell, getGraphEventOptions(options)],
      cell,
      options: getGraphEventOptions(options),
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  if (jointEventName === 'batch:start' || jointEventName === 'batch:stop') {
    const [data] = args as [GraphEventOptions];
    return {
      graph,
      eventName,
      args: [getGraphEventOptions(data)],
      data: getGraphEventOptions(data),
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  if (jointEventName.startsWith('layer:')) {
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
      jointEventName,
    } as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
  }
  const [layerCollection, options] = args as [dia.GraphLayerCollection, GraphEventOptions];
  return {
    graph,
    eventName,
    args: [layerCollection, getGraphEventOptions(options)],
    layerCollection: layerCollection ?? null,
    options: getGraphEventOptions(options),
    jointEventName,
  } as unknown as GraphEventPayloadByHandlerName<GraphNormalizedEventName>;
}

/**
 * Handles graph events by listening to normalized event keys and converting payloads.
 * @param graph - The graph instance to listen for events on.
 * @param events - Normalized graph event handlers.
 * @returns A function to stop listening for the events.
 */
export function handleGraphEvents(graph: dia.Graph, events: GraphEventHandlers): () => void {
  const controller = new mvc.Listener();

  for (const eventKey in events) {
    const eventName = eventKey as GraphNormalizedEventName;
    const handler = events[eventName];
    if (!handler) continue;

    const jointEventName = toJointGraphEventName(eventName);
    controller.listenTo(graph, jointEventName, (...args: unknown[]) => {
      handler(createGraphEventPayload(graph, eventName, jointEventName, args) as never);
    });
  }

  return () => controller.stopListening();
}
