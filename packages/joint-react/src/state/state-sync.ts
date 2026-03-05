import type { GraphStoreSnapshot } from '../store/graph-store';
import { listenToCellChange, type OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { removeDeepReadOnly, type ExternalStoreLike } from '../utils/create-state';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
  GraphToLinkOptions,
  GraphStateSelectors,
  LinkToGraphOptions,
} from './graph-state-selectors';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from './data-mapping';
import { updateGraph, mapGraphElement, mapGraphLink } from './update-graph';

export interface StateSync {
  readonly cleanup: () => void;
}

interface StateSyncOptions<
  Graph extends dia.Graph,
  ElementData = FlatElementData,
  LinkData = FlatLinkData,
> extends GraphStateSelectors<ElementData, LinkData> {
  readonly graph: Graph;
  readonly store: ExternalStoreLike<GraphStoreSnapshot<ElementData, LinkData>>;
  readonly graphToElementSelector?: (
    options: GraphToElementOptions<ElementData> & { readonly graph: Graph }
  ) => ElementData;
  readonly graphToLinkSelector?: (
    options: GraphToLinkOptions<LinkData> & { readonly graph: Graph }
  ) => LinkData;
  /**
   * Callback invoked after the graph is successfully updated from the store.
   * Used to trigger layout updates when changes come from React state (e.g., useCellActions).
   */
  readonly onGraphUpdated?: () => void;
}

/**
 * Maps all cells to their typed representations.
 * @param cells
 * @param graph
 * @param elementSelector
 * @param linkSelector
 * @param previousElements
 * @param previousLinks
 */
function mapCellsToData<
  Graph extends dia.Graph,
  ElementData = FlatElementData,
  LinkData = FlatLinkData,
>(
  cells: dia.Cell[],
  graph: Graph,
  elementSelector: (options: GraphToElementOptions<ElementData> & { readonly graph: Graph }) => ElementData,
  linkSelector: (options: GraphToLinkOptions<LinkData> & { readonly graph: Graph }) => LinkData,
  previousElements?: Record<CellId, ElementData>,
  previousLinks?: Record<CellId, LinkData>
): { elements: Map<CellId, ElementData>; links: Map<CellId, LinkData> } {
  const elements = new Map<CellId, ElementData>();
  const links = new Map<CellId, LinkData>();

  for (const cell of cells) {
    const cellId = cell.id as CellId;
    if (cell.isElement()) {
      elements.set(cellId, mapGraphElement(cell, graph, elementSelector, previousElements?.[cellId]));
    } else if (cell.isLink()) {
      links.set(cellId, mapGraphLink(cell, graph, linkSelector, previousLinks?.[cellId]));
    }
  }

  return { elements, links };
}

/**
 * Syncs graph and store state bidirectionally.
 * Graph-originated changes write through `store.setState` directly.
 * @param options
 */
export function stateSync<
  Graph extends dia.Graph,
  ElementData = FlatElementData,
  LinkData = FlatLinkData,
