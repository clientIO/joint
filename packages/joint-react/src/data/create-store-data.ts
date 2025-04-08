import { util, type dia } from '@joint/core';
import { getElement, getLink } from '../utils/cell/get-cell';
import { CellMap } from '../utils/cell/cell-map';
import type { GraphLinkBase } from '../types/link-types';
import type { GraphElement, GraphElementBase } from '../types/element-types';
import { diffUpdate } from '../utils/diff-update';
interface StoreData<Element extends GraphElementBase = GraphElement> {
  readonly updateStore: (graph: dia.Graph) => void;
  readonly destroy: () => void;
  elements: CellMap<Element>;
  links: CellMap<GraphLinkBase>;
}
/**
 * Main data structure for the graph store data.
 * We avoid using dia.elements and dia.link due to their mutable state.
 * @group Data
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

    data.elements = diffUpdate(data.elements, elementsDiff, (cellId) => cells.has(cellId));
    data.links = diffUpdate(data.links, linkDiff, (cellId) => cells.has(cellId));
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
