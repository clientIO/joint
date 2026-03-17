import { useLayoutEffect, useRef, type DependencyList } from 'react';
import { mvc } from '@joint/core';
import { usePaperStore } from './use-paper';
import { PAPER_ELEMENTS_MEASURED, type ElementsMeasuredEvent } from '../types/event.types';
import { getPaperIdFromReference, type PaperReference } from '../types';

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
 *
 * Wraps the `elements:measured` paper event.
 * @param callback - Called each time element sizes are measured.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @param options - Optional settings (e.g. `{ once: true }`).
 * @group Hooks
 * @example
 * ```tsx
 * // React to every measurement (inside a <Paper> component)
 * useElementsMeasuredEffect(({ isInitial }) => {
 *   if (isInitial) runLayout(graph);
 * });
 * ```
 * @example
 * ```tsx
 * // Fire once, then stop listening
 * useElementsMeasuredEffect(() => {
 *   paper.transformToFitContent({ padding: 20 });
 * }, [], { once: true });
 * ```
 * @example
 * ```tsx
 * // Using a paper ref
 * const paperRef = useRef<dia.Paper>(null);
 * useElementsMeasuredEffect(paperRef, () => {
 *   paperRef.current?.transformToFitContent({ padding: 20 });
 * });
 * ```
 */
export function useElementsMeasuredEffect(
  callback: Callback,
  dependencies?: DependencyList,
  options?: UseOnElementsMeasuredOptions
): void;
export function useElementsMeasuredEffect(
  target: PaperReference,
  callback: Callback,
  dependencies?: DependencyList,
  options?: UseOnElementsMeasuredOptions
): void;
export function useElementsMeasuredEffect(
  targetOrCallback: PaperReference | Callback,
  callbackOrDependencies?: Callback | DependencyList,
  dependenciesOrOptions?: DependencyList | UseOnElementsMeasuredOptions,
  optionsArgument?: UseOnElementsMeasuredOptions
): void {
  const isContextForm = typeof targetOrCallback === 'function';

  const target = isContextForm ? undefined : (targetOrCallback as PaperReference);
  const callback = isContextForm
    ? (targetOrCallback as Callback)
    : (callbackOrDependencies as Callback);
  const dependencies = isContextForm
    ? (callbackOrDependencies as DependencyList | undefined)
    : (dependenciesOrOptions as DependencyList | undefined);
  const options = isContextForm
    ? (dependenciesOrOptions as UseOnElementsMeasuredOptions | undefined)
    : optionsArgument;

  const extractedPaper = getPaperIdFromReference(target);
  const paperStore = usePaperStore(extractedPaper ?? { isNullable: true });

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const once = options?.once ?? false;

  useLayoutEffect(() => {
    if (!paperStore) return;
    const { paper } = paperStore;

    const controller = new mvc.Listener();
    controller.listenTo(paper, PAPER_ELEMENTS_MEASURED, (event: ElementsMeasuredEvent) => {
      callbackRef.current(event);
      if (once) {
        controller.stopListening();
      }
    });
    return () => controller.stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperStore, once, ...(dependencies ?? [])]);
}
