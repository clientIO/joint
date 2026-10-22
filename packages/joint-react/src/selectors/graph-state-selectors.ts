import type { GraphState } from '../store/graph-state';

/**
 * Selects the sizing version of the diagram, a value to react to: `0` while the
 * element sizes are not known, and otherwise a number that changes each time the
 * sizes settle. That is the first pass, and each later addition, removal or
 * re-measurement, once no element is still waiting to be measured. It is `0`
 * again after a graph reset, or when no element is left, until the diagram
 * settles anew. A value is never reused, so it works as an effect
 * dependency; treat it as opaque beyond "zero or not".
 *
 * Sizes the application writes itself (`cell.resize()`, controlled `cells`
 * sync) are not measurements and do not change it.
 *
 * Pass it to {@link useGraphState} or {@link useOnGraphStateChange}, or call it
 * from your own selector. A hook that reads only the sizing version does no
 * work on other graph changes (a drag, for example).
 * @param state - The graph state.
 * @returns The sizing version, `0` when nothing is measured yet.
 * @group Selectors
 * @example
 * ```tsx
 * import { useOnGraphStateChange, selectGraphSizingVersion, useGraph } from '@joint/react';
 *
 * // Re-run a layout each time the element sizes settle.
 * function AutoLayout() {
 *   const { graph } = useGraph();
 *   useOnGraphStateChange(selectGraphSizingVersion, (sizingVersion) => {
 *     if (sizingVersion) runLayout(graph);
 *   });
 *   return null;
 * }
 * ```
 */
export const selectGraphSizingVersion = (state: Pick<GraphState, 'sizingVersion'>): number =>
  state.sizingVersion;

/**
 * Selects whether the element sizes of the diagram are known: `false` until the
 * sizes first settle, and again after a graph reset, or when no element is
 * left, until the diagram settles anew. Use it when something should happen
 * once per diagram, such as fitting the paper; use
 * {@link selectGraphSizingVersion} to react to every later change too.
 *
 * Pass it to {@link useGraphState} or {@link useOnGraphStateChange}, or call it
 * from your own selector.
 * @param state - The graph state.
 * @returns `true` once the element sizes are known.
 * @group Selectors
 * @example
 * ```tsx
 * import { useLayoutEffect } from 'react';
 * import { useGraphState, usePaper, selectIsGraphSizingComplete } from '@joint/react';
 *
 * // Mount inside a <Paper>: fit the paper once the sizes are known.
 * function FitOnMeasure() {
 *   const { paper } = usePaper();
 *   const isSizingComplete = useGraphState(selectIsGraphSizingComplete);
 *   useLayoutEffect(() => {
 *     if (isSizingComplete && paper) paper.transformToFitContent({ padding: 20 });
 *   }, [isSizingComplete, paper]);
 *   return null;
 * }
 * ```
 */
export const selectIsGraphSizingComplete = (state: Pick<GraphState, 'sizingVersion'>): boolean =>
  state.sizingVersion > 0;
