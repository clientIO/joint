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
import { CONTROLLED_MODE_BATCH_NAME } from '../utils/graph/update-graph';

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
   * Get element by id
   */
  readonly getElement: <Element extends GraphElement>(id: dia.Cell.ID) => Element;
  /**
   *  Get links
   */
  readonly getLinks: () => GraphLink[];
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
   */
  readonly forceUpdateStore: () => UpdateResult;
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

// eslint-disable-next-line jsdoc/require-jsdoc
function isBatchNameObject(value: unknown): value is { batchName: string } {
  return typeof value === 'object' && value !== null && 'batchName' in value;
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
  graphData.updateStore(graph);

  // add method to handle batch stop, so then we can also notify all react components
  graph.on('batch:stop', onBatchStop);

  const measuredNodes = new Set<dia.Cell.ID>();

  /**
   * Force update the graph.
   * This function is called when the graph is updated.
   * It checks if there are any unsized links and processes them.
   * @returns changed ids
   * @param batchName - The name of the batch.
   */
  function forceUpdateStore(batchName?: string): UpdateResult {
    if (!graph) {
      // Create a new graph instance or use the provided one
      throw new Error('Graph instance is required');
    }

    const updateResult = graphData.updateStore(graph);
    // Skip processing changes in controlled mode since they are already handled.
    // This prevents circular calls to `onElementsChange`.
    // For example, if a user manages elements via React state and updates the graph using setElements,
    // this function will be triggered. However, we avoid re-triggering `onElementsChange` to prevent redundant updates.
    // We call `onElementsChange` and `onLinksChange` explicitly only when direct change on `dia.Graph` occurs.
    if (batchName !== CONTROLLED_MODE_BATCH_NAME) {
      if (onElementsChange && updateResult.areElementsChanged) {
        const mappedElements = graphData.elements.map((element) => element);
        onElementsChange(mappedElements as SetStateAction<Element[]>);
      }
      if (onLinksChange && updateResult.areLinksChanged) {
        const changedLinks = graphData.links.map((link) => link);
        onLinksChange(changedLinks as SetStateAction<Link[]>);
      }
    }
    return updateResult;
  }
  /**
   * This function is called when a cell changes.
   * It checks if the graph has an active batch and returns if it does.
   * Otherwise, it notifies the subscribers of the elements events.
   */
  function onCellChange() {
    if (!graph) {
      // Create a new graph instance or use the provided one
      throw new Error('Graph instance is required');
    }

    if (graph.hasActiveBatch()) {
      return;
    }

    elementsEvents.notifySubscribers();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, no-shadow, @typescript-eslint/no-shadow
  function onBatchStop(options?: unknown) {
    if (!isBatchNameObject(options)) {
      elementsEvents.notifySubscribers();
      return;
    }
    const { batchName } = options;

    elementsEvents.notifySubscribers(batchName);
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
      return graphData.elements;
    },
    getLinks() {
      return graphData.links;
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
