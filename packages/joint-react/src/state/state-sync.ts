import type { GraphStoreSnapshot } from '../store/graph-store';
import { listenToCellChange, type OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { removeDeepReadOnly, type ExternalStoreLike } from '../utils/create-state';
import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
  GraphToLinkOptions,
  GraphStateSelectors,
  LinkToGraphOptions,
} from './graph-state-selectors';
import { flatMapper } from './flat-mapper';
import type { GraphSchedulerData } from '../types/scheduler.types';
import type { Scheduler } from '../utils/scheduler';
import { updateGraph, mapGraphElement, mapGraphLink } from './update-graph';

export interface StateSync {
  readonly cleanup: () => void;
}

interface StateSyncOptions<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
> extends GraphStateSelectors<Element, Link> {
  readonly graph: Graph;
  readonly store: Omit<ExternalStoreLike<GraphStoreSnapshot<Element, Link>>, 'setState'>;
  readonly scheduler: Scheduler<GraphSchedulerData>;
  readonly graphToElementSelector?: (
    options: GraphToElementOptions<Element> & { readonly graph: Graph }
  ) => Element;
  readonly graphToLinkSelector?: (
    options: GraphToLinkOptions<Link> & { readonly graph: Graph }
  ) => Link;
  /**
   * Callback invoked after the graph is successfully updated from the store.
   * Used to trigger layout updates when changes come from React state (e.g., useCellActions).
   */
  readonly onGraphUpdated?: () => void;
}

/**
 * Helper to update a Map immutably - add/set operation.
 * @param map
 * @param key
 * @param value
 */
function mapSet<K, V>(map: Map<K, V> | undefined, key: K, value: V): Map<K, V> {
  const newMap = new Map(map);
  newMap.set(key, value);
  return newMap;
}

/**
 * Helper to update a Map immutably - delete operation.
 * @param map
 * @param key
 */
