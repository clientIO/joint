import { mvc, type dia } from '@joint/core';
import { useContext } from 'react';
import { GraphStoreContext } from '../context';
import { isRecord } from '../utils/is';
import { useOnEvents } from './use-on-events';

const EMPTY_HANDLERS: OnGraphEvents = {};

/**
 * Checks if a value is a JointJS graph instance.
 * @param value - Candidate value.
 * @returns True when value behaves like `dia.Graph`.
 */
function isGraphInstance(value: unknown): value is dia.Graph {
  return isRecord(value) && 'addCell' in value;
}

/**
 * Subscribes all handlers to a graph using mvc.Listener.
 * @param graph - Graph instance to subscribe on.
 * @param handlers - Event handlers keyed by JointJS graph event names.
 * @returns Cleanup callback that stops all listeners.
 */
function subscribeToGraphEvents(graph: dia.Graph, handlers: OnGraphEvents): () => void {
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
 * The map of graph events to handlers accepted by {@link useOnGraphEvents}.
 */
export type OnGraphEvents = Partial<dia.Graph.EventMap>;

/**
 * Subscribes to graph events using original JointJS event names.
 *
 * Handlers are **always-latest**: the subscription is established once and
 * each event reads the current handler, so inline maps and closures need no
 * `useCallback`. Re-subscription happens only when the graph or the set of
 * event names changes.
 * @param handlers - Event handlers map keyed by JointJS graph event names.
 * @group Hooks
 */
export function useOnGraphEvents(handlers: OnGraphEvents): void;
/**
 * Subscribes to graph events on the given graph instance.
 * @param graph - Graph instance to subscribe on.
 * @param handlers - Event handlers map keyed by JointJS graph event names.
 * @group Hooks
 */
export function useOnGraphEvents(graph: dia.Graph, handlers: OnGraphEvents): void;
export function useOnGraphEvents(
  graphOrHandlers: dia.Graph | OnGraphEvents,
  handlersArgument?: OnGraphEvents
): void {
  const graphStore = useContext(GraphStoreContext);
  const isTargetForm = isGraphInstance(graphOrHandlers);

  if (!isTargetForm && !graphStore) {
    throw new Error('useOnGraphEvents without a graph target must be used within a GraphProvider.');
  }

  const graph = isTargetForm ? graphOrHandlers : graphStore?.graph ?? null;
  const handlers = isTargetForm ? handlersArgument ?? EMPTY_HANDLERS : graphOrHandlers;

  useOnEvents(graph, handlers, subscribeToGraphEvents);
}
