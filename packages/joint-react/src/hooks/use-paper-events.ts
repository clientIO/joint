import { useLayoutEffect, type DependencyList } from 'react';
import { dia } from '@joint/core';
import { usePaperStore, useResolvePaperId } from './use-paper';
import type { PaperStore } from '../store';
import { OPTIONAL, type PaperTarget } from '../types';
import { isRecord, isRef, isString } from '../utils/is';
import { addPaperEventListeners, type PaperEventMap } from '../presets/paper-events';

const EMPTY_DEPENDENCIES: DependencyList = [];

/**
 * Discriminates the first argument of `usePaperEvents` between a paper target
 * and a handlers map.
 * @param value - Candidate first argument.
 * @returns True when the value identifies a paper (id, instance, ref, or
 * `Optional` sentinel).
 */
function isPaperTarget(value: unknown): value is PaperTarget {
  if (isString(value)) return true;
  if (value instanceof dia.Paper) return true;
  if (isRef(value)) return true;
  if (isRecord(value) && value.optional === true) return true;
  return false;
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
 * **Normalized form**: `on<Category><Event>` keys deliver a single context
 * object with named properties.
 * ```tsx
 * usePaperEvents({
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
 * The normalized context omits the React-store `record` — to read the
 * normalised record shape, call `useCell(id, selector)` from your own
 * component (the handler closure has access to the `id` it emits).
 * @param handlers - Event handlers map.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents(handlers: PaperEventMap, dependencies?: DependencyList): void;
/**
 * Subscribes to paper events on the given paper target.
 * @param paper - Paper reference (string ID, dia.Paper instance, ref, or Optional).
 * @param handlers - Event handlers map.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents(
  paper: PaperTarget,
  handlers: PaperEventMap,
  dependencies?: DependencyList
): void;
export function usePaperEvents(
  paperOrHandlers: PaperTarget | PaperEventMap,
  handlersOrDependencies: PaperEventMap | DependencyList = EMPTY_DEPENDENCIES,
  dependenciesArgument: DependencyList = EMPTY_DEPENDENCIES
): void {
  const shouldUseContextPaper = !isPaperTarget(paperOrHandlers);
  const target: PaperTarget = shouldUseContextPaper
    ? OPTIONAL
    : (paperOrHandlers as PaperTarget);
  const handlers = shouldUseContextPaper
    ? (paperOrHandlers as PaperEventMap)
    : (handlersOrDependencies as PaperEventMap);
  const dependencies = shouldUseContextPaper
    ? (handlersOrDependencies as DependencyList)
    : dependenciesArgument;

  const paperId = useResolvePaperId(target);
  const paperStore = usePaperStore(paperId);

  if (shouldUseContextPaper && !paperStore) {
    throw new Error('usePaperEvents without a paper target must be used within a Paper.');
  }

  useLayoutEffect(() => {
    if (!paperStore) return;

    return subscribeToPaperEvents(paperStore, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperStore, ...dependencies]);
}