function mapDelete<K, V>(map: Map<K, V> | undefined, key: K): Map<K, V> {
  const newMap = new Map(map);
  newMap.delete(key);
  return newMap;
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
  Element extends GraphElement,
  Link extends GraphLink,
>(
  cells: dia.Cell[],
  graph: Graph,
  elementSelector: (options: GraphToElementOptions<Element> & { readonly graph: Graph }) => Element,
  linkSelector: (options: GraphToLinkOptions<Link> & { readonly graph: Graph }) => Link,
  previousElements?: Record<dia.Cell.ID, Element>,
  previousLinks?: Record<dia.Cell.ID, Link>
): { elements: Map<dia.Cell.ID, GraphElement>; links: Map<dia.Cell.ID, GraphLink> } {
  const elements = new Map<dia.Cell.ID, GraphElement>();
  const links = new Map<dia.Cell.ID, GraphLink>();

  for (const cell of cells) {
    if (cell.isElement()) {
      elements.set(cell.id, mapGraphElement(cell, graph, elementSelector, previousElements?.[cell.id]));
    } else if (cell.isLink()) {
      links.set(cell.id, mapGraphLink(cell, graph, linkSelector, previousLinks?.[cell.id]));
    }
  }

  return { elements, links };
}

/**
 * Finds IDs to delete by comparing current snapshot with new IDs.
 * @param currentIds
 * @param newIds
 * @param existingDeletes
 */
function findIdsToDelete(
  currentIds: string[],
  newIds: Set<dia.Cell.ID>,
  existingDeletes: Map<dia.Cell.ID, true> | undefined
): Map<dia.Cell.ID, true> {
  const toDelete = new Map(existingDeletes);
  for (const id of currentIds) {
    if (!newIds.has(id)) {
      toDelete.set(id, true);
    }
  }
  return toDelete;
}

/**
 * GOLDEN RULE: This function NEVER calls setState directly.
 * All state updates are scheduled via the unified scheduler.
 * @param options
 */
export function stateSync<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
>(options: StateSyncOptions<Graph, Element, Link>): StateSync {
  const {
    graph,
    store,
    scheduler,
    mapDataToElementAttributes = flatMapper.mapDataToElementAttributes,
    mapDataToLinkAttributes = flatMapper.mapDataToLinkAttributes,
    onGraphUpdated,
  } = options;

  const elementSelector = (options.graphToElementSelector ?? flatMapper.mapElementAttributesToData) as (
    options: GraphToElementOptions<Element> & { readonly graph: Graph }
  ) => Element;

  const linkSelector = (options.graphToLinkSelector ?? flatMapper.mapLinkAttributesToData) as (
    options: GraphToLinkOptions<Link> & { readonly graph: Graph }
  ) => Link;

  // --- Scheduling ---

  const scheduleCellUpdate = (cell: dia.Cell) => {
    scheduler.scheduleData((data) => {
      const snapshot = store.getSnapshot();
      if (cell.isElement()) {
        const previousData = snapshot.elements[cell.id] as Element | undefined;
        return {
          ...data,
          elementsToUpdate: mapSet(
            data.elementsToUpdate,
            cell.id,
            mapGraphElement(cell, graph, elementSelector, previousData)
          ),
        };
      }
      if (cell.isLink()) {
        const previousData = snapshot.links[cell.id] as Link | undefined;
        return {
          ...data,
          linksToUpdate: mapSet(
            data.linksToUpdate,
            cell.id,
            mapGraphLink(cell, graph, linkSelector, previousData)
          ),
        };
      }
      return data;
    });
  };

  const scheduleCellDelete = (cell: dia.Cell) => {
    scheduler.scheduleData((data) => {
      if (cell.isElement()) {
        return {
          ...data,
          elementsToUpdate: mapDelete(data.elementsToUpdate, cell.id),
          elementsToDelete: mapSet(data.elementsToDelete, cell.id, true),
        };
      }
      if (cell.isLink()) {
        return {
          ...data,
          linksToUpdate: mapDelete(data.linksToUpdate, cell.id),
          linksToDelete: mapSet(data.linksToDelete, cell.id, true),
        };
      }
      return data;
    });
  };

  const scheduleReset = (cells: dia.Cell[]) => {
    scheduler.scheduleData((data) => {
      const snapshot = store.getSnapshot();
      const { elements, links } = mapCellsToData(
        cells,
        graph,
        elementSelector,
        linkSelector,
        snapshot.elements as Record<dia.Cell.ID, Element>,
        snapshot.links as Record<dia.Cell.ID, Link>
      );

      return {
        ...data,
        elementsToUpdate: elements,
        linksToUpdate: links,
        elementsToDelete: findIdsToDelete(
          Object.keys(snapshot.elements),
          new Set(elements.keys()),
          data.elementsToDelete
        ),
        linksToDelete: findIdsToDelete(
          Object.keys(snapshot.links),
          new Set(links.keys()),
          data.linksToDelete
        ),
      };
    });
  };

  const scheduleCellsUpdate = (cells: dia.Cell[]) => {
    scheduler.scheduleData((data) => {
      const snapshot = store.getSnapshot();
      const { elements, links } = mapCellsToData(
        cells,
        graph,
        elementSelector,
        linkSelector,
        snapshot.elements as Record<dia.Cell.ID, Element>,
        snapshot.links as Record<dia.Cell.ID, Link>
      );
      return {
        ...data,
        elementsToUpdate: new Map([...(data.elementsToUpdate ?? []), ...elements]),
        linksToUpdate: new Map([...(data.linksToUpdate ?? []), ...links]),
      };
    });
  };

  // --- Event Handlers ---

  const handleCellChange = (change: OnChangeOptions): void => {
    if (change.options?.isUpdateFromReact) {
      return;
    }

    if (change.type === 'reset') {
      scheduleReset(change.cells);
      return;
    }

    if (change.type === 'remove') {
      scheduleCellDelete(change.cell);
      return;
    }

    scheduleCellUpdate(change.cell);
  };

  // --- Store Sync ---

  const updateGraphFromStore = () => {
    const snapshot = store.getSnapshot();
    const elements = removeDeepReadOnly(snapshot.elements);
    const links = removeDeepReadOnly(snapshot.links);

    // Skip sync if store is empty but graph has cells - the scheduler will populate store first
    const isStoreEmpty = Object.keys(elements).length === 0 && Object.keys(links).length === 0;
    const graphHasCells = graph.getElements().length > 0 || graph.getLinks().length > 0;
    if (isStoreEmpty && graphHasCells) {
      return;
    }

    const wasUpdated = updateGraph({
      graph,
      elements: elements as Record<string, Element>,
      links: links as Record<string, Link>,
      graphToElementSelector: elementSelector,
      graphToLinkSelector: linkSelector,
      mapDataToElementAttributes: mapDataToElementAttributes as (
        options: ElementToGraphOptions<Element> & { readonly graph: Graph }
      ) => dia.Cell.JSON,
      mapDataToLinkAttributes: mapDataToLinkAttributes as (
        options: LinkToGraphOptions<Link> & { readonly graph: Graph }
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

    scheduleCellsUpdate(allCells);
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
