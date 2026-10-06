import type { dia } from '@joint/core';
import type { CellId } from '../types/cell.types';
import { createSourceSelector } from './source-selector';

/**
 * Selects the measured state of the diagram, a value to react to: `0` while the
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
 * Pass it directly to {@link useCells} or {@link useOnCellsChange} in their
 * all-cells form. The hook then listens to the measurement only, so it does no
 * work on other commits (a drag, for example).
 * @returns The measured state, `0` when nothing is measured yet.
 * @group Selectors
 * @example
 * ```tsx
 * import { useOnCellsChange, selectMeasuredState, useGraph } from '@joint/react';
 *
 * // Re-run a layout each time the element sizes settle.
 * function AutoLayout() {
 *   const { graph } = useGraph();
 *   useOnCellsChange(selectMeasuredState, (measuredState) => {
 *     if (measuredState) runLayout(graph);
 *   });
 *   return null;
 * }
 * ```
 */
export const selectMeasuredState = createSourceSelector(
  ({ measurement }) => measurement.stateSource,
  0
);

/**
 * Selects whether the element sizes of the diagram are known: `false` until the
 * sizes first settle, and again after a graph reset, or when no element is
 * left, until the diagram settles anew. Use it when something should happen
 * once per diagram, such as fitting the paper; use
 * {@link selectMeasuredState} to react to every later change too.
 *
 * Pass it directly to {@link useCells} or {@link useOnCellsChange} in their
 * all-cells form.
 * @returns `true` once the element sizes are known.
 * @group Selectors
 * @example
 * ```tsx
 * import { useLayoutEffect } from 'react';
 * import { useCells, usePaper, selectIsMeasured } from '@joint/react';
 *
 * // Mount inside a <Paper>: fit the paper once the sizes are known.
 * function FitOnMeasure() {
 *   const { paper } = usePaper();
 *   const isMeasured = useCells(selectIsMeasured);
 *   useLayoutEffect(() => {
 *     if (isMeasured && paper) paper.transformToFitContent({ padding: 20 });
 *   }, [isMeasured, paper]);
 *   return null;
 * }
 * ```
 */
export const selectIsMeasured = createSourceSelector(
  ({ measurement }) => measurement.isMeasuredSource,
  false
);

const NO_SIZES: ReadonlyMap<CellId, dia.Size> = new Map();

/**
 * Selects the size of every element, by id. The map is the same reference
 * until a size changes, an element is added or removed, or the graph is reset,
 * so a component reading it does not re-render while elements are only moved.
 * It changes for every size, including one the application writes itself
 * (`cell.resize()`, a resize tool).
 *
 * To run a layout when sizes are known, prefer {@link selectMeasuredState}: a
 * layout that resizes elements would change this map again.
 *
 * Pass it directly to {@link useCells} or {@link useOnCellsChange} in their
 * all-cells form. The hook then listens to size changes only, so it does no
 * work on other commits (a drag, for example).
 * @returns The element sizes, keyed by element id.
 * @group Selectors
 * @example
 * ```tsx
 * import { useCells, selectElementsSizes } from '@joint/react';
 *
 * function WidestElement() {
 *   const sizes = useCells(selectElementsSizes);
 *   let widest = 0;
 *   for (const { width } of sizes.values()) widest = Math.max(widest, width);
 *   return <span>{widest}</span>;
 * }
 * ```
 */
export const selectElementsSizes = createSourceSelector(
  ({ measurement }) => measurement.sizesSource,
  NO_SIZES
);
