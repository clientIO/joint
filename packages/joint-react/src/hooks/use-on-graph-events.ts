import { mvc, type dia } from '@joint/core';
import { useContext } from 'react';
import { GraphStoreContext } from '../context';
import { isRecord } from '../utils/is';
import { useOnEvents } from './use-on-events';

const EMPTY_HANDLERS: GraphEventMap = {};

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
function subscribeToGraphEvents(graph: dia.Graph, handlers: GraphEventMap): () => void {
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
 * Maps JointJS graph event names to their handler callbacks, the shape
 * {@link useOnGraphEvents} accepts. Every entry is optional, list only the
 * events you want to react to. Keys and handler arguments mirror
 * [`dia.Graph` events](https://docs.jointjs.com/api/dia/Graph#events) one to one
 * (`'add'`, `'remove'`, `'change:position'`, …).
 * @group Types
 */
export type GraphEventMap = Partial<dia.Graph.EventMap>;

/**
 * Subscribes to graph events by their native JointJS names, so you can react to
 * cells being added, removed, moved, or otherwise changed without wiring up
 * listeners by hand. This form reads the graph from the surrounding
 * `<GraphProvider>` and throws when used outside one.
 *
 * Handlers are **always-latest**: the subscription is established once and each
 * event reads the current handler, so inline maps and closures need no
 * `useCallback`. Re-subscription happens only when the graph or the set of event
 * names changes.
 *
 * See {@link GraphEventMap} for the available event names and their arguments.
 * @title On the current graph
 * @param handlers - Map of JointJS graph event names to callbacks.
 * @group Hooks
 * @example
 * ```tsx
 * import { GraphProvider, useOnGraphEvents } from '@joint/react';
 *
 * function CellLogger() {
 *   useOnGraphEvents({
 *     add: (cell) => console.log('added', cell.id),
 *     remove: (cell) => console.log('removed', cell.id),
 *     'change:position': (cell) => console.log('moved', cell.id),
 *   });
 *   return null;
 * }
 *
 * // Mount inside a <GraphProvider> so the hook can find the graph.
 * <GraphProvider>
 *   <CellLogger />
 * </GraphProvider>
 * ```
 */
export function useOnGraphEvents(handlers: GraphEventMap): void;
/**
 * Subscribes to graph events on a graph instance you pass in explicitly. Reach
 * for this when you hold a `dia.Graph` outside of any `<GraphProvider>` (e.g. a
 * graph you created yourself). Same always-latest handler semantics as the
 * context form.
 * @title On a specific graph
 * @param graph - The graph instance to listen on.
 * @param handlers - Map of JointJS graph event names to callbacks.
 * @group Hooks
 * @example
 * ```tsx
 * import { dia } from '@joint/core';
 * import { useOnGraphEvents } from '@joint/react';
 *
 * function useGraphLogger(graph: dia.Graph) {
 *   useOnGraphEvents(graph, {
 *     add: (cell) => console.log('added', cell.id),
 *   });
 * }
 * ```
 */
export function useOnGraphEvents(graph: dia.Graph, handlers: GraphEventMap): void;
export function useOnGraphEvents(
  graphOrHandlers: dia.Graph | GraphEventMap,
  handlersArgument?: GraphEventMap
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
