import { useLayoutEffect, type DependencyList } from 'react';
import { usePaperStore, useResolvePaperId } from './use-paper';
import type { PaperStore } from '../store';
import type { PaperTarget } from '../types';
import { isPaperTarget } from '../utils/resolve-paper-target';
import { addPaperEventListeners, type PaperEventMap } from '../presets/paper-events';

const EMPTY_DEPENDENCIES: DependencyList = [];
const EMPTY_HANDLERS: PaperEventMap = {};

/**
 * Distinguishes a `PaperEventMap` map (a plain object) from a `DependencyList`
 * (an array) — used to resolve the overloaded second argument without casts.
 * @param value - The handlers-or-dependencies argument.
 * @returns True when `value` is a handlers map rather than a dependency list.
 */
function isPaperEventMap(value: PaperEventMap | DependencyList): value is PaperEventMap {
  return !Array.isArray(value);
}

/** Resolved {@link usePaperEvents} arguments. */
interface ResolvedPaperEventMapArgs {
  readonly target: PaperTarget | undefined;
  readonly handlers: PaperEventMap;
  readonly dependencies: DependencyList;
}

/**
 * Resolves the overloaded `usePaperEvents` arguments into a paper target, a
 * handlers map, and a dependency list — using runtime type guards, no casts.
 * @param paperTargetOrHandlers - First arg: a paper target, or the handlers map.
 * @param handlersOrDependencies - Second arg: handlers (target form) or dependencies (context form).
 * @param dependenciesArgument - Third arg: dependencies (target form only).
 * @returns The resolved target, handlers, and dependencies.
 */
function resolvePaperEventMapArgs(
  paperTargetOrHandlers: PaperTarget | PaperEventMap,
  handlersOrDependencies: PaperEventMap | DependencyList,
  dependenciesArgument: DependencyList
): ResolvedPaperEventMapArgs {
  if (!isPaperTarget(paperTargetOrHandlers)) {
    // usePaperEvents(handlers, dependencies?)
    const dependencies = isPaperEventMap(handlersOrDependencies)
      ? EMPTY_DEPENDENCIES
      : handlersOrDependencies;
    return { target: undefined, handlers: paperTargetOrHandlers, dependencies };
  }
  // usePaperEvents(paperTarget, handlers, dependencies?)
  const handlers = isPaperEventMap(handlersOrDependencies) ? handlersOrDependencies : EMPTY_HANDLERS;
  return { target: paperTargetOrHandlers, handlers, dependencies: dependenciesArgument };
}

/**
 * Subscribes all handlers to a paper, delegating runtime wiring to
 * {@link addPaperEventListeners}.
 * @param paperStore - Paper store to subscribe on.
 * @param handlers - Event handlers map.
 * @returns Cleanup callback that stops all listeners.
 */
export function subscribeToPaperEvents(
  paperStore: PaperStore,
  handlers: PaperEventMap
): () => void {
  return addPaperEventListeners(paperStore.paper, handlers);
}

/**
 * Subscribes to paper events. The paper argument is optional — when omitted
 * the hook reads the active paper from the surrounding `Paper` context (it
 * throws if no `Paper` context is available). Two key forms can be mixed in
 * the same handlers map:
 *
 * **CamelCase form**: `on<Category><Event>` keys deliver a single params
 * object with named properties.
 * ```tsx
 * usePaperEvents({
 *   onElementPointerClick: ({ id, model, paper, graph, event, x, y }) => {},
 *   onBlankPointerClick: ({ paper, graph, event, x, y }) => {},
 * });
 * ```
 *
 * **Raw form**: native JointJS event names with positional arguments. Use
 * for events without an `on*` counterpart (`'resize'`, `'transform'`,
 * `'render:done'`, `'cell:highlight'`, …).
 * ```tsx
 * usePaperEvents(paperId, {
 *   'element:pointerclick': (view, evt, x, y) => {},
 *   resize: (width, height, data) => {},
 * });
 * ```
 *
 * The `on*` params object omits the React-store `record` — to read the
 * record shape, call `useCell(id, selector)` from your own
 * component (the handler closure has access to the `id` it emits).
 * @param handlers - Event handlers map.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents(handlers: PaperEventMap, dependencies?: DependencyList): void;
/**
 * Subscribes to paper events on the given paper target.
 * @param paperTarget - Paper reference (string ID, dia.Paper instance, or ref).
 * @param handlers - Event handlers map.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents(
  paperTarget: PaperTarget,
  handlers: PaperEventMap,
  dependencies?: DependencyList
): void;
export function usePaperEvents(
  paperTargetOrHandlers: PaperTarget | PaperEventMap,
  handlersOrDependencies: PaperEventMap | DependencyList = EMPTY_DEPENDENCIES,
  dependenciesArgument: DependencyList = EMPTY_DEPENDENCIES
): void {
  const { target, handlers, dependencies } = resolvePaperEventMapArgs(
    paperTargetOrHandlers,
    handlersOrDependencies,
    dependenciesArgument
  );

  const paperId = useResolvePaperId(target);
  const paperStore = usePaperStore(paperId);

  useLayoutEffect(() => {
    if (!paperStore) return;
    return subscribeToPaperEvents(paperStore, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperStore, ...dependencies]);
}
