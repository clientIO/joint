import { usePaperStore, useResolvePaperId } from './use-paper';
import type { PaperStore } from '../store';
import type { PaperTarget } from '../types';
import { isPaperTarget } from '../utils/resolve-paper-target';
import { addPaperEventListeners, type OnPaperEvents } from '../presets/paper-events';
import { useOnEvents } from './use-on-events';

const EMPTY_HANDLERS: OnPaperEvents = {};

/**
 * Subscribes all handlers to a paper, delegating runtime wiring to
 * {@link addPaperEventListeners}.
 * @param paperStore - Paper store to subscribe on.
 * @param handlers - Event handlers map.
 * @returns Cleanup callback that stops all listeners.
 */
export function subscribeToPaperEvents(
  paperStore: PaperStore,
  handlers: OnPaperEvents
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
 * useOnPaperEvents({
 *   onElementPointerClick: ({ id, model, paper, graph, event, x, y }) => {},
 *   onBlankPointerClick: ({ paper, graph, event, x, y }) => {},
 * });
 * ```
 *
 * **Raw form**: native JointJS event names with positional arguments. Use
 * for events without an `on*` counterpart (`'render:done'`,
 * `'cell:highlight'`, …).
 * ```tsx
 * useOnPaperEvents(paperId, {
 *   'element:pointerclick': (view, evt, x, y) => {},
 *   'render:done': (stats) => {},
 * });
 * ```
 *
 * Handlers are **always-latest**: the subscription is established once and
 * each event reads the current handler, so inline maps and closures need no
 * `useCallback`. Re-subscription happens only when the paper or the set of
 * event names changes.
 *
 * The `on*` params object omits the React-store `record` — to read the
 * record shape, call `useCell(id, selector)` from your own
 * component (the handler closure has access to the `id` it emits).
 * @param handlers - Event handlers map.
 * @group Hooks
 */
export function useOnPaperEvents(handlers: OnPaperEvents): void;
/**
 * Subscribes to paper events on the given paper target.
 * @param paperTarget - Paper reference (string ID, dia.Paper instance, or ref).
 * @param handlers - Event handlers map.
 * @group Hooks
 */
export function useOnPaperEvents(paperTarget: PaperTarget, handlers: OnPaperEvents): void;
export function useOnPaperEvents(
  paperTargetOrHandlers: PaperTarget | OnPaperEvents,
  handlersArgument?: OnPaperEvents
): void {
  const isTargetForm = isPaperTarget(paperTargetOrHandlers);
  const paperTarget = isTargetForm ? paperTargetOrHandlers : undefined;
  const handlers = isTargetForm ? handlersArgument ?? EMPTY_HANDLERS : paperTargetOrHandlers;

  const paperId = useResolvePaperId(paperTarget);
  const paperStore = usePaperStore(paperId);

  useOnEvents(paperStore, handlers, subscribeToPaperEvents);
}
