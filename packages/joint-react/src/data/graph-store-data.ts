import { util, type dia } from '@joint/core';
import { getElement, getLink } from '../utils/cell/get-cell';
import { GraphElements } from '../types/element-types';
import { GraphLinks } from '../types/link-types';

/**
 * Main data structure for the graph store.
 * We avoid using dia.elements and dia.link due to their mutable state.
 * Instead, we use our own containers (GraphElements and GraphLinks) to ensure predictable re-renders in React.
 *
 *
 * @group Graph
 *
 * @internal Used internally by `useCreateGraphStore` hook.
 * @example
 * ```ts
 * const graph = new joint.dia.Graph();
 * const storeData = new GraphStoreData(graph);
 * storeData.update(graph);
 */
export class GraphStoreData<Data = unknown> {
  elements = new GraphElements<Data>();
  links = new GraphLinks();

  constructor(graph: dia.Graph) {
    this.update(graph);
  }

  /**
   * Update element in the store. It also compare previous and new element.
   */
  updateElement(cell: dia.Cell<dia.Cell.Attributes>): boolean {
    const newElement = getElement<Data>(cell);
    if (util.isEqual(newElement, this.elements.get(cell.id))) {
      return false;
    }
    this.elements.set(cell.id, newElement);
    return true;
  }
  /**
   * Update link in the store. It also compare previous and new link.
   */
  updateLink(cell: dia.Cell<dia.Cell.Attributes>): boolean {
    const newLink = getLink(cell);
    if (util.isEqual(newLink, this.links.get(cell.id))) {
      return false;
    }
    this.links.set(cell.id, newLink);
    return true;
  }

  /**
   * Update the graph store data (elements and links or nodes and edges).
   * @param graph - Graph instance to update.
   */
  update(graph: dia.Graph): void {
    const cells = graph.get('cells');
    if (!cells) {
      throw new Error('Graph cells are not initialized');
    }
    let areElementsChanged = false;
    let areLinksChanged = false;
    for (const cell of cells) {
      if (cell.isElement() && this.updateElement(cell)) {
        areElementsChanged = true;
      } else if (cell.isLink() && this.updateLink(cell)) {
        areLinksChanged = true;
      }
    }
    if (areElementsChanged) {
      this.elements = new GraphElements<Data>([...this.elements.values()]);
    }
    if (areLinksChanged) {
      this.links = new GraphLinks([...this.links.values()]);
    }
  }
}
