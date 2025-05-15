import { dia, shapes } from '@joint/core';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import { setElements } from '../utils/cell/set-cells';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { subscribeHandler } from '../utils/subscriber-handler';
import { createStoreData } from './create-store-data';
import type { CellMap } from '../utils/cell/cell-map';

export const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

export interface StoreOptions {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph;
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
  readonly initialElements?: Array<dia.Element | GraphElement>;

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly initialLinks?: Array<dia.Link | GraphLink>;
}

export interface Store {
  /**
   * The JointJS graph instance.
   */
  readonly graph: dia.Graph;
  /**
   * Subscribes to the store changes.
   */
  readonly subscribe: (onStoreChange: (changedIds?: Set<dia.Cell.ID>) => void) => () => void;

  /**
   * Get elements
   */
  readonly getElements: () => CellMap<GraphElement>;
  /**
   * Get element by id
   */
  readonly getElement: <Element extends GraphElement>(id: dia.Cell.ID) => Element;
  /**
   *  Get links
   */
  readonly getLinks: () => CellMap<GraphLink>;
  /**
   * Get link by id
   */
  readonly getLink: (id: dia.Cell.ID) => GraphLink;
  /**
   *  Remove all listeners and cleanup the graph.
   */
  readonly destroy: () => void;

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
function createGraph(options: StoreOptions = {}): dia.Graph {
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
  return newGraph;
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
export function createStore(options?: StoreOptions): Store {
  const { initialElements } = options || {};

  const graph = createGraph(options);
  // set elements to the graph
  setElements({
    graph,
    initialElements,
  });
  // create store data - caching the elements and links for the react
  const data = createStoreData();
  const elementsEvents = subscribeHandler(forceUpdate);

  const unsubscribe = listenToCellChange(graph, onCellChange);

  data.updateStore(graph);
  graph.on('batch:stop', onBatchStop);

  const measuredNodes = new Set<dia.Cell.ID>();

  /**
   * Force update the graph.
   * This function is called when the graph is updated.
   * It checks if there are any unsized links and processes them.
   * @returns changed ids
   */
  function forceUpdate(): Set<dia.Cell.ID> {
    return data.updateStore(graph);
  }
  /**
   * This function is called when a cell changes.
   * It checks if the graph has an active batch and returns if it does.
   * Otherwise, it notifies the subscribers of the elements events.
   * @param cell - The cell that changed.
   */
  function onCellChange() {
    if (graph.hasActiveBatch()) {
      return;
    }

    elementsEvents.notifySubscribers();
  }

  /**
   * This function is called when the batch stops.
   */
  function onBatchStop() {
    elementsEvents.notifySubscribers();
  }

  /**
   * Cleanup the store.
   */
  function destroy() {
    unsubscribe();
    graph.off('batch:stop', onBatchStop);
    graph.clear();
    data.destroy();
    measuredNodes.clear();
  }
  // Force update the graph to ensure it's in sync with the store.
  forceUpdate();

  const store: Store = {
    destroy,
    graph,
    subscribe: elementsEvents.subscribe,
    getElements() {
      return data.elements;
    },
    getLinks() {
      return data.links;
    },
    getElement<E extends GraphElement>(id: dia.Cell.ID) {
      const item = data.elements.get(id);

      if (!item) {
        throw new Error(`Element with id ${id} not found`);
      }
      return item as E;
    },
    getLink(id) {
      const item = data.links.get(id);
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
