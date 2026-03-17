import type { dia } from '@joint/core';
import { mvc } from '@joint/core';
import { useLayoutEffect, type DependencyList } from 'react';
import type { PaperEventHandlers } from '../types/event.types';
import { usePaperStore } from './use-paper';
import type { PaperStore } from '../store';
import { resolvePaperId, type AnyString, type PaperTarget } from '../types';
import { useGraphStore } from './use-graph-store';

const EMPTY_DEPENDENCIES: DependencyList = [];

interface PaperEventsBaseContext {
  readonly graph: dia.Graph;
  readonly paper: dia.Paper;
}
export type PaperEventsContext<T = Record<AnyString, unknown>> = PaperEventsBaseContext & T;

type HandlersOrFactory<T> =
  | PaperEventHandlers
  | ((ctx: PaperEventsContext<T>) => PaperEventHandlers);

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
 * Subscribes all handlers to a paper using mvc.Listener.
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
  const controller = new mvc.Listener();
  const ctx = buildEventContext<T>(paperStore, graph);

  const handlers =
    typeof handlersOrFactory === 'function' ? handlersOrFactory(ctx) : handlersOrFactory;

  for (const eventName in handlers) {
    const handler = handlers[eventName];
    if (!handler) continue;
    controller.listenTo(paperStore.paper, eventName, (...args: Parameters<mvc.EventHandler>) => {
      handler(...args);
    });
  }

  return () => controller.stopListening();
}

/**
 * Subscribes to paper events using original JointJS event names.
 *
 * **Context form** (must be inside a `Paper`):
 * ```tsx
 * usePaperEvents({ 'element:pointerclick': (view, event, x, y) => {} });
 * ```
 *
 * **Callback form** (access to graph, paper, and features via context):
 * ```tsx
 * usePaperEvents(({ graph, paper }) => ({
 *   'element:pointerclick': (view, event, x, y) => {}
 * }));
 * ```
 *
 * **ID form** (outside Paper, by paper id):
 * ```tsx
 * usePaperEvents(paperId, { 'element:pointerclick': (view, event, x, y) => {} });
 * ```
 * @param paper - Paper reference (string ID, dia.Paper instance, ref, or Nullable).
 * @param handlers - Event handlers map or factory function receiving context.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents<T = Record<AnyString, unknown>>(
  paper: PaperTarget,
  handlers: HandlersOrFactory<T>,
  dependencies: DependencyList = EMPTY_DEPENDENCIES
): void {
  const paperId = resolvePaperId(paper);
  const paperStore = usePaperStore(paperId ?? { isNullable: true });
  const graphStore = useGraphStore();

  useLayoutEffect(() => {
    if (!paperStore) return;

    return subscribeToPaperEvents(paperStore, graphStore.graph, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphStore, paperStore, ...dependencies]);
}
