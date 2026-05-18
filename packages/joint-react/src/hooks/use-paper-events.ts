import type { dia } from '@joint/core';
import { useLayoutEffect, type DependencyList } from 'react';
import { usePaperStore, useResolvePaperId } from './use-paper';
import type { PaperStore } from '../store';
import { type PaperTarget } from '../types';
import { useGraphStore } from './use-graph-store';
import { addPaperEventListeners, type PaperEventMap } from '../presets/paper-events';

const EMPTY_DEPENDENCIES: DependencyList = [];

interface PaperEventsBaseContext {
  readonly graph: dia.Graph;
  readonly paper: dia.Paper;
}
/** Context handed to the event-handlers factory: the paper, graph, and any user-provided extras. */
export type PaperEventsContext<T = Record<string, unknown>> = PaperEventsBaseContext & T;

type HandlersOrFactory<T> = PaperEventMap | ((ctx: PaperEventsContext<T>) => PaperEventMap);

/**
 * Builds the EventContext from paperStore and graph.
 * @param paperStore - The paper store containing paper and features.
 * @param graph - The JointJS graph instance.
 * @returns The event context with graph, paper, and feature instances.
 */
export function buildEventContext<T>(
  paperStore: PaperStore,
  graph: dia.Graph
): PaperEventsContext<T> {
  const featureInstances: Record<string, unknown> = {};
  for (const featureId in paperStore.features) {
    const { instance } = paperStore.features[featureId] ?? {};
    if (instance) {
      featureInstances[featureId] = instance;
    }
  }
  return {
    graph,
    paper: paperStore.paper,
    ...featureInstances,
  } as PaperEventsContext<T>;
}

/**
 * Subscribes all handlers to a paper, resolving the factory form against the
 * React paperStore + graph and delegating runtime wiring to
 * {@link addPaperEventListeners}.
 * @param paperStore - Paper store to subscribe on.
 * @param graph - JointJS graph instance.
 * @param handlersOrFactory - Event handlers map or factory function returning handlers.
 * @returns Cleanup callback that stops all listeners.
 */
export function subscribeToPaperEvents<T>(
  paperStore: PaperStore,
  graph: dia.Graph,
  handlersOrFactory: HandlersOrFactory<T>
): () => void {
  const handlers =
    typeof handlersOrFactory === 'function'
      ? handlersOrFactory(buildEventContext<T>(paperStore, graph))
      : handlersOrFactory;
  return addPaperEventListeners(paperStore.paper, handlers);
}

/**
 * Subscribes to paper events. Two key forms can be mixed in the same handlers
 * map:
 *
 * **Normalized form**: `on<Category><Event>` keys deliver a single context
 * object with named properties.
 * ```tsx
 * usePaperEvents(paperId, {
 *   onElementPointerClick: ({ id, model, paper, graph, event, x, y }) => {},
 *   onBlankPointerClick: ({ paper, graph, event, x, y }) => {},
 * });
 * ```
 *
 * **Raw form**: native JointJS event names with positional arguments. Use
 * for events without a normalized counterpart (`'resize'`, `'transform'`,
 * `'render:done'`, `'cell:highlight'`, …).
 * ```tsx
 * usePaperEvents(paperId, {
 *   'element:pointerclick': (view, evt, x, y) => {},
 *   resize: (width, height, data) => {},
 * });
 * ```
 *
 * **Callback form** — pass a factory receiving the paper / graph context:
 * ```tsx
 * usePaperEvents(paperId, ({ graph, paper }) => ({
 *   onElementPointerClick: ({ model }) => model.attr('body/fill', 'red'),
 * }));
 * ```
 *
 * The normalized context omits the React-store `record` — to read the
 * normalised record shape, call `useCell(id, selector)` from your own
 * component (the handler closure has access to the `id` it emits).
 * @param paper - Paper reference (string ID, dia.Paper instance, ref, or Optional).
 * @param handlers - Event handlers map or factory function receiving context.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents<T = Record<string, unknown>>(
  paper: PaperTarget,
  handlers: HandlersOrFactory<T>,
  dependencies: DependencyList = EMPTY_DEPENDENCIES
): void {
  const paperId = useResolvePaperId(paper);
  const paperStore = usePaperStore(paperId);
  const graphStore = useGraphStore();

  useLayoutEffect(() => {
    if (!paperStore) return;

    return subscribeToPaperEvents(paperStore, graphStore.graph, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphStore, paperStore, ...dependencies]);
}
