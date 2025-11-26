/* eslint-disable unicorn/prefer-query-selector */
import { dia, shapes } from '@joint/core';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import { setElements, setLinks } from '../utils/cell/cell-utilities';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { subscribeHandler } from '../utils/subscriber-handler';
import { createStoreData, type UpdateResult } from './create-store-data';
import type { Dispatch, SetStateAction } from 'react';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = { ...shapes, ReactElement };

export interface StoreOptions<
  Graph extends dia.Graph,
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
> {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: Graph;
  /**
   * Namespace for cell models.
   * @default shapes
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown;
  /**
   * Custom cell model to use.
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cellModel?: typeof dia.Cell;
  /**
   * Initial elements to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly elements?: Element[];

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly links?: Link[];
  /**
   * Callback triggered when elements (nodes) change.
   * Providing this prop enables controlled mode for elements.
   * If specified, this function will override the default behavior, allowing you to manage all element changes manually instead of relying on `graph.change`.
   */
  readonly onElementsChange?: Dispatch<SetStateAction<Element[]>>;

  /**
   * Callback triggered when links (edges) change.
   * Providing this prop enables controlled mode for links.
   * If specified, this function will override the default behavior, allowing you to manage all link changes manually instead of relying on `graph.change`.
   */
  readonly onLinksChange?: Dispatch<SetStateAction<Link[]>>;
}

export interface GraphStore<Graph extends dia.Graph = dia.Graph> {
  /**
   * The JointJS graph instance.
   */
  readonly graph: Graph;
  /**
   * Subscribes to the store changes.
   */
  readonly subscribe: (onStoreChange: (changedIds?: UpdateResult) => void) => () => void;

  /**
   * Get elements
   */
  readonly getElements: () => GraphElement[];

  /**
   *
   * @param elements - New elements to set in the graph.
   * @returns
   */

  readonly setElements: <Element extends GraphElement>(elements: Element[]) => void;
  /**
   * Get element by id
   */
  readonly getElement: <Element extends GraphElement>(id: dia.Cell.ID) => Element;
  /**
   *  Get links
   */
  readonly getLinks: () => GraphLink[];
  /**
   * Set links
   */
  readonly setLinks: (links: GraphLink[]) => void;
  /**
   * Get link by id
   */
  readonly getLink: (id: dia.Cell.ID) => GraphLink;
  /**
   *  Remove all listeners and cleanup the graph.
   */
  readonly destroy: (isGraphExternal: boolean) => void;

  /**
   * Set the measured node element.
   * For safety, each node, can use only one measured node, do not matter how many papers the graph is using,
   * only one paper and one node can use measured node, otherwise it can lead to unexpected behavior
   * when many nodes or same node with many measuredNodes try to adjust the size.
   */
  readonly setMeasuredNode: (id: dia.Cell.ID) => () => void;

  /**
   * Check if the graph has already measured node for the given element id.
   */
  readonly hasMeasuredNode: (id: dia.Cell.ID) => boolean;

  /**
   * Force update the graph store.
   * This will trigger a re-render of all components that are subscribed to the store.
   * @param batchName - The name of the batch (unused in new implementation, kept for compatibility).
   * @param skipGraphUpdate - If true, skip updating from graph (used when store was already updated from external data).
   */
  readonly forceUpdateStore: (batchName?: string, skipGraphUpdate?: boolean) => UpdateResult;

  /**
   * Update store from external data (React state) in controlled mode.
   * @param elements - The elements from React state.
   * @param links - The links from React state.
   * @returns The update result.
   */
  readonly updateStoreFromExternalData: (
    elements: GraphElement[],
    links: GraphLink[]
  ) => UpdateResult;
}

/**
 * Create a new graph instance.
 * @param options - Options for creating the graph.
 * @returns The created graph instance.
 * @group Graph
 * @internal
 * @example
 * ```ts
 * const graph = createGraph();
 * console.log(graph);
 * ```
 */
function createGraph<
  Graph extends dia.Graph = dia.Graph,
  Element extends dia.Element | GraphElement = dia.Element | GraphElement,
  Link extends dia.Link | GraphLink = dia.Link | GraphLink,
>(options: StoreOptions<Graph, Element, Link> = {}): Graph {
  const { cellModel, cellNamespace = DEFAULT_CELL_NAMESPACE, graph } = options;
  const newGraph =
    graph ??
    new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
          // @ts-expect-error Shapes is not a valid type for cellNamespace
          ...cellNamespace,
        },
        cellModel,
      }
    );
  return newGraph as Graph;
}

