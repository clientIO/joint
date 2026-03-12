import { useEffect, useRef, type DependencyList, type RefObject } from 'react';
import { mvc, type dia } from '@joint/core';
import { usePaperStore } from './use-paper';
import { useRefValue } from './use-ref-value';
import { PAPER_ELEMENTS_SIZE_READY, PAPER_ELEMENTS_SIZE_CHANGE } from '../types/event.types';

type PaperTarget = string | dia.Paper | RefObject<dia.Paper | null>;

/**
 * Resolves a paper instance from supported target forms.
 */
function resolvePaper(
  target: PaperTarget | undefined,
  paperFromRef: dia.Paper | null | undefined,
  contextPaper: dia.Paper | null
): dia.Paper | null {
  if (!target) return contextPaper;
  if (typeof target === 'string') return null;
  if ('current' in target) return paperFromRef ?? null;
  return target;
}

/**
 * Shared implementation for paper-event callback hooks.
 */
function usePaperEventCallback(
  eventName: string,
  targetOrCallback: PaperTarget | (() => void),
  callbackOrDependencies?: (() => void) | DependencyList,
  dependenciesArgument?: DependencyList
): void {
  const isContextForm = typeof targetOrCallback === 'function';

  const target = isContextForm ? undefined : (targetOrCallback as PaperTarget);
  const callback = isContextForm
    ? (targetOrCallback as () => void)
    : (callbackOrDependencies as () => void);
  const dependencies = isContextForm
    ? (callbackOrDependencies as DependencyList | undefined)
    : dependenciesArgument;

  const contextStore = usePaperStore(true);
  const targetRef = target && typeof target === 'object' && 'current' in target ? target : undefined;
  const paperFromRef = useRefValue(targetRef);

  const paper = isContextForm
    ? (contextStore?.paper ?? null)
    : resolvePaper(target, paperFromRef, contextStore?.paper ?? null);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!paper) return;

    const controller = new mvc.Listener();
    controller.listenTo(paper, eventName, () => callbackRef.current());
    return () => controller.stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper, ...(dependencies ?? [])]);
}

/**
 * Calls a callback once when all elements on the paper have been measured
 * (i.e. every element has `width` and `height` greater than the minimum threshold).
 *
 * This is a convenience hook wrapping the `paper:elements:size:ready` event.
 *
 * @param callback - Called once when all elements are measured.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 *
 * @example
 * ```tsx
 * // Using paper context (inside a <Paper> component)
 * useElementsMeasured(() => {
 *   paper.transformToFitContent({ padding: 20 });
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Using a paper ref
 * const paperRef = useRef<dia.Paper>(null);
 * useElementsMeasured(paperRef, () => {
 *   paperRef.current?.transformToFitContent({ padding: 20 });
 * });
 * ```
 */
export function useElementsMeasured(
  callback: () => void,
  dependencies?: DependencyList
): void;
export function useElementsMeasured(
  target: PaperTarget,
  callback: () => void,
  dependencies?: DependencyList
): void;
export function useElementsMeasured(
  targetOrCallback: PaperTarget | (() => void),
  callbackOrDependencies?: (() => void) | DependencyList,
  dependenciesArgument?: DependencyList
): void {
  usePaperEventCallback(PAPER_ELEMENTS_SIZE_READY, targetOrCallback, callbackOrDependencies, dependenciesArgument);
}

/**
 * Calls a callback when element sizes change after the initial measurement.
 *
 * This is a convenience hook wrapping the `paper:elements:size:change` event.
 * It does not fire for the initial size snapshot — only for subsequent changes.
 *
 * @param callback - Called when element sizes change.
 * @param dependencies - Optional dependency array controlling re-subscription.
 * @group Hooks
 *
 * @example
 * ```tsx
 * // Re-run layout when elements resize
 * useElementsResized(() => {
 *   runLayout(graph);
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Using a paper ref
 * const paperRef = useRef<dia.Paper>(null);
 * useElementsResized(paperRef, () => {
 *   runLayout(paperRef.current?.model);
 * });
 * ```
 */
export function useElementsResized(
  callback: () => void,
  dependencies?: DependencyList
): void;
export function useElementsResized(
  target: PaperTarget,
  callback: () => void,
  dependencies?: DependencyList
): void;
export function useElementsResized(
  targetOrCallback: PaperTarget | (() => void),
  callbackOrDependencies?: (() => void) | DependencyList,
  dependenciesArgument?: DependencyList
): void {
  usePaperEventCallback(PAPER_ELEMENTS_SIZE_CHANGE, targetOrCallback, callbackOrDependencies, dependenciesArgument);
}
