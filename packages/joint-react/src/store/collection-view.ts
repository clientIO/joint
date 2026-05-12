import { mvc, type dia } from '@joint/core';
import type { AnyCellRecord, CellRecord, Computed } from '../types/cell.types';
import { asReadonlyContainer, createContainer, type ReadonlyContainer } from './state-container';
import { writeCellToContainer, toCellRecord } from '../state/data-mapping/cell-record-merge';

/**
 * Read-only mirror of an `mvc.Collection<dia.Cell>` exposed as a records
 * container. Same shape as `GraphView.cells` so consumers can reuse the
 * same subscription / selector patterns as `useCells`.
 */
export interface CollectionView<Cell extends AnyCellRecord = Computed<CellRecord>> {
  readonly cells: ReadonlyContainer<Cell>;
  readonly destroy: () => void;
}

/**
 * Build a view that mirrors a JointJS collection of cells into a records
 * container. The view listens for `add`, `remove`, `change`, and `reset`
 * events on the collection and updates the container accordingly.
 *
 * The merge fast-path in `writeCellToContainer` ensures `change` events
 * that produced no observable diff do not notify subscribers — same
 * protection as the main `GraphView`.
 * @template Cell - resolved record shape (defaults to `Computed<CellRecord>`)
 * @param collection - JointJS collection to mirror
 * @returns view object with `cells` container and `destroy()` cleanup
 */
export function createCollectionView<Cell extends AnyCellRecord = Computed<CellRecord>>(
  collection: mvc.Collection<dia.Cell>
): CollectionView<Cell> {
  const cells = createContainer<Cell>('Collection');

  for (const model of collection.models) {
    writeCellToContainer(cells, model);
  }
  if (cells.getSize() > 0) cells.commitChanges();

  const controller = new mvc.Listener();

  controller.listenTo(collection, 'add', (model: dia.Cell) => {
    writeCellToContainer(cells, model);
    cells.commitChanges();
  });
  controller.listenTo(collection, 'remove', (model: dia.Cell) => {
    cells.delete(model.id);
    cells.commitChanges();
  });
  controller.listenTo(collection, 'change', (model: dia.Cell) => {
    writeCellToContainer(cells, model);
    cells.commitChanges();
  });
  controller.listenTo(collection, 'reset', () => {
    const next: Cell[] = [];
    for (const model of collection.models) {
      next.push(toCellRecord(model) as Cell);
    }
    cells.reset(next);
    cells.commitChanges();
  });

  return {
    cells: asReadonlyContainer(cells),
    destroy() {
      controller.stopListening();
    },
  };
}
