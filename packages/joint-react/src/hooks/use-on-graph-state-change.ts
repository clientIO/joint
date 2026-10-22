import type { AnyCellRecord, CellRecord } from '../types/cell.types';
import type { GraphStateSelector, SelectedEqual } from '../store/graph-state';
import { useWatchGraphState, type OnGraphStateChange } from './use-watch-graph-state';

export type { OnGraphStateChange } from './use-watch-graph-state';

/**
 * Runs a callback when a value selected from the graph state changes, without
 * re-rendering the component: {@link useGraphState} as an effect. The callback
 * runs once when the hook mounts and then synchronously with each store change
 * that changes the selected value, before React re-renders its subscribers.
 *
 * It takes the same selectors and equality functions as {@link useGraphState}
 * and subscribes the same way, to what the selector reads. A new selector
 * function is run when the component re-renders, and calls back only if it
 * selects another value, so an inline selector is fine as long as it is cheap.
 * @template Cell - Input cell record shape (defaults to CellRecord); reads resolve to its Computed form.
 * @template Selected - The selector's return type.
 * @param selector - Derives the value to watch from the graph state.
 * @param onChange - Called with the new and the previous value.
 * @param isEqual - Custom equality for the selected value.
 * @group Hooks
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
export function useOnGraphStateChange<Cell extends AnyCellRecord = CellRecord, Selected = unknown>(
  selector: GraphStateSelector<Cell, Selected>,
  onChange: OnGraphStateChange<Selected>,
  isEqual?: SelectedEqual<Selected>
): void {
  useWatchGraphState(selector, onChange, isEqual);
}
