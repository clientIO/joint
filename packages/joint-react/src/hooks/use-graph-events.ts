import { mvc, type dia } from '@joint/core';
import { useContext, useLayoutEffect, type DependencyList } from 'react';
import { GraphStoreContext } from '../context';
import type { GraphEventHandlers } from '../types/event.types';

const EMPTY_DEPENDENCIES: DependencyList = [];

/**
 * Checks if a value is a JointJS graph instance.
 * @param value - Candidate value.
 * @returns True when value behaves like `dia.Graph`.
 */
function isGraphInstance(value: unknown): value is dia.Graph {
  return !!value && typeof value === 'object' && 'addCell' in (value as object);
}

/**
 * Subscribes all handlers to a graph using mvc.Listener.
 * @param graph - Graph instance to subscribe on.
 * @param handlers - Event handlers keyed by JointJS graph event names.
 * @returns Cleanup callback that stops all listeners.
 */
function subscribeToGraphEvents(graph: dia.Graph, handlers: GraphEventHandlers): () => void {
  const controller = new mvc.Listener();

  for (const eventName in handlers) {
    const handler = handlers[eventName];
    if (!handler) continue;

    controller.listenTo(graph, eventName, (...args: Parameters<mvc.EventHandler>) => {
      handler(...args);
    });
  }

  return () => controller.stopListening();
}

/**
 * Subscribes to graph events using original JointJS event names.
 * @param handlers - Event handlers map keyed by JointJS graph event names.
 * @param dependencies - Optional dependencies controlling re-subscription.
 * @group Hooks
 */
export function useGraphEvents(
  handlers: GraphEventHandlers,
  dependencies?: DependencyList
): void;
export function useGraphEvents(
  graph: dia.Graph,
  handlers: GraphEventHandlers,
  dependencies?: DependencyList
): void;
export function useGraphEvents(
  graphOrHandlers: dia.Graph | GraphEventHandlers,
  handlersOrDependencies: GraphEventHandlers | DependencyList = EMPTY_DEPENDENCIES,
  dependenciesArgument: DependencyList = EMPTY_DEPENDENCIES
): void {
  const graphStore = useContext(GraphStoreContext);
  const shouldUseContextGraph = !isGraphInstance(graphOrHandlers);

  if (shouldUseContextGraph && !graphStore) {
    throw new Error('useGraphEvents without a graph target must be used within a GraphProvider.');
  }

  const graph = shouldUseContextGraph ? graphStore?.graph ?? null : graphOrHandlers;
  const handlers = shouldUseContextGraph
    ? (graphOrHandlers as GraphEventHandlers)
    : (handlersOrDependencies as GraphEventHandlers);
  const dependencies = shouldUseContextGraph
    ? (handlersOrDependencies as DependencyList)
    : dependenciesArgument;

  useLayoutEffect(() => {
    if (!graph) {
      return;
    }

    return subscribeToGraphEvents(graph, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, handlers, ...dependencies]);
}