>(options: StateSyncOptions<Graph, ElementData, LinkData>): StateSync {
  const {
    graph,
    store,
    mapDataToElementAttributes = defaultMapDataToElementAttributes,
    mapDataToLinkAttributes = defaultMapDataToLinkAttributes,
    onGraphUpdated,
  } = options;

  const elementSelector = (options.graphToElementSelector ?? defaultMapElementAttributesToData) as (
    options: GraphToElementOptions<ElementData> & { readonly graph: Graph }
  ) => ElementData;

  const linkSelector = (options.graphToLinkSelector ?? defaultMapLinkAttributesToData) as (
    options: GraphToLinkOptions<LinkData> & { readonly graph: Graph }
  ) => LinkData;

  const updateCellInStore = (cell: dia.Cell): void => {
    store.setState((previousSnapshot) => {
      const id = cell.id as CellId;

      if (cell.isElement()) {
        const previousData = previousSnapshot.elements[id] as ElementData | undefined;
        const nextElement = mapGraphElement(cell, graph, elementSelector, previousData);
        if (previousSnapshot.elements[id] === nextElement) {
          return previousSnapshot;
        }
        return {
          ...previousSnapshot,
          elements: {
            ...previousSnapshot.elements,
            [id]: nextElement,
          },
        };
      }

      if (cell.isLink()) {
        const previousData = previousSnapshot.links[id] as LinkData | undefined;
        const nextLink = mapGraphLink(cell, graph, linkSelector, previousData);
        if (previousSnapshot.links[id] === nextLink) {
          return previousSnapshot;
        }
        return {
          ...previousSnapshot,
          links: {
            ...previousSnapshot.links,
            [id]: nextLink,
          },
        };
      }

      return previousSnapshot;
    });
  };

  const deleteCellFromStore = (cell: dia.Cell): void => {
    store.setState((previousSnapshot) => {
      const id = cell.id as CellId;

      if (cell.isElement()) {
        if (!previousSnapshot.elements[id]) {
          return previousSnapshot;
        }
        const elements = { ...previousSnapshot.elements };
        Reflect.deleteProperty(elements, id);
        return {
          ...previousSnapshot,
          elements,
        };
      }

      if (cell.isLink()) {
        if (!previousSnapshot.links[id]) {
          return previousSnapshot;
        }
        const links = { ...previousSnapshot.links };
        Reflect.deleteProperty(links, id);
        return {
          ...previousSnapshot,
          links,
        };
      }

      return previousSnapshot;
    });
  };

  const replaceStoreFromCells = (cells: dia.Cell[]): void => {
    store.setState((previousSnapshot) => {
      const { elements, links } = mapCellsToData(
        cells,
        graph,
        elementSelector,
        linkSelector,
        previousSnapshot.elements as Record<CellId, ElementData>,
        previousSnapshot.links as Record<CellId, LinkData>
      );

      return {
        ...previousSnapshot,
        elements: Object.fromEntries(elements) as Record<CellId, ElementData>,
        links: Object.fromEntries(links) as Record<CellId, LinkData>,
      };
    });
  };

  const mergeCellsIntoStore = (cells: dia.Cell[]): void => {
    store.setState((previousSnapshot) => {
      const { elements, links } = mapCellsToData(
        cells,
        graph,
        elementSelector,
        linkSelector,
        previousSnapshot.elements as Record<CellId, ElementData>,
        previousSnapshot.links as Record<CellId, LinkData>
      );

      let hasElementChanges = false;
      const nextElements = { ...previousSnapshot.elements };
      for (const [id, element] of elements) {
        if (nextElements[id] === element) {
          continue;
        }
        nextElements[id] = element;
        hasElementChanges = true;
      }

      let hasLinkChanges = false;
      const nextLinks = { ...previousSnapshot.links };
      for (const [id, link] of links) {
        if (nextLinks[id] === link) {
          continue;
        }
        nextLinks[id] = link;
        hasLinkChanges = true;
      }

      if (!hasElementChanges && !hasLinkChanges) {
        return previousSnapshot;
      }

      return {
        ...previousSnapshot,
        elements: nextElements,
        links: nextLinks,
      };
    });
  };

  // --- Event Handlers ---

  const handleCellChange = (change: OnChangeOptions): void => {
    if (change.options?.isUpdateFromReact) {
      return;
    }

    if (change.type === 'reset') {
      replaceStoreFromCells(change.cells);
      return;
    }

    if (change.type === 'remove') {
      deleteCellFromStore(change.cell);
      return;
    }

    updateCellInStore(change.cell);
  };

  // --- Store Sync ---

  const updateGraphFromStore = () => {
    const snapshot = store.getSnapshot();
    const elements = removeDeepReadOnly(snapshot.elements);
    const links = removeDeepReadOnly(snapshot.links);

    // Skip sync if store is empty but graph has cells - graph-to-store sync will populate store first.
    const isStoreEmpty = Object.keys(elements).length === 0 && Object.keys(links).length === 0;
    const graphHasCells = graph.getElements().length > 0 || graph.getLinks().length > 0;
    if (isStoreEmpty && graphHasCells) {
      return;
    }

    const wasUpdated = updateGraph({
      graph,
      elements: elements as Record<string, ElementData>,
      links: links as Record<string, LinkData>,
      graphToElementSelector: elementSelector,
      graphToLinkSelector: linkSelector,
      mapDataToElementAttributes: mapDataToElementAttributes as (
        options: ElementToGraphOptions<ElementData> & { readonly graph: Graph }
      ) => dia.Cell.JSON,
      mapDataToLinkAttributes: mapDataToLinkAttributes as (
        options: LinkToGraphOptions<LinkData> & { readonly graph: Graph }
      ) => dia.Cell.JSON,
      isUpdateFromReact: true,
    });

    // Trigger layout update when graph is updated from store (e.g., via useCellActions)
    if (wasUpdated && onGraphUpdated) {
      onGraphUpdated();
    }
  };

  const syncExistingGraphCellsToStore = () => {
    const snapshot = store.getSnapshot();
    const hasStoreData =
      Object.keys(snapshot.elements).length > 0 || Object.keys(snapshot.links).length > 0;
    if (hasStoreData) {
      return;
    }

    const allCells = [...graph.getElements(), ...graph.getLinks()];
    if (allCells.length === 0) {
      return;
    }

    mergeCellsIntoStore(allCells);
  };

  // --- Setup & Cleanup ---

  const destroyCellListener = listenToCellChange(graph, handleCellChange);
  const destroyStoreSubscription = store.subscribe(updateGraphFromStore);

  syncExistingGraphCellsToStore();
  updateGraphFromStore();

  return {
    cleanup: () => {
      destroyCellListener();
      destroyStoreSubscription();
    },
  };
}
