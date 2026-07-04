import { mvc, type dia } from '@joint/core';
import type { AnyCellRecord, CellId } from '../types/cell.types';
import type { ReadonlyContainer } from '../store/state-container';

/**
 * Creates a self-managing subscription for the collection form of {@link useCells}.
 *
 * Subscribes to each cell ID in the container (per-ID granularity) AND to
 * collection membership events (`add`/`remove`/`reset`). On membership
 * change, resubscribes to the new set of IDs.
 *
 * All changes bump `versionRef` so `getSnapshot` returns a new value,
 * causing `useSyncExternalStoreWithSelector` to re-evaluate `select`.
 */
export function subscribeToCollection<Cell extends AnyCellRecord>(
  collection: mvc.Collection<dia.Cell>,
  container: ReadonlyContainer<Cell>,
  listener: () => void,
  collectionIdsRef: { current: readonly CellId[] },
  versionRef: { current: number }
): () => void {
  let cellUnsubs: Array<() => void> = [];

  const bumpAndNotify = () => {
    versionRef.current++;
    listener();
  };

  const resubscribeCells = () => {
    for (const unsub of cellUnsubs) unsub();
    const ids = collection.models.map((m) => m.id as CellId);
    collectionIdsRef.current = ids;
    cellUnsubs = ids.map((id) => container.subscribe(id, bumpAndNotify));
  };

  resubscribeCells();

  const controller = new mvc.Listener();
  const onMembershipChange = () => {
    resubscribeCells();
    bumpAndNotify();
  };
  controller.listenTo(collection, 'add remove reset', onMembershipChange);

  return () => {
    for (const unsub of cellUnsubs) unsub();
    controller.stopListening();
  };
}
