import type { GraphStore } from '../store/graph-store';
import { warnSourceSelectorCalled } from '../utils/dev-warnings';

/**
 * Where a selector's value comes from when it is not derived from the cells:
 * `get` returns the selected value and `subscribe` fires when it may have changed.
 */
export interface SelectorSource<Selected> {
  readonly subscribe: (listener: () => void) => () => void;
  readonly get: () => Selected;
}

const selectorSources = new WeakMap<object, (store: GraphStore) => SelectorSource<unknown>>();

/**
 * Creates an all-cells selector whose value comes from a store source rather
 * than from the cells. `useCells` and `useOnCellsChange` recognise it and
 * subscribe to that source only, so it costs nothing on other commits and the
 * cells array is never built for it. It has to be passed to the hook directly:
 * called on its own it cannot reach a store and returns `fallback`.
 * @param resolve - Returns the source for a graph store; identity-stable per store.
 * @param fallback - The value when there is no store to read.
 * @returns The selector to pass to `useCells` / `useOnCellsChange`.
 */
export function createSourceSelector<Selected>(
  resolve: (store: GraphStore) => SelectorSource<Selected>,
  fallback: Selected
): () => Selected {
  const selector = () => {
    warnSourceSelectorCalled();
    return fallback;
  };
  selectorSources.set(selector, resolve);
  return selector;
}

/**
 * The source of a selector made by {@link createSourceSelector}, if it is one.
 * @param selector - The selector passed to the hook.
 * @param store - The graph store the hook reads.
 */
export function getSelectorSource(
  selector: object | undefined,
  store: GraphStore
): SelectorSource<unknown> | undefined {
  return selector && selectorSources.get(selector)?.(store);
}
