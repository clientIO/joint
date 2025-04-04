import { util, type dia } from '@joint/core';
import { getElement, getLink } from '../utils/cell/get-cell';
import type { GraphElement, GraphElementBase } from 'src/types/element-types';
import type { GraphLinkBase } from 'src/types/link-types';
import { type CellBase, CellMap } from 'src/utils/cell/cell-map';

interface StoreData<Element extends GraphElementBase = GraphElement> {
  readonly updateStore: (graph: dia.Graph) => void;
  readonly destroy: () => void;
  elements: CellMap<Element>;
  links: CellMap<GraphLinkBase>;
}
/**
 * Helper function to update the store data more efficiently.
 * It checks if the cell is deleted or updated.
 * If the cell is deleted, it removes it from the store.
 * If the cell is updated, it updates the store with the new value.
 * It also checks if the cell is inserted, and if so, it adds it to the store.
 *
 * Then re-create new map - because react need new reference, if there is some change.
 * If there is not change, it will return original reference.
 * @param cells - The cells to update.
 * @param original - The original map of cells.
 * @param diff - The diff map of cells.
 * @returns - The updated map of cells.
 * @group Graph
 * @internal
 * @example
 * ```ts
 * const cells = graph.get('cells');
 * const original = new CellMap();
 * const diff = new CellMap();
 * const updated = diffUpdater(cells, original, diff);
 * console.log(updated);
 * ```
 * @example
 * ```ts
 * const cells = graph.get('cells');
 * const original = new CellMap();
 * const diff = new CellMap();
 * const updated = diffUpdater(cells, original, diff);
 * console.log(updated);
 * ```
 */
function diffUpdater<Value extends CellBase>(
  cells: dia.Graph.Cells,
  original: CellMap<Value>,
  diff: CellMap<Value>
): CellMap<Value> {
  // checking of deleting items from the graph.
  // We do it by iterate over existing state and check if cell exist, if not, its removed from the graph
  let hasDelete = false;
  for (const [id] of original) {
    const cell = cells.get(id);
    if (!cell) {
      original.delete(id);
      hasDelete = true;
    }
  }
  // if there is not change, we can return original
  if (diff.size === 0 && !hasDelete) {
    return original;
  }

  // create new map with originalMap - but with new reference for the map
  // it's because of react referencing (but it's efficient as it do just copy existing data to new reference)
  const newMap = new CellMap(original);
  for (const [key, value] of diff) {
    if (value) {
      newMap.set(key, value);
    }
  }

  return newMap;
}

/**
 * Main data structure for the graph store data.
 * We avoid using dia.elements and dia.link due to their mutable state.
 * @group Graph
 * @returns - The store data.
 * @description
 * This function is used to create a store data for the graph.
 * @internal
 * @example
 * ```ts
 * const graph = new joint.dia.Graph();
 * const storeData = new GraphStoreData(graph);
 * storeData.update(graph);
 * ```
 *
 */
export function createStoreData<
  Element extends GraphElementBase = GraphElement,
>(): StoreData<Element> {
  /**
   * Update the store data with the graph data.
   * @param graph - The graph to update the store data with..
   * @description
   */
  function updateStore(graph: dia.Graph): void {
    const cells = graph.get('cells');
    if (!cells) throw new Error('Graph cells are not initialized');

    // New updates, if cell is inserted or updated, we track it inside this diff.
    const elementsDiff = new CellMap<Element>();
    const linkDiff = new CellMap<GraphLinkBase>();

    for (const cell of cells) {
      if (cell.isElement()) {
        const newElement = getElement<Element>(cell);
        if (!util.isEqual(newElement, data.elements.get(cell.id))) {
          elementsDiff.set(cell.id, newElement);
        }
      } else if (cell.isLink()) {
        const newLink = getLink(cell);
        if (!util.isEqual(newLink, data.links.get(cell.id))) {
          linkDiff.set(cell.id, newLink);
        }
      }
    }

    data.elements = diffUpdater(cells, data.elements, elementsDiff);
    data.links = diffUpdater(cells, data.links, linkDiff);
  }

  const data: StoreData<Element> = {
    updateStore,
    elements: new CellMap(),
    links: new CellMap(),
    destroy: () => {
      data.elements.clear();
      data.links.clear();
    },
  };

  return data;
}
