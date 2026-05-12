import { useCallback } from 'react';
import { type mvc, dia } from '@joint/core';
import type {
  AnyCellRecord,
  CellRecord,
  Computed,
} from '../types/cell.types';
import type { ArrayUpdate } from '../store/state-container';
import { useGraphStore } from './use-graph-store';
import { mapCellToAttributes } from '../state/data-mapping';

/**
 * Function returned by {@link useSetCollection}. Replaces the contents of a
 * JointJS collection with the supplied records.
 *
 * Two forms:
 * - `set(records)` — direct form. Records map to `dia.Cell` instances and
 *   the collection is reset.
 * - `set(previous => next)` — updater form. The updater receives the
 *   current records (read at call time from the cached collection-view).
 *
 * When the collection is `undefined` the setter is a stable no-op — useful
 * when the source collection (selection, clipboard, …) is not yet mounted.
 * @template Cell - resolved record shape (defaults to `Computed<CellRecord>`)
 */
export type CollectionSetter<Cell extends CellRecord = Computed<CellRecord>> = (
  input: ArrayUpdate<Cell>
) => void;

/**
 * Returns a setter that replaces the contents of a JointJS collection with
 * records.
 *
 * For each record:
 *   - If a cell with the same id already exists in the graph, the existing
 *     model is reused.
 *   - Otherwise, a fresh model is constructed via the graph's cell namespace
 *     (`graph.getTypeConstructor(type)`), falling back to `dia.Cell`.
 *
 * Must be used inside `<GraphProvider>`.
 * @template Cell - resolved record shape
 * @param collection - target JointJS collection, or `undefined` while the
 *   source feature is still mounting
 * @returns memoized setter; stable no-op while `collection` is `undefined`
 */
export function useSetCollection<Cell extends CellRecord = Computed<CellRecord>>(
  collection?: mvc.Collection<dia.Cell>
): CollectionSetter<Cell> {
  const store = useGraphStore();
  const { graph } = store;

  return useCallback<CollectionSetter<Cell>>(
    (input) => {
      if (!collection) return;

      let nextRecords: readonly Cell[];
      if (typeof input === 'function') {
        const view = store.acquireCollectionView<Cell>(collection);
        try {
          nextRecords = input(view.cells.getAll() as readonly Cell[]);
        } finally {
          store.releaseCollectionView(collection);
        }
      } else {
        nextRecords = input;
      }

      graph.startBatch('useSetCollection');
      const models: dia.Cell[] = [];
      for (const record of nextRecords) {
        const attributes = mapCellToAttributes(record as AnyCellRecord, graph);
        const existing =
          record.id === undefined ? undefined : graph.getCell(record.id);
        if (existing) {
          // Apply the record's attributes to the underlying cell so that
          // changes in `position` / `size` / `data` / etc. take effect when
          // the caller passes a modified copy of the record. Backbone's `set`
          // is a structural merge — fields not present on `attributes` are
          // left untouched.
          existing.set(attributes);
          models.push(existing);
          continue;
        }
        const Constructor =
          (typeof attributes.type === 'string'
            ? graph.getTypeConstructor(attributes.type)
            : null) ?? dia.Cell;
        models.push(new Constructor(attributes));
      }

      collection.reset(models);
      graph.stopBatch('useSetCollection');
    },
    [collection, graph, store]
  );
}
