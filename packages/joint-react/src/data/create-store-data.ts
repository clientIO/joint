import type { dia } from '@joint/core';
import { util } from '@joint/core';
import { getElement, getLink } from '../utils/cell/get-cell';
import { CellMap } from '../utils/cell/cell-map';
import type { GraphLink } from '../types/link-types';
import type { GraphElement } from '../types/element-types';
import { diffUpdate } from '../utils/diff-update';

export interface UpdateResult {
  readonly diffIds: Set<dia.Cell.ID>;
  readonly areElementsChanged: boolean;
  readonly areLinksChanged: boolean;
}
interface StoreData<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
> {
  readonly updateStore: (graph: Graph) => UpdateResult;
  readonly destroy: () => void;
  elements: CellMap<Element>;
  links: CellMap<GraphLink>;
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
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
>(): StoreData<Graph, Element> {
  /**
   * Update the store data with the graph data.
   * @param graph - The graph to update the store data with..
   * @returns A set of cell IDs that were updated.
   * @description
   */
  function updateStore(graph: Graph): UpdateResult {
    const cells = graph.get('cells');

    if (!cells) throw new Error('Graph cells are not initialized');

    // New updates, if cell is inserted or updated, we track it inside this diff.
    const elementsDiff = new CellMap<Element>();
    const linkDiff = new CellMap<GraphLink>();
    const diffIds = new Set<dia.Cell.ID>();
    for (const cell of cells) {
      if (cell.isElement()) {
        const newElement = getElement<Element>(cell);
        if (!util.isEqual(newElement, data.elements.get(cell.id))) {
          elementsDiff.set(cell.id, newElement);
          diffIds.add(cell.id);
        }
      } else if (cell.isLink()) {
        const newLink = getLink(cell);
        if (!util.isEqual(newLink, data.links.get(cell.id))) {
          linkDiff.set(cell.id, newLink);
          diffIds.add(cell.id);
        }
      }
    }

    const oldElements = data.elements;
    const oldLinks = data.links;

    data.elements = diffUpdate(data.elements, elementsDiff, (cellId) => cells.has(cellId));
    data.links = diffUpdate(data.links, linkDiff, (cellId) => cells.has(cellId));

    const areElementsChanged = data.elements !== oldElements;
    const areLinksChanged = data.links !== oldLinks;

    return { diffIds, areElementsChanged, areLinksChanged };
  }

  const data: StoreData<Graph, Element> = {
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
