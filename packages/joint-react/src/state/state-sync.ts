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
import type { GraphSchedulerData } from '../types/scheduler.types';
import type { Scheduler } from '../utils/scheduler';
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
  readonly store: Omit<ExternalStoreLike<GraphStoreSnapshot<ElementData, LinkData>>, 'setState'>;
  readonly scheduler: Scheduler<GraphSchedulerData>;
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
 * Finds IDs to delete by comparing current snapshot with new IDs.
 * @param currentIds
 * @param newIds
 * @param existingDeletes
 */
function findIdsToDelete(
  currentIds: string[],
  newIds: Set<CellId>,
  existingDeletes: Map<CellId, true> | undefined
): Map<CellId, true> {
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
  ElementData = FlatElementData,
  LinkData = FlatLinkData,
>(options: StateSyncOptions<Graph, ElementData, LinkData>): StateSync {
  const {
    graph,
    store,
    scheduler,
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

  // --- Scheduling ---

  const scheduleCellUpdate = (cell: dia.Cell) => {
    scheduler.scheduleData((data) => {
      const id = cell.id as CellId;
      const snapshot = store.getSnapshot();
      if (cell.isElement()) {
        const previousData = snapshot.elements[id] as ElementData | undefined;
        return {
          ...data,
          elementsToUpdate: mapSet(
            data.elementsToUpdate,
            id,
            mapGraphElement(cell, graph, elementSelector, previousData) as FlatElementData
          ),
        };
      }
      if (cell.isLink()) {
        const previousData = snapshot.links[id] as LinkData | undefined;
        return {
          ...data,
          linksToUpdate: mapSet(
            data.linksToUpdate,
            id,
            mapGraphLink(cell, graph, linkSelector, previousData) as FlatLinkData
          ),
        };
      }
      return data;
    });
  };

  const scheduleCellDelete = (cell: dia.Cell) => {
    scheduler.scheduleData((data) => {
      const id = cell.id as CellId;
      if (cell.isElement()) {
        return {
          ...data,
          elementsToUpdate: mapDelete(data.elementsToUpdate, id),
          elementsToDelete: mapSet(data.elementsToDelete, id, true),
        };
      }
      if (cell.isLink()) {
        return {
          ...data,
          linksToUpdate: mapDelete(data.linksToUpdate, id),
          linksToDelete: mapSet(data.linksToDelete, id, true),
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
        snapshot.elements as Record<CellId, ElementData>,
        snapshot.links as Record<CellId, LinkData>
      );

      return {
        ...data,
        elementsToUpdate: elements as Map<CellId, FlatElementData>,
        linksToUpdate: links as Map<CellId, FlatLinkData>,
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
        snapshot.elements as Record<CellId, ElementData>,
        snapshot.links as Record<CellId, LinkData>
      );
      return {
        ...data,
        elementsToUpdate: new Map([...(data.elementsToUpdate ?? []), ...(elements as Map<CellId, FlatElementData>)]),
        linksToUpdate: new Map([...(data.linksToUpdate ?? []), ...(links as Map<CellId, FlatLinkData>)]),
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
