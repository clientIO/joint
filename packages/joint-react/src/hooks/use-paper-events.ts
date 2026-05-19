import { useLayoutEffect, type DependencyList } from 'react';
import { usePaperStore, useResolvePaperId } from './use-paper';
import type { PaperStore } from '../store';
import { type PaperTarget } from '../types';
import { addPaperEventListeners, type PaperEventMap } from '../presets/paper-events';

const EMPTY_DEPENDENCIES: DependencyList = [];

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
 * The normalized context omits the React-store `record` — to read the
 * normalised record shape, call `useCell(id, selector)` from your own
 * component (the handler closure has access to the `id` it emits).
 * @param paper - Paper reference (string ID, dia.Paper instance, ref, or Optional).
 * @param handlers - Event handlers map.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents(
  paper: PaperTarget,
  handlers: PaperEventMap,
  dependencies: DependencyList = EMPTY_DEPENDENCIES
): void {
  const paperId = useResolvePaperId(paper);
  const paperStore = usePaperStore(paperId);

  useLayoutEffect(() => {
    if (!paperStore) return;

    return subscribeToPaperEvents(paperStore, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperStore, ...dependencies]);
}
