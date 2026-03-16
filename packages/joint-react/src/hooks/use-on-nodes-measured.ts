import { useEffect, useRef, type DependencyList, type RefObject } from 'react';
import { mvc, type dia } from '@joint/core';
import { usePaperStore } from './use-paper';
import { useRefValue } from './use-ref-value';
import { PAPER_ELEMENTS_MEASURED, type ElementsMeasuredEvent } from '../types/event.types';

type PaperTarget = string | dia.Paper | RefObject<dia.Paper | null>;

export interface UseOnElementsMeasuredOptions {
  /** When true, the callback fires only once and then unsubscribes. */
  readonly once?: boolean;
}

type Callback = (event: ElementsMeasuredEvent) => void;

/**
 * Resolves a paper instance from supported target forms.
 * @param target - The paper target (string, Paper instance, or ref).
 * @param paperFromRef - Paper instance from a ref object.
 * @param paperFromCtx - Paper instance from context.
 * @returns The resolved paper instance or null.
 */
function resolvePaper(
  target: PaperTarget | undefined,
  paperFromRef: dia.Paper | null | undefined,
  paperFromCtx: dia.Paper | null
): dia.Paper | null {
  if (!target) return paperFromCtx;
  if (typeof target === 'string') return paperFromCtx;
  if ('current' in target) return paperFromRef ?? null;
  return target;
}

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
 * useOnNodesMeasured(({ isInitial }) => {
 *   if (isInitial) runLayout(graph);
 * });
 * ```
 * @example
 * ```tsx
 * // Fire once, then stop listening
 * useOnNodesMeasured(() => {
 *   paper.transformToFitContent({ padding: 20 });
 * }, [], { once: true });
 * ```
 * @example
 * ```tsx
 * // Using a paper ref
 * const paperRef = useRef<dia.Paper>(null);
 * useOnNodesMeasured(paperRef, () => {
 *   paperRef.current?.transformToFitContent({ padding: 20 });
 * });
 * ```
 */
export function useOnNodesMeasured(
  callback: Callback,
  dependencies?: DependencyList,
  options?: UseOnElementsMeasuredOptions
): void;
export function useOnNodesMeasured(
  target: PaperTarget,
  callback: Callback,
  dependencies?: DependencyList,
  options?: UseOnElementsMeasuredOptions
): void;
export function useOnNodesMeasured(
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

  const isStringTarget = typeof target === 'string';
  const contextStore = usePaperStore(isStringTarget ? target : { isNullable: true });
  const targetRef = target && typeof target === 'object' && 'current' in target ? target : undefined;
  const paperFromRef = useRefValue(targetRef);

  const paperView = isContextForm
    ? (contextStore?.paper ?? null)
    : resolvePaper(target, paperFromRef, contextStore?.paper ?? null);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const once = options?.once ?? false;

  useEffect(() => {
    if (!paperView) return;

    const controller = new mvc.Listener();
    controller.listenTo(paperView, PAPER_ELEMENTS_MEASURED, (event: ElementsMeasuredEvent) => {
      callbackRef.current(event);
      if (once) {
        controller.stopListening();
      }
    });
    return () => controller.stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperView, once, ...(dependencies ?? [])]);
}
