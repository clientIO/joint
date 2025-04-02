import { util, type dia } from '@joint/core';
import { getElement, getLink } from '../utils/cell/get-cell';
import { GraphElements, type GraphElement, type GraphElementBase } from '../types/element-types';
import { GraphLinks } from '../types/link-types';

/**
 * Main data structure for the graph store data.
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
interface StoreData<Element extends GraphElementBase = GraphElement> {
  readonly updateStore: (graph: dia.Graph) => void;
  elements: GraphElements<Element>;
  links: GraphLinks;
}

export function createStoreData<
  Element extends GraphElementBase = GraphElement,
>(): StoreData<Element> {
  function updateElement(cell: dia.Cell<dia.Cell.Attributes>): boolean {
    const newElement = getElement<Element>(cell);
    if (util.isEqual(newElement, data.elements.get(cell.id))) {
      return false;
    }

    // data.elements = create(data.elements, (draft) => {
    //   draft.set(cell.id, newElement);
    // });
    data.elements.set(cell.id, { ...newElement });

    return true;
  }

  function updateLink(cell: dia.Cell<dia.Cell.Attributes>): boolean {
    const newLink = getLink(cell);
    if (util.isEqual(newLink, data.links.get(cell.id))) {
      return false;
    }

    // data.links = create(data.links, (draft) => {
    //   draft.set(cell.id, newLink);
    // });
    data.links.set(cell.id, newLink);

    return true;
  }
  function updateStore(graph: dia.Graph): void {
    const cells = graph.get('cells');
    if (!cells) {
      throw new Error('Graph cells are not initialized');
    }
    for (const cell of cells) {
      if (cell.isElement()) {
        updateElement(cell);
        continue;
      }
      if (cell.isLink()) {
        updateLink(cell);
      }
    }

    // TODO - this will have for sure performance issues in the future, we must use some immutable data structure
    // data.elements = new GraphElements<Element>([...data.elements.values()]);
    // data.links = new GraphLinks([...data.links.values()]);
  }

  const data: StoreData<Element> = {
    updateStore,
    elements: new GraphElements(),
    links: new GraphLinks(),
  };
  return data;
}
