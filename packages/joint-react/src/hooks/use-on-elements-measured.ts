import { useLayoutEffect, useRef } from 'react';
import { usePaperStore, useResolvePaperId } from './use-paper';
import { type ElementsMeasuredEvent } from '../types/event.types';
import type { PaperTarget } from '../types';
import { useGraphStore } from './use-graph-store';

type Callback = (event: ElementsMeasuredEvent) => void;

/**
 * Calls a callback when element sizes are measured or re-measured.
 *
 * Fires on initial measurement (all elements have `width` and `height`)
 * and on subsequent size changes detected by the paper.
 *
 * The callback receives `{ isInitial: boolean }` to distinguish the
 * first measurement from subsequent ones.
 * @param callback - Called each time element sizes are measured.
 * @group Hooks
 * @example
 * ```tsx
 * // Using a paper ref
 * const paperRef = useRef<dia.Paper>(null);
 * useOnElementsMeasured(paperRef, () => {
 *   paperRef.current?.transformToFitContent({ padding: 20 });
 * });
 * ```
 */
export function useOnElementsMeasured(callback: Callback): void;
export function useOnElementsMeasured(paperTarget: PaperTarget, callback: Callback): void;
export function useOnElementsMeasured(
  paperTargetOrCallback: PaperTarget | Callback,
  callbackArgument?: Callback
): void {
  const isContextForm = typeof paperTargetOrCallback === 'function';

  const paperTarget = isContextForm ? undefined : (paperTargetOrCallback as PaperTarget);
  const callback = isContextForm ? (paperTargetOrCallback as Callback) : (callbackArgument as Callback);

  const paperId = useResolvePaperId(paperTarget);
  const paperStore = usePaperStore(paperId);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { measureState, graph } = useGraphStore();
  const wasMeasuredRef = useRef(false);
  useLayoutEffect(() => {
    if (!paperStore) return;
    const { paper } = paperStore;

    function handleChanges() {
      const value = measureState.get();
      const isMeasured = value > 0;
      const isInitial = isMeasured && !wasMeasuredRef.current;
      if (isInitial) {
        wasMeasuredRef.current = true;
      }
      callbackRef.current({ isInitial, paper, graph });
      // The user callback may have moved cells via cell.position()/cell.size().
      // PaperView runs in async mode, so those updates would be queued for the
      // next rAF — producing a one-frame flash where the element is visible at its
      // pre-layout position. Flush them synchronously so the next paint already
      // reflects the post-layout state.
      paper.updateViews();
    }
    // Flush any measurement that happened before subscription (e.g. initial
    // data sync ran before this paperStore was available).
    if (measureState.get() > 0) {
      handleChanges();
    }
    const unsubscribe = measureState.subscribe(handleChanges);
    return () => {
      unsubscribe();
    };
  }, [paperStore, measureState, graph]);
}
