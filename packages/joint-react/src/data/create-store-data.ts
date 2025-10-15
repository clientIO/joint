/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable unicorn/prevent-abbreviations */
import type { dia } from '@joint/core';
import { util } from '@joint/core';
import { getElement, getLink } from '../utils/cell/get-cell';
import type { GraphLink } from '../types/link-types';
import type { GraphElement } from '../types/element-types';

export interface UpdateResult {
  readonly diffIds: Set<dia.Cell.ID>;
  readonly areElementsChanged: boolean;
  readonly areLinksChanged: boolean;
}

interface StoreData<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
> {
  /** Rebuilds arrays (and internal indices) from the graph, returns a diff summary */
  readonly updateStore: (graph: Graph) => UpdateResult;
  /** Clear everything */
  readonly destroy: () => void;

  /** Public, array-first shape */
  elements: Element[];
  links: GraphLink[];

  /** O(1) helpers built on top of private indices */
  readonly getElementById: (id: dia.Cell.ID) => Element | undefined;
  readonly getLinkById: (id: dia.Cell.ID) => GraphLink | undefined;
}
interface Options<Element extends GraphElement> {
  readonly elements?: Element[];
  readonly links?: GraphLink[];
}
/**
 * Array-first store with internal id->index maps.
 * Keeps public API as arrays while preserving O(1) lookups.
 * Arrays are rebuilt in graph order each update for stable determinism.
 * @group Data
 * @param options - Initial elements and links.
 * @template Graph - The type of the graph, extending dia.Graph.
 * @template Element - The type of elements in the store, extending GraphElement.
 * @returns - The store data containing elements, links, and utility methods.
 * @example
 */
export function createStoreData<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
>(options: Options<Element> = {}): StoreData<Graph, Element> {
  // Public arrays

  const ref: {
    elements: Element[];
    links: GraphLink[];
  } = {
    elements: options.elements ?? [],
    links: options.links ?? [],
  };

  // Private indices (id -> array index)
  let eIndex = new Map<dia.Cell.ID, number>();
  let lIndex = new Map<dia.Cell.ID, number>();

  /**
   * Retrieves an element by its ID.
   * @param id - The ID of the element to retrieve.
   * @returns The element if found, otherwise undefined.
   */
  function getElementById(id: dia.Cell.ID): Element | undefined {
    const i = eIndex.get(id);
    return i == null ? undefined : ref.elements[i];
  }
  /**
   * Retrieves a link by its ID.
   * @param id - The ID of the link to retrieve.
   * @returns The link if found, otherwise undefined.
   */
  function getLinkById(id: dia.Cell.ID): GraphLink | undefined {
    const i = lIndex.get(id);
    return i == null ? undefined : ref.links[i];
  }

  /**
   * Rebuilds arrays (and internal indices) from the graph, returns a diff summary
   * @param graph - The graph to update the store from.
   * @returns - The update result containing diff information.
   */
  function updateStore(graph: Graph): UpdateResult {
    const cells = graph.get('cells');
    if (!cells) throw new Error('Graph cells are not initialized');

    const nextElements: Element[] = [];
    const nextLinks: GraphLink[] = [];
    const nextEIndex = new Map<dia.Cell.ID, number>();
    const nextLIndex = new Map<dia.Cell.ID, number>();
    const diffIds = new Set<dia.Cell.ID>();

    let areElementsChanged = false;
    let areLinksChanged = false;

    // Build new arrays in the same pass, while diffing per id
    for (const cell of cells) {
      if (cell.isElement()) {
        const id = cell.id as dia.Cell.ID;
        const next = getElement<Element>(cell);
        const prev = getElementById(id);
        if (!prev || !util.isEqual(prev, next)) {
          diffIds.add(id);
          areElementsChanged = true;
        }
        nextEIndex.set(id, nextElements.length);
        nextElements.push(next);
      } else if (cell.isLink()) {
        const id = cell.id as dia.Cell.ID;
        const next = getLink(cell);
        const prev = getLinkById(id);
        if (!prev || !util.isEqual(prev, next)) {
          diffIds.add(id);
          areLinksChanged = true;
        }
        nextLIndex.set(id, nextLinks.length);
        nextLinks.push(next);
      }
    }

    // Deletions: if the new arrays are shorter than old or some ids disappeared,
    // we’ve already “changed”. To catch pure deletions where values equal but gone:
    if (!areElementsChanged) {
      areElementsChanged = ref.elements.length !== nextElements.length;
      if (!areElementsChanged) {
        // Cheap structural check: same length but different ids/order?
        for (const [i, nextElement] of nextElements.entries()) {
          const idNow = nextElement?.id as dia.Cell.ID | undefined;
          const prevIdx = idNow ? eIndex.get(idNow) : undefined;
          if (prevIdx !== i) {
            areElementsChanged = true;
            break;
          }
        }
      }
    }
    if (!areLinksChanged) {
      areLinksChanged = ref.links.length !== nextLinks.length;
      if (!areLinksChanged) {
        for (const [i, nextLink] of nextLinks.entries()) {
          const idNow = nextLink?.id as dia.Cell.ID | undefined;
          const prevIdx = idNow ? lIndex.get(idNow) : undefined;
          if (prevIdx !== i) {
            areLinksChanged = true;
            break;
          }
        }
      }
    }

    // Swap (immutably) only when changed to preserve referential equality
    if (areElementsChanged) {
      ref.elements = nextElements;
      eIndex = nextEIndex;
    }

    if (areLinksChanged) {
      ref.links = nextLinks;
      lIndex = nextLIndex;
    }

    return {
      diffIds,
      areElementsChanged,
      areLinksChanged,
    };
  }

  /**
   * Clears all elements and links from the store and resets internal indices.
   */
  function destroy() {
    ref.elements = [];
    ref.links = [];
    eIndex.clear();
    lIndex.clear();
  }

  return {
    updateStore,
    destroy,
    getElementById,
    getLinkById,
    get elements() {
      return ref.elements;
    },
    set elements(_value: Element[]) {
      throw new Error('elements is read-only; call updateStore(graph) instead.');
    },

    get links() {
      return ref.links;
    },
    set links(_value: GraphLink[]) {
      throw new Error('links is read-only; call updateStore(graph) instead.');
    },
  } as StoreData<Graph, Element>;
}
