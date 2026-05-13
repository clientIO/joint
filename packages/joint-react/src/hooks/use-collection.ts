import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { type mvc, type dia } from '@joint/core';
import type { CellRecord, Computed } from '../types/cell.types';
import { useSetCollection, type CollectionSetter } from './use-set-collection';
import { createCollectionView, type CollectionView } from '../store/collection-view';
import { arrayAwareEqual } from '../utils/selector-utils';

const EMPTY_CELLS: readonly never[] = Object.freeze([]);

/** Options accepted by every form of {@link useCollection}. */
export interface UseCollectionOptions<Cell, Selected> {
  /** Fired after every observable mutation. Not invoked on mount. */
  readonly onChange?: (cells: readonly Cell[]) => void;
  /**
   * Equality used to short-circuit re-renders. Defaults to an array-aware
   * `Object.is` so identity-preserving array returns stay reference-stable.
   */
  readonly isEqual?: (a: Selected, b: Selected) => boolean;
}

/**
 * Subscribe to a JointJS collection's cells as `CellRecord` instances.
 *
 * Two forms:
 * - `useCollection(collection, options?)` — returns `[cells, set]`.
 * - `useCollection(collection, selector, options?)` — returns `[selected, set]`.
 *
 * The setter is the same one returned by {@link useSetCollection}.
 *
 * The view that mirrors the collection is local to this hook instance —
 * destroyed on unmount and rebuilt on collection changes. Each call sets up
 * its own `mvc.Listener` chain. No cross-hook sharing happens here so the
 * hook stays self-contained.
 *
 * Must be used inside `<GraphProvider>` (the setter needs the graph).
 * @template Cell - resolved record shape (defaults to `Computed<CellRecord>`)
 * @param collection - target JointJS collection, or `undefined` while the source feature is still mounting
 * @param options - hook options
 * @returns tuple of records and setter
 */
export function useCollection<Cell extends CellRecord = Computed<CellRecord>>(
  collection?: mvc.Collection<dia.Cell>,
  options?: UseCollectionOptions<Cell, readonly Cell[]>
): readonly [readonly Cell[], CollectionSetter<Cell>];
/**
 * Subscribe to a JointJS collection's cells with a selector.
 * @template Cell - resolved record shape
 * @template Selected - selector return type
 * @param collection - target collection
 * @param selector - derive a value from the records array
 * @param options - hook options (isEqual, onChange)
 * @returns tuple of selected value and setter
 */
export function useCollection<
  Cell extends CellRecord = Computed<CellRecord>,
  Selected = readonly Cell[],
>(
  collection?: mvc.Collection<dia.Cell>,
  selector?: (cells: readonly Cell[]) => Selected,
  options?: UseCollectionOptions<Cell, Selected>
): readonly [Selected, CollectionSetter<Cell>];
export function useCollection<
  Cell extends CellRecord = Computed<CellRecord>,
  Selected = readonly Cell[],
>(
  collection?: mvc.Collection<dia.Cell>,
  argument2?: ((cells: readonly Cell[]) => Selected) | UseCollectionOptions<Cell, Selected>,
  argument3?: UseCollectionOptions<Cell, Selected>
): readonly [Selected, CollectionSetter<Cell>] {
  const setter = useSetCollection<Cell>(collection);

  const isSelector = typeof argument2 === 'function';
  const selector = isSelector ? (argument2 as (cells: readonly Cell[]) => Selected) : undefined;
  const options =
    (isSelector ? argument3 : (argument2 as UseCollectionOptions<Cell, Selected> | undefined)) ??
    undefined;
  const onChange = options?.onChange;
  const userIsEqual = options?.isEqual;

  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Local view per hook. No registry, no refcount — lifecycle is bound to
  // this hook's effect.
  const viewRef = useRef<CollectionView<Cell> | null>(null);
  useEffect(() => {
    if (!collection) {
      viewRef.current = null;
      return;
    }
    const view = createCollectionView<Cell>(collection);
    viewRef.current = view;

    // onChange shares the same view. Microtask gate skips the seed commit so
    // onChange only fires on post-mount mutations.
    let mounted = false;
    queueMicrotask(() => {
      mounted = true;
    });
    const unsubscribe = view.cells.subscribeToAll(() => {
      if (!mounted) return;
      onChangeRef.current?.(view.cells.getAll() as readonly Cell[]);
    });

    return () => {
      unsubscribe();
      view.destroy();
      viewRef.current = null;
    };
  }, [collection]);

  const subscribe = useCallback(
    (listener: () => void) => {
      const view = viewRef.current;
      if (!view) return () => {};
      return view.cells.subscribeToAll(listener);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collection]
  );

  const getSnapshot = useCallback(
    () => {
      const view = viewRef.current;
      return view ? view.cells.getVersion() : 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collection]
  );

  const isEqual = useMemo<(a: Selected, b: Selected) => boolean>(() => {
    if (userIsEqual) return userIsEqual;
    return arrayAwareEqual as unknown as (a: Selected, b: Selected) => boolean;
  }, [userIsEqual]);

  const select = useCallback(
    (): Selected => {
      const view = viewRef.current;
      const cells = (view ? view.cells.getAll() : EMPTY_CELLS) as readonly Cell[];
      const userSelector = selectorRef.current;
      if (userSelector) return userSelector(cells);
      return cells as unknown as Selected;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collection]
  );

  const value = useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    isEqual
  );

  const stableValue =
    !collection && !selector ? (EMPTY_CELLS as unknown as Selected) : value;

  return [stableValue, setter];
}