/**
 * Building block of `@joint/react`.
 * It listen to cell changes and updates UI based on the `dia.graph` changes.
 * It use `useSyncExternalStore` to avoid memory leaks and state duplicates.
 *
 * Under the hood, @joint/react works by listening to changes in the `dia.Graph` via this store. `dia.graph` is the single source of truth.
 * When you update something—like adding or modifying cells—you do it directly through the `dia.Graph` API, just like in a standard JointJS app.
 * React components automatically observe and react to changes in the graph, keeping the UI in sync via `useSyncExternalStore` API.
 * Hooks like `useUpdateElement` are just convenience helpers (**syntactic sugar**) that update the graph directly behind the scenes.
 * You can also access the graph yourself using `useGraph()` and call methods like `graph.setCells()` or any other JointJS method as needed and react will update it accordingly.
 * @group Data
 * @internal
 * @param options - Options for creating the graph store.
 * @returns The graph store instance.
 * @example
 * ```ts
 * const { graph, forceUpdate, subscribe } = createStore();
 * const unsubscribe = subscribe(() => {
 *   console.log('Graph changed');
 * });
 * graph.addCell(new joint.shapes.standard.Rectangle());
 * forceUpdate();
 * unsubscribe();
 * ```
 */
export function createStoreWithGraph<
  Graph extends dia.Graph,
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
>(options?: StoreOptions<Graph, Element, Link>): GraphStore<Graph> {
  const { elements, links, graph, onElementsChange, onLinksChange } = options || {};

  if (!graph) {
    // Create a new graph instance or use the provided one
    throw new Error('Graph instance is required');
  }

  // Detect controlled mode
  const isControlled = !!(onElementsChange || onLinksChange);
  const isElementsControlled = !!onElementsChange;
  const isLinksControlled = !!onLinksChange;

  // Track if we're currently syncing from React state to graph (to prevent circular updates)
  let isSyncingFromReactState = false;

  // set elements to the graph
  setElements({
    graph,
    elements,
  });

  setLinks({
    graph,
    links,
  });

  // create store data - caching the elements and links for the react
  const graphData = createStoreData();
  // listen to dia.graph cell changes and trigger `onCellChange` where there is change occurs in graph
  const unsubscribe = listenToCellChange(graph, onCellChange);
  // elements events notify all react components using `useSyncExternalStore`
  const elementsEvents = subscribeHandler(forceUpdateStore);

  // Notify subscribers of initial elements
  // In both controlled and uncontrolled modes, initial store is populated from graph
  graphData.updateStore(graph);

  // add method to handle batch stop, so then we can also notify all react components
  graph.on('batch:stop', onBatchStop);

  const measuredNodes = new Set<dia.Cell.ID>();
  const { dataRef } = graphData;

  // Store the last UpdateResult from external data updates for controlled mode
  let lastExternalUpdateResult: UpdateResult | undefined;
  /**
   * Force update the graph.
   * This function is called when the graph is updated.
   * In controlled mode, only syncs graph → React state when changes come from user interaction.
   * In uncontrolled mode, updates store from graph.
   * @returns changed ids
   * @param batchName - The name of the batch (unused in new implementation, kept for compatibility).
   * @param skipGraphUpdate - If true, skip updating from graph (used when store was already updated from external data).
   */
  function forceUpdateStore(batchName?: string, skipGraphUpdate = false): UpdateResult {
    if (!graph) {
      // Create a new graph instance or use the provided one
      throw new Error('Graph instance is required');
    }

    let updateResult: UpdateResult;

    // In controlled mode, if we're syncing from React state, don't update store from graph
    // The store will be updated directly from React state instead
    if (isControlled && (isSyncingFromReactState || skipGraphUpdate)) {
      // Store was already updated from React state, use the stored result
      updateResult = lastExternalUpdateResult ?? {
        diffIds: new Set(),
        areElementsChanged: false,
        areLinksChanged: false,
      };
      // Clear the stored result after using it
      lastExternalUpdateResult = undefined;
    } else {
      // Update store from graph (uncontrolled mode, or controlled mode with user-initiated changes)
      updateResult = graphData.updateStore(graph);

      // In controlled mode, sync graph → React state only when changes come from user interaction
      // (not when we're syncing from React state)
      if (isControlled && !isSyncingFromReactState) {
        if (isElementsControlled && updateResult.areElementsChanged) {
          const mappedElements = dataRef.elements.map((element) => element);
          onElementsChange(mappedElements as SetStateAction<Element[]>);
        }
        if (isLinksControlled && updateResult.areLinksChanged) {
          const changedLinks = dataRef.links.map((link) => link);
          onLinksChange(changedLinks as SetStateAction<Link[]>);
        }
      }
    }

    return updateResult;
  }

  /**
   * Update store from external data (React state) in controlled mode.
   * This is called when React state changes and we need to update the store cache.
   * @param newElements - The elements from React state.
   * @param newLinks - The links from React state.
   * @returns The update result.
   */
  /**
   * Helper to notify subscribers with a specific UpdateResult (for controlled mode)
   * @param updateResult - The update result to notify subscribers with.
   */
  function notifySubscribersWithResult(updateResult: UpdateResult) {
    // Store the result so forceUpdateStore can use it when called as beforeSubscribe
    lastExternalUpdateResult = updateResult;
    // Trigger notification - this will call forceUpdateStore as beforeSubscribe
    elementsEvents.notifySubscribers();
  }

  /**
   * Update store from external data (React state) in controlled mode.
   * This is called when React state changes and we need to update the store cache.
   * @param newElements - The elements from React state.
   * @param newLinks - The links from React state.
   * @returns The update result.
   */
  function updateStoreFromExternalData(
    newElements: GraphElement[],
    newLinks: GraphLink[]
  ): UpdateResult {
    const result = graphData.updateFromExternalData(newElements, newLinks);
    // Notify subscribers with the update result
    if (result.areElementsChanged || result.areLinksChanged) {
      notifySubscribersWithResult(result);
    }
    return result;
  }
  /**
   * This function is called when a cell changes.
   * It checks if the graph has an active batch and returns if it does.
   * Otherwise, it notifies the subscribers of the elements events.
   * In controlled mode, only triggers when changes come from user interaction.
   */
  function onCellChange() {
    if (!graph) {
      // Create a new graph instance or use the provided one
      throw new Error('Graph instance is required');
    }

    // In controlled mode, skip if we're syncing from React state
    if (isControlled && isSyncingFromReactState) {
      return;
    }

    if (graph.hasActiveBatch()) {
      return;
    }

    elementsEvents.notifySubscribers();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  function onBatchStop(_options?: unknown) {
    // In controlled mode, skip if we're syncing from React state
    if (isControlled && isSyncingFromReactState) {
      return;
    }
    elementsEvents.notifySubscribers();
  }

  /**
   * Cleanup the store.
   * @param isGraphExternal - If true, the graph is external and should not be cleared.
   */
  function destroy(isGraphExternal: boolean) {
    if (!graph) {
      // Create a new graph instance or use the provided one
      throw new Error('Graph instance is required');
    }
    unsubscribe();
    graph.off('batch:stop', onBatchStop);
    graphData.destroy();
    measuredNodes.clear();
    if (isGraphExternal) {
      return;
    }
    graph.clear();
  }
  // Force update the graph to ensure it's in sync with the store.
  forceUpdateStore();

  const store: GraphStore<Graph> = {
    forceUpdateStore,
    destroy,
    graph,
    subscribe: elementsEvents.subscribe,
    getElements() {
      return dataRef.elements;
    },
    setElements(newElements) {
      // In controlled mode, mark that we're syncing from React state
      if (isControlled) {
        isSyncingFromReactState = true;
      }
      try {
        setElements({ graph, elements: newElements });
      } finally {
        if (isControlled) {
          // Reset flag after a microtask to allow batch operations to complete
          Promise.resolve().then(() => {
            isSyncingFromReactState = false;
          });
        }
      }
    },
    setLinks(newLinks) {
      // In controlled mode, mark that we're syncing from React state
      if (isControlled) {
        isSyncingFromReactState = true;
      }
      try {
        setLinks({ graph, links: newLinks });
      } finally {
        if (isControlled) {
          // Reset flag after a microtask to allow batch operations to complete
          Promise.resolve().then(() => {
            isSyncingFromReactState = false;
          });
        }
      }
    },
    getLinks() {
      return dataRef.links;
    },
    getElement<E extends GraphElement>(id: dia.Cell.ID) {
      const item = graphData.getElementById(id);

      if (!item) {
        throw new Error(`Element with id ${id} not found`);
      }
      return item as E;
    },
    getLink(id) {
      const item = graphData.getLinkById(id);
      if (!item) {
        throw new Error(`Link with id ${id} not found`);
      }
      return item;
    },
    setMeasuredNode(id: dia.Cell.ID) {
      measuredNodes.add(id);
      return () => {
        measuredNodes.delete(id);
      };
    },
    hasMeasuredNode(id: dia.Cell.ID) {
      return measuredNodes.has(id);
    },
    updateStoreFromExternalData,
  };
  return store;
}

/**
 * Building block of `@joint/react`.
 * It listen to cell changes and updates UI based on the `dia.graph` changes.
 * It use `useSyncExternalStore` to avoid memory leaks and state duplicates.
 *
 * Under the hood, @joint/react works by listening to changes in the `dia.Graph` via this store. `dia.graph` is the single source of truth.
 * When you update something—like adding or modifying cells—you do it directly through the `dia.Graph` API, just like in a standard JointJS app.
 * React components automatically observe and react to changes in the graph, keeping the UI in sync via `useSyncExternalStore` API.
 * Hooks like `useUpdateElement` are just convenience helpers (**syntactic sugar**) that update the graph directly behind the scenes.
 * You can also access the graph yourself using `useGraph()` and call methods like `graph.setCells()` or any other JointJS method as needed and react will update it accordingly.
 * @group Data
 * @internal
 * @param options - Options for creating the graph store.
 * @returns The graph store instance.
 * @example
 * ```ts
 * const { graph, forceUpdate, subscribe } = createStore();
 * const unsubscribe = subscribe(() => {
 *   console.log('Graph changed');
 * });
 * graph.addCell(new joint.shapes.standard.Rectangle());
 * forceUpdate();
 * unsubscribe();
 * ```
 */
export function createStore<
  Graph extends dia.Graph,
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
>(options?: StoreOptions<Graph, Element, Link>): GraphStore<Graph> {
  const graph = createGraph<Graph, Element, Link>(options);
  return createStoreWithGraph<Graph, Element, Link>({
    ...options,
    graph,
  });
}
