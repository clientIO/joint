import { useLayoutEffect, useRef } from 'react';
import type { dia } from '@joint/core';
import { usePaperStore, useResolvePaperId } from './use-paper';
import type { PaperTarget } from '../types';
import { useGraphStore } from './use-graph-store';
import { useLatestRef } from './use-latest-ref';

/**
 * Payload passed to the {@link useOnElementsMeasured} callback after a
 * measurement pass.
 * @group Types
 * @expand
 */
export interface ElementsMeasuredParams {
  /**
   * True on the first measurement pass (at least one element has been sized),
   * and again on the first pass after a graph reset (`resetCells()`).
   */
  readonly isInitial: boolean;
  /** The paper this hook is bound to (the surrounding `<Paper>` context, or the paper passed via `paperTarget`). */
  readonly paper: dia.Paper;
  /** The graph model associated with the paper. */
  readonly graph: dia.Graph;
}

/**
 * Callback invoked by {@link useOnElementsMeasured} after each measurement pass;
 * receives the {@link ElementsMeasuredParams} payload.
 * @group Types
 */
export type OnElementsMeasured = (params: ElementsMeasuredParams) => void;

/**
 * Calls a callback once element sizes are known, so a layout can run on them.
 *
 * Delivers one event per settled change: the first pass (at least one element
 * has a size), and each later addition or re-measurement, once no element is
 * still waiting. An added element waits until the paper has rendered it; if
 * its content measures itself ({@link useMeasureElement}, {@link HTMLHost}),
 * until that measurement arrives. A batch mixing plain and measured elements
 * is one event, delivered when the last one is measured. An element the paper
 * does not render (viewport culling, `cellVisibility`) and a zero-sized element
 * nothing measures do not hold the event back. A size the application writes
 * itself (`cell.resize()`, controlled `cells` sync) is not a measurement and
 * never fires; listen to `change:size` with {@link useOnGraphEvents} to hear
 * every size change.
 *
 * The callback receives {@link ElementsMeasuredParams}; `isInitial` is `true`
 * for the first event after the hook mounts and again for the first event
 * after a graph reset (`resetCells()`), which replaces the diagram.
 * @title On the current paper
 * @param callback - Called each time element sizes are measured.
 * @group Hooks
 * @example
 * ```tsx
 * import { useOnElementsMeasured } from '@joint/react';
 *
 * // Mount inside a <Paper>: fit the surrounding paper once everything is sized.
 * function FitOnMeasure() {
 *   useOnElementsMeasured(({ paper, isInitial }) => {
 *     if (isInitial) {
 *       paper.transformToFitContent({ padding: 20 });
 *     }
 *   });
 *   return null;
 * }
 * ```
 */
export function useOnElementsMeasured(callback: OnElementsMeasured): void;
/**
 * Calls a callback when element sizes are measured, targeting a specific paper
 * instead of the surrounding context. Useful when several papers share one graph.
 * @title On a specific paper
 * @param paperTarget - Which paper to watch: a registered paper id, a
 *   `dia.Paper` instance, or a React ref to one.
 * @param callback - Called each time element sizes are measured.
 * @group Hooks
 * @example
 * ```tsx
 * import { useOnElementsMeasured } from '@joint/react';
 * import { useRef } from 'react';
 * import type { dia } from '@joint/core';
 *
 * function FitSpecificPaper() {
 *   const paperRef = useRef<dia.Paper>(null);
 *   useOnElementsMeasured(paperRef, ({ paper }) => {
 *     paper.transformToFitContent({ padding: 20 });
 *   });
 *   return null;
 * }
 * ```
 */
export function useOnElementsMeasured(paperTarget: PaperTarget, callback: OnElementsMeasured): void;
export function useOnElementsMeasured(
  paperTargetOrCallback: PaperTarget | OnElementsMeasured,
  callbackArgument?: OnElementsMeasured
): void {
  const isContextForm = typeof paperTargetOrCallback === 'function';

  const paperTarget = isContextForm ? undefined : (paperTargetOrCallback as PaperTarget);
  const callback = isContextForm ? (paperTargetOrCallback as OnElementsMeasured) : (callbackArgument as OnElementsMeasured);

  const paperId = useResolvePaperId(paperTarget);
  const paperStore = usePaperStore(paperId);

  const callbackRef = useLatestRef(callback);

  const graphStore = useGraphStore();
  const { measureState, graph } = graphStore;
  // The `measureGeneration` this hook last reported; a generation it has not
  // seen yet (mount, graph reset) makes the next event `isInitial`.
  const reportedGenerationRef = useRef(-1);
  useLayoutEffect(() => {
    if (!paperStore) return;
    const { paper } = paperStore;
    // A new paper (or graph store) starts its own measurement history, so its
    // first pass reports `isInitial: true` again — e.g. after a dev-server hot
    // reload re-created the store, `transformToFitContent()` callers re-fit.
    reportedGenerationRef.current = -1;

    function handleChanges() {
      // A graph reset clears `measureState`; the reset diagram's own first
      // pass is reported once it settles.
      if (measureState.get() === 0) return;
      const { measureGeneration } = graphStore;
      const isInitial = reportedGenerationRef.current !== measureGeneration;
      reportedGenerationRef.current = measureGeneration;
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
  }, [paperStore, graphStore, measureState, graph, callbackRef]);
}
