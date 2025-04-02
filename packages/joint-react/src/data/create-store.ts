import { dia, shapes } from '@joint/core';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import { processLink, setCells } from '../utils/cell/set-cells';
import { getLinkTargetAndSourceIds } from '../utils/cell/get-link-targe-and-source-ids';
import type { GraphElementBase, GraphElements } from '../types/element-types';
import type { GraphLink, GraphLinks } from '../types/link-types';
import { subscribeHandler } from '../utils/subsribe-handler';
import { createStoreData } from './store-data';

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
  readonly defaultElements?: Array<dia.Element | GraphElementBase>;

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultLinks?: Array<dia.Link | GraphLink>;
  /**
   * Callback function to be called when the graph is loaded.
   * @param isLoaded
   * @returns
   */
  readonly onLoad?: (isLoaded: boolean) => void;
}

export interface Store {
  /**
   * The JointJS graph instance.
   */
  readonly graph: dia.Graph;
  /**
   * Subscribes to the store changes.
   */
  readonly subscribe: (onStoreChange: () => void) => () => void;
  /**
   * Get elements
   */
  readonly getElements: () => GraphElements<GraphElementBase>;
  /**
   * Get element by id
   */
  readonly getElement: (id: dia.Cell.ID) => GraphElementBase;
  /**
   *  Get links
   */
  readonly getLinks: () => GraphLinks;
  /**
   * Get link by id
   */
  readonly getLink: (id: dia.Cell.ID) => GraphLink;
  /**
   *  Remove all listeners and cleanup the graph.
   */
  readonly destroy: () => void;
  /**
   * Force update the graph.
   */
  readonly forceUpdate: () => void;
}

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
 * Hooks like `useSetElement` are just convenience helpers (**syntactic sugar**) that update the graph directly behind the scenes.
 * You can also access the graph yourself using `useGraph()` and call methods like `graph.setCells()` or any other JointJS method as needed and react will update it accordingly.
 *
 * @group Hooks
 * @internal
 *
 * @param options - Options for creating the graph store.
 * @returns The graph store instance.
 */
export function createStore(options?: StoreOptions): Store {
  const { defaultElements, defaultLinks, onLoad } = options || {};

  const graph = createGraph(options);
  const unsizedLinks = setCells({
    graph,
    defaultElements,
    defaultLinks,
  });
  const data = createStoreData();
  data.updateStore(graph);
  const listeners = subscribeHandler(forceUpdate);
  const unsubscribe = listenToCellChange(graph, onCellChange);
  graph.on('batch:stop', onBatchStop);

  function hasNodeSize(id?: dia.Cell.ID) {
    if (!id) {
      return false;
    }
    const sourceElement = graph.getCell(id) as dia.Element;
    const { width, height } = sourceElement.size();
    return !!(width > 1 && height > 1);
  }

  function forceUpdate() {
    data.updateStore(graph);
    if (unsizedLinks.size === 0) {
      onLoad?.(true);
      return;
    }

    for (const [id, link] of unsizedLinks) {
      const { source, target } = getLinkTargetAndSourceIds(link);
      if (!hasNodeSize(source)) {
        continue;
      }
      if (hasNodeSize(target)) {
        graph.addCell(processLink(link));
        unsizedLinks.delete(id);
      }
    }

    if (unsizedLinks.size === 0) {
      onLoad?.(true);
    }
  }

  function onCellChange() {
    if (graph.hasActiveBatch()) {
      return;
    }
    return listeners.notifySubscribers();
  }

  function onBatchStop() {
    listeners.notifySubscribers();
  }

  function destroy() {
    unsubscribe();
    graph.off('batch:stop', onBatchStop);
    graph.clear();
  }

  const store: Store = {
    forceUpdate,
    destroy,
    graph,
    subscribe: listeners.subscribe,
    getElements() {
      return data.elements;
    },
    getLinks() {
      return data.links;
    },
    getElement(id) {
      const item = data.elements.get(id);
      if (!item) {
        throw new Error(`Element with id ${id} not found`);
      }
      return item;
    },
    getLink(id) {
      const item = data.links.get(id);
      if (!item) {
        throw new Error(`Link with id ${id} not found`);
      }
      return item;
    },
  };
  return store;
}
