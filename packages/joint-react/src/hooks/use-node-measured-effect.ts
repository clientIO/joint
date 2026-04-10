import { useLayoutEffect, useRef, type DependencyList } from 'react';
import { usePaperStore, useResolvePaperId } from './use-paper';
import { type ElementsMeasuredEvent } from '../types/event.types';
import type { PaperTarget } from '../types';
import { useGraphStore } from './use-graph-store';

export interface UseOnElementsMeasuredOptions {
  /** When true, the callback fires only once and then unsubscribes. */
  readonly once?: boolean;
}

type Callback = (event: ElementsMeasuredEvent) => void;

/**
 * Calls a callback when element sizes are measured or re-measured.
 *
 * Fires on initial measurement (all elements have `width` and `height`)
 * and on subsequent size changes detected by the paper.
 *
 * The callback receives `{ isInitial: boolean }` to distinguish the
 * first measurement from subsequent ones.
 *
 * Pass `{ once: true }` to automatically unsubscribe after the first call.
 * @param callback - Called each time element sizes are measured.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @param options - Optional settings (e.g. `{ once: true }`).
 * @group Hooks
 * @example
 * ```tsx
 * // Fire once, then stop listening
 * useNodesMeasuredEffect(() => {
 *   paper.transformToFitContent({ padding: 20 });
 * }, [], { once: true });
 * ```
 * @example
 * ```tsx
 * // Using a paper ref
 * const paperRef = useRef<dia.Paper>(null);
 * useNodesMeasuredEffect(paperRef, () => {
 *   paperRef.current?.transformToFitContent({ padding: 20 });
 * });
 * ```
 */
export function useNodesMeasuredEffect(
  callback: Callback,
  dependencies?: DependencyList,
  options?: UseOnElementsMeasuredOptions
): void;
export function useNodesMeasuredEffect(
  target: PaperTarget,
  callback: Callback,
  dependencies?: DependencyList,
  options?: UseOnElementsMeasuredOptions
): void;
export function useNodesMeasuredEffect(
  targetOrCallback: PaperTarget | Callback,
  callbackOrDependencies?: Callback | DependencyList,
  dependenciesOrOptions?: DependencyList | UseOnElementsMeasuredOptions,
  optionsArgument?: UseOnElementsMeasuredOptions
): void {
  const isContextForm = typeof targetOrCallback === 'function';

  const target = isContextForm ? undefined : (targetOrCallback as PaperTarget);
  const callback = isContextForm
    ? (targetOrCallback as Callback)
    : (callbackOrDependencies as Callback);
  const dependencies = isContextForm
    ? (callbackOrDependencies as DependencyList | undefined)
    : (dependenciesOrOptions as DependencyList | undefined);
  const options = isContextForm
    ? (dependenciesOrOptions as UseOnElementsMeasuredOptions | undefined)
    : optionsArgument;

  const paperId = useResolvePaperId(target);
  const paperStore = usePaperStore(paperId);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const once = options?.once ?? false;
  const { measureState, graph } = useGraphStore();
  const wasMeasuredRef = useRef(false);
  useLayoutEffect(() => {
    if (!paperStore) return;
    const { paper } = paperStore;

    function handleChanges() {
      const value = measureState.get();
      const isMeasured = value > 0;
      if (isMeasured && !wasMeasuredRef.current) {
        wasMeasuredRef.current = true;
        callbackRef.current({ isInitial: true, paper, graph });
        return;
      }
      callbackRef.current({ isInitial: false, paper, graph });
    }
    const unsubscribeMeasureState = measureState.subscribe(handleChanges);
    return () => {
      unsubscribeMeasureState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperStore, once, ...(dependencies ?? [])]);
}
