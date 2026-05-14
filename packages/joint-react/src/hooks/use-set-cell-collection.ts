import { useCallback } from 'react';
import { type mvc, dia } from '@joint/core';
import type {
  AnyCellRecord,
  CellRecord,
  Computed,
} from '../types/cell.types';
import { type ArrayUpdate } from '../store/state-container';
import { useGraphStore } from './use-graph-store';
import { mapCellToAttributes } from '../state/data-mapping';
import { toCellRecord } from '../state/data-mapping/cell-record-merge';

/**
 * Function returned by {@link useSetCellCollection}. Replaces the contents of a
 * JointJS collection with the supplied records or dia.Cell instances.
 *
 * Two forms:
 * - `set(records)` — direct form. Records (or dia.Cell instances) map to
 *   `dia.Cell` instances and the collection is reset.
 * - `set(previous => next)` — updater form. The updater receives the
 *   current records derived from `collection.models`.
 *
 * When the collection is `undefined` the setter is a stable no-op — useful
 * when the source collection (selection, clipboard, …) is not yet mounted.
 * @template Cell - resolved record shape (defaults to `Computed<CellRecord>`)
 */
export type CellCollectionSetter<Cell extends CellRecord = Computed<CellRecord>> = (
  input: ArrayUpdate<Cell, Cell | dia.Cell>
) => void;

/**
 * Resolve a record to a `dia.Cell` instance, reusing the existing graph cell
 * when an id match exists. Falls back to constructing a fresh model via the
 * graph's `cellNamespace`.
 *
 * Side effect: when an existing cell is found, its attributes are merged with
 * the record's via `cell.set(attributes)`. Wrap calls in `graph.startBatch` /
 * `stopBatch` when applying multiple records in a single user action.
 * @param record - record to resolve
 * @param graph - graph used for cell lookup and type-constructor resolution
 * @returns the resolved `dia.Cell` (existing or freshly constructed)
 */
function resolveRecordToCell(record: AnyCellRecord, graph: dia.Graph): dia.Cell {
  const attributes = mapCellToAttributes(record, graph);
  const existing = record.id === undefined ? undefined : graph.getCell(record.id);
  if (existing) {
    existing.set(attributes);
    return existing;
  }
  const Constructor =
    (typeof attributes.type === 'string'
      ? graph.getTypeConstructor(attributes.type)
      : null) ?? dia.Cell;
  return new Constructor(attributes);
}

/**
 * Read the current records from a `mvc.Collection<dia.Cell>` without setting
 * up a subscription. Used by {@link useSetCellCollection}'s updater form so the
 * hook does not need a long-lived `CollectionView`.
 * @template Cell - resolved record shape
 * @param collection - the JointJS collection to snapshot
 * @returns array of records mapped from the collection's current models
 */
function snapshotRecords<Cell extends CellRecord>(
  collection: mvc.Collection<dia.Cell>
): readonly Cell[] {
  const records: Cell[] = [];
  for (const model of collection.models) {
    records.push(toCellRecord(model) as Cell);
  }
  return records;
}

/**
 * Returns a setter that replaces the contents of a JointJS collection with
 * records.
 *
 * For each record:
 *   - If a cell with the same id already exists in the graph, that cell is
 *     reused — its attributes are merged from the record's.
 *   - Otherwise, a fresh model is constructed via the graph's cell namespace
 *     (`graph.getTypeConstructor(type)`), falling back to `dia.Cell`.
 *
 * Must be used inside `<GraphProvider>`.
 * @template Cell - resolved record shape
 * @param collection - target JointJS collection, or `undefined` while the
 *   source feature is still mounting
 * @returns memoized setter; stable no-op while `collection` is `undefined`
 */
export function useSetCellCollection<Cell extends CellRecord = Computed<CellRecord>>(
  collection?: mvc.Collection<dia.Cell>
): CellCollectionSetter<Cell> {
  const { graph } = useGraphStore();

  return useCallback<CellCollectionSetter<Cell>>(
    (input) => {
      if (!collection) return;

      const nextRecords =
        typeof input === 'function' ? input(snapshotRecords<Cell>(collection)) : input;

      graph.startBatch('useSetCellCollection');
      const models: dia.Cell[] = [];
      for (const item of nextRecords) {
        if (item instanceof dia.Cell) {
          models.push(item);
        } else {
          models.push(resolveRecordToCell(item as AnyCellRecord, graph));
        }
      }
      collection.reset(models);
      graph.stopBatch('useSetCellCollection');
    },
    [collection, graph]
  );
}
